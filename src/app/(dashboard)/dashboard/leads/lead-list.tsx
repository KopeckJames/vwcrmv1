"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
    MapPin,
    Phone,
    Mail,
    Building2,
    Search,
    Filter,
    Plus,
    Loader2,
    Save,
    ArrowUpDown,
    CheckSquare,
    UserPlus,
    X
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface Lead {
    id: string;
    firstName: string;
    lastName: string;
    company?: string | null;
    jobTitle?: string | null;
    status: string;
    email?: string | null;
    phone?: string | null;
    city?: string | null;
    state?: string | null;
    zipCode?: string | null;
    photoUrl?: string | null;
    estimatedValue?: number | null;
    createdAt: Date | string;
    assignedToId?: string | null;
    assignedTo?: {
        id: string;
        name?: string | null;
        image?: string | null;
        role?: string | null;
    } | null;
    assignedAdminId?: string | null;
    assignedAdmin?: {
        id: string;
        name?: string | null;
        image?: string | null;
        role?: string | null;
    } | null;
}

interface User {
    id: string;
    name: string | null;
    email: string | null;
}

const statusColors: Record<string, "default" | "info" | "warning" | "success" | "danger" | "secondary"> = {
    NEW: "info",
    CONTACTED: "secondary",
    QUALIFIED: "success",
    UNQUALIFIED: "warning",
    CONVERTED: "success",
    DEAD: "danger",
};

const statusLabels: Record<string, string> = {
    NEW: "New",
    CONTACTED: "Contacted",
    QUALIFIED: "Qualified",
    UNQUALIFIED: "Unqualified",
    CONVERTED: "Converted",
    DEAD: "Dead",
};

interface LeadListProps {
    initialLeads: Lead[];
}

export function LeadList({ initialLeads = [] }: LeadListProps) {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("ALL");
    const [sortField, setSortField] = useState<"createdAt" | "zipCode" | "name">("createdAt");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [newLead, setNewLead] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        company: "",
        status: "NEW",
    });

    // Reassignment state
    const [isReassignOpen, setIsReassignOpen] = useState(false);
    const [isBulkReassignOpen, setIsBulkReassignOpen] = useState(false);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [targetUserId, setTargetUserId] = useState<string>("");
    const [users, setUsers] = useState<User[]>([]);
    const [isReassigning, setIsReassigning] = useState(false);

    // Fetch users for assignment
    const fetchUsers = async () => {
        try {
            const res = await fetch("/api/users");
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (error) {
            console.error("Failed to fetch users:", error);
        }
    };

    const handleReassign = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedLead || !targetUserId) return;

        setIsReassigning(true);
        try {
            const res = await fetch(`/api/leads/${selectedLead.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ assignedToId: targetUserId }),
            });
            if (res.ok) {
                setIsReassignOpen(false);
                setSelectedLead(null);
                setTargetUserId("");
                router.refresh();
            }
        } catch (error) {
            console.error("Failed to reassign lead:", error);
        } finally {
            setIsReassigning(false);
        }
    };

    const handleBulkReassign = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedIds.size === 0 || !targetUserId) return;

        setIsReassigning(true);
        try {
            const res = await fetch("/api/leads/bulk-assign", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    leadIds: Array.from(selectedIds),
                    assignedToId: targetUserId
                }),
            });
            if (res.ok) {
                setIsBulkReassignOpen(false);
                setSelectedIds(new Set());
                setTargetUserId("");
                router.refresh();
            }
        } catch (error) {
            console.error("Failed to bulk reassign leads:", error);
        } finally {
            setIsReassigning(false);
        }
    };

    const openReassignDialog = (lead: Lead) => {
        setSelectedLead(lead);
        setTargetUserId(lead.assignedToId || "");
        setIsReassignOpen(true);
        fetchUsers();
    };

    const handleQuickAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const res = await fetch("/api/leads", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newLead),
            });
            if (res.ok) {
                setIsQuickAddOpen(false);
                setNewLead({
                    firstName: "",
                    lastName: "",
                    email: "",
                    phone: "",
                    company: "",
                    status: "NEW",
                });
                router.refresh();
            }
        } catch (error) {
            console.error("Failed to add lead:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const toggleSelection = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const toggleSelectAll = (leads: Lead[]) => {
        if (leads.length === 0) return;

        const allFilteredInSelection = leads.every(lead => selectedIds.has(lead.id));

        if (allFilteredInSelection) {
            const newSelected = new Set(selectedIds);
            leads.forEach(lead => newSelected.delete(lead.id));
            setSelectedIds(newSelected);
        } else {
            const newSelected = new Set(selectedIds);
            leads.forEach(lead => newSelected.add(lead.id));
            setSelectedIds(newSelected);
        }
    };

    const filteredLeads = useMemo(() => {
        const safeLeads = Array.isArray(initialLeads) ? initialLeads : [];
        let result = safeLeads.filter((lead: Lead) => {
            const firstName = lead.firstName || "";
            const lastName = lead.lastName || "";
            const nameMatch = `${firstName} ${lastName}`.toLowerCase().includes(searchQuery.toLowerCase());
            const emailMatch = lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
            const companyMatch = lead.company?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
            const zipMatch = lead.zipCode?.includes(searchQuery) || false;

            const matchesSearch = nameMatch || emailMatch || companyMatch || zipMatch;
            const matchesStatus = statusFilter === "ALL" || lead.status === statusFilter;

            return matchesSearch && matchesStatus;
        });

        // Sorting
        result.sort((a, b) => {
            let valA, valB;
            if (sortField === "createdAt") {
                valA = new Date(a.createdAt).getTime();
                valB = new Date(b.createdAt).getTime();
            } else if (sortField === "zipCode") {
                valA = a.zipCode || "";
                valB = b.zipCode || "";
            } else {
                valA = `${a.firstName} ${a.lastName}`.toLowerCase();
                valB = `${b.firstName} ${b.lastName}`.toLowerCase();
            }

            if (valA < valB) return sortOrder === "asc" ? -1 : 1;
            if (valA > valB) return sortOrder === "asc" ? 1 : -1;
            return 0;
        });

        return result;
    }, [initialLeads, searchQuery, statusFilter, sortField, sortOrder]);

    const isAllSelected = filteredLeads.length > 0 && filteredLeads.every(lead => selectedIds.has(lead.id));

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 bg-white dark:bg-slate-900 p-3 md:p-4 rounded-xl border shadow-sm sticky top-0 z-20">
                <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between">
                    <div className="flex flex-col md:flex-row gap-3 md:items-center flex-1">
                        <div className="flex items-center gap-2 shrink-0">
                            <Filter className="h-4 w-4 text-slate-500" />
                            <h2 className="font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">Leads</h2>
                        </div>

                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search leads or zip..."
                                className="pl-9 h-10 border-slate-200 dark:border-slate-800"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <Select value={sortField} onValueChange={(v: any) => setSortField(v)}>
                                <SelectTrigger className="h-10 w-[140px] border-slate-200 dark:border-slate-800">
                                    <div className="flex items-center gap-2">
                                        <ArrowUpDown className="h-3.5 w-3.5 text-slate-500" />
                                        <span>{sortField === "createdAt" ? "Date" : sortField === "zipCode" ? "Zip Code" : "Name"}</span>
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="createdAt">Date Created</SelectItem>
                                    <SelectItem value="zipCode">Zip Code</SelectItem>
                                    <SelectItem value="name">Name</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-10 w-10 border-slate-200 dark:border-slate-800"
                                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                            >
                                <ArrowUpDown className={cn("h-4 w-4 transition-transform", sortOrder === "desc" && "rotate-180")} />
                            </Button>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            className="flex-1 md:flex-none h-10 border-slate-200 dark:border-slate-800"
                            onClick={() => toggleSelectAll(filteredLeads)}
                        >
                            <CheckSquare className="h-4 w-4 mr-2" />
                            {isAllSelected ? "Deselect All" : "Select All"}
                        </Button>
                        <Dialog open={isQuickAddOpen} onOpenChange={setIsQuickAddOpen}>
                            <DialogTrigger asChild>
                                <Button className="flex-1 md:flex-none h-10">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Quick Add
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md w-[95vw] overflow-y-auto max-h-[90vh] rounded-2xl">
                                <DialogHeader>
                                    <DialogTitle>Quick Add Lead</DialogTitle>
                                    <DialogDescription>
                                        Create a new lead record quickly.
                                    </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleQuickAdd} className="space-y-4 py-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="q-firstName">First Name</Label>
                                            <Input
                                                id="q-firstName"
                                                value={newLead.firstName}
                                                onChange={(e) => setNewLead({ ...newLead, firstName: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="q-lastName">Last Name</Label>
                                            <Input
                                                id="q-lastName"
                                                value={newLead.lastName}
                                                onChange={(e) => setNewLead({ ...newLead, lastName: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="q-email">Email</Label>
                                        <Input
                                            id="q-email"
                                            type="email"
                                            value={newLead.email}
                                            onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="q-company">Company</Label>
                                        <Input
                                            id="q-company"
                                            value={newLead.company}
                                            onChange={(e) => setNewLead({ ...newLead, company: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="q-status">Status</Label>
                                        <Select
                                            value={newLead.status}
                                            onValueChange={(v) => setNewLead({ ...newLead, status: v })}
                                        >
                                            <SelectTrigger id="q-status">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.entries(statusLabels).map(([value, label]) => (
                                                    <SelectItem key={value} value={value}>
                                                        {label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <DialogFooter>
                                        <Button type="submit" disabled={isSaving} className="w-full">
                                            {isSaving ? (
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            ) : (
                                                <Save className="h-4 w-4 mr-2" />
                                            )}
                                            Save Lead
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 no-scrollbar scroll-smooth">
                    <Button
                        variant={statusFilter === "ALL" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setStatusFilter("ALL")}
                        className="h-8 rounded-full whitespace-nowrap shrink-0"
                    >
                        All
                    </Button>
                    {Object.entries(statusLabels).map(([value, label]) => (
                        <Button
                            key={value}
                            variant={statusFilter === value ? "default" : "outline"}
                            size="sm"
                            onClick={() => setStatusFilter(value)}
                            className="h-8 rounded-full whitespace-nowrap shrink-0"
                        >
                            {label}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Bulk Action Toolbar */}
            {selectedIds.size > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-3 rounded-full shadow-2xl flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4">
                    <span className="text-sm font-medium mr-2">
                        {selectedIds.size} leads selected
                    </span>
                    <div className="h-6 w-px bg-slate-700" />
                    <Button
                        size="sm"
                        variant="ghost"
                        className="text-white hover:bg-slate-800"
                        onClick={() => {
                            setIsBulkReassignOpen(true);
                            fetchUsers();
                        }}
                    >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Bulk Reassign
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="text-white hover:bg-slate-800 p-1 rounded-full h-8 w-8"
                        onClick={() => setSelectedIds(new Set())}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}

            {/* Bulk Reassignment Dialog */}
            <Dialog open={isBulkReassignOpen} onOpenChange={setIsBulkReassignOpen}>
                <DialogContent className="max-w-md w-[95vw] rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>Bulk Reassign Leads</DialogTitle>
                        <DialogDescription>
                            Transfer {selectedIds.size} selected leads to another user.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleBulkReassign} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="bulkTargetUser">Select User</Label>
                            <Select
                                value={targetUserId}
                                onValueChange={setTargetUserId}
                            >
                                <SelectTrigger id="bulkTargetUser">
                                    <SelectValue placeholder="Select a user" />
                                </SelectTrigger>
                                <SelectContent>
                                    {users.map((user) => (
                                        <SelectItem key={user.id} value={user.id}>
                                            {user.name || user.email}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={isReassigning || !targetUserId} className="w-full">
                                {isReassigning ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4 mr-2" />
                                )}
                                Confirm Bulk Reassignment
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={isReassignOpen} onOpenChange={setIsReassignOpen}>
                <DialogContent className="max-w-md w-[95vw] rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>Reassign Lead</DialogTitle>
                        <DialogDescription>
                            Transfer this lead to another user.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleReassign} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="targetUser">Select User</Label>
                            <Select
                                value={targetUserId}
                                onValueChange={setTargetUserId}
                            >
                                <SelectTrigger id="targetUser">
                                    <SelectValue placeholder="Select a user" />
                                </SelectTrigger>
                                <SelectContent>
                                    {users.map((user) => (
                                        <SelectItem key={user.id} value={user.id}>
                                            {user.name || user.email}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={isReassigning || !targetUserId} className="w-full">
                                {isReassigning ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4 mr-2" />
                                )}
                                Confirm Reassignment
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <div className="grid gap-3 md:gap-4">
                {filteredLeads.map((lead) => (
                    <Card
                        key={lead.id}
                        className={cn(
                            "hover:shadow-md transition-all border-l-4 overflow-hidden relative",
                            selectedIds.has(lead.id) ? "border-blue-500 bg-blue-50/30 dark:bg-blue-900/10 shadow-sm" : "border-slate-200"
                        )}
                        style={{ borderLeftColor: lead.status === 'NEW' ? '#0ea5e9' : lead.status === 'QUALIFIED' ? '#10b981' : undefined }}
                    >
                        <div className="absolute top-3 left-3 z-10">
                            <Checkbox
                                checked={selectedIds.has(lead.id)}
                                onCheckedChange={() => toggleSelection(lead.id)}
                                className="h-5 w-5 bg-white shadow-sm"
                            />
                        </div>
                        <Link href={`/dashboard/leads/${lead.id}`} className="block">
                            <CardContent className="p-3 md:p-4 pl-10 md:pl-12">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-start gap-3 md:gap-4 flex-1 min-w-0">
                                        <Avatar
                                            fallback={`${lead.firstName?.[0] || ""}${lead.lastName?.[0] || ""}` || "?"}
                                            className="h-10 w-10 md:h-12 md:w-12 shrink-0"
                                        />
                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                                                {lead.firstName || "Unknown"} {lead.lastName || "Lead"}
                                            </h3>
                                            {lead.company && (
                                                <div className="flex items-center gap-1 text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                                                    <Building2 className="h-3 w-3 md:h-3.5 md:w-3.5" />
                                                    {lead.company}
                                                </div>
                                            )}
                                            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-1 sm:gap-4 mt-2 text-xs md:text-sm text-slate-500 dark:text-slate-400">
                                                {lead.email && (
                                                    <div className="flex items-center gap-1 truncate">
                                                        <Mail className="h-3 w-3 md:h-3.5 md:w-3.5" />
                                                        {lead.email}
                                                    </div>
                                                )}
                                                {lead.phone && (
                                                    <div className="flex items-center gap-1">
                                                        <Phone className="h-3 w-3 md:h-3.5 md:w-3.5" />
                                                        {lead.phone}
                                                    </div>
                                                )}
                                                {(lead.city || lead.zipCode) && (
                                                    <div className="flex items-center gap-1 truncate font-medium text-slate-700 dark:text-slate-300">
                                                        <MapPin className="h-3 w-3 md:h-3.5 md:w-3.5" />
                                                        {lead.city && <span>{lead.city}, {lead.state} </span>}
                                                        {lead.zipCode && <Badge variant="secondary" className="px-1.5 py-0 h-4 text-[10px] ml-1">{lead.zipCode}</Badge>}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2 shrink-0">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                openReassignDialog(lead);
                                            }}
                                            className="h-8 text-xs text-slate-500 hover:text-blue-600"
                                        >
                                            Reassign
                                        </Button>
                                        <Badge variant={(statusColors[lead.status] || "default") as "default" | "info" | "warning" | "success" | "danger" | "secondary"}>
                                            {statusLabels[lead.status] || lead.status}
                                        </Badge>
                                        {lead.assignedTo && (
                                            <div className="flex items-center gap-1.5 mt-1">
                                                <span className="text-[10px] text-slate-400">Rep:</span>
                                                <Avatar
                                                    src={lead.assignedTo.image ?? undefined}
                                                    fallback={lead.assignedTo.name?.[0] || "U"}
                                                    className="h-5 w-5"
                                                />
                                            </div>
                                        )}
                                        {lead.assignedAdmin && (
                                            <div className="flex items-center gap-1.5 mt-1">
                                                <span className="text-[10px] text-slate-400">Admin:</span>
                                                <Avatar
                                                    src={lead.assignedAdmin.image ?? undefined}
                                                    fallback={lead.assignedAdmin.name?.[0] || "A"}
                                                    className="h-5 w-5"
                                                />
                                            </div>
                                        )}
                                        {lead.photoUrl && (
                                            <div className="mt-1 w-12 h-9 md:w-16 md:h-12 rounded overflow-hidden border shadow-sm shrink-0">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={lead.photoUrl}
                                                    alt="Photo"
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        )}
                                        {lead.estimatedValue && (
                                            <span className="text-xs md:text-sm font-semibold text-slate-900 dark:text-slate-100 mt-auto">
                                                ${lead.estimatedValue.toLocaleString()}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Link>
                    </Card>
                ))}

                {filteredLeads.length === 0 && (
                    <Card className="bg-slate-50 dark:bg-slate-900/50 border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <Search className="h-10 w-10 text-slate-300 mb-4" />
                            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">No leads found</h3>
                            <p className="text-slate-500 dark:text-slate-400">Try adjusting your filters or search terms.</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
