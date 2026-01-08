"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { MapPin, Phone, Mail, Building2, Search, Filter, Plus, Loader2, Save } from "lucide-react";
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
    photoUrl?: string | null;
    estimatedValue?: number | null;
    createdAt: Date | string;
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

    const filteredLeads = useMemo(() => {
        const safeLeads = Array.isArray(initialLeads) ? initialLeads : [];
        return safeLeads.filter((lead: Lead) => {
            const firstName = lead.firstName || "";
            const lastName = lead.lastName || "";
            const nameMatch = `${firstName} ${lastName}`.toLowerCase().includes(searchQuery.toLowerCase());
            const emailMatch = lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
            const companyMatch = lead.company?.toLowerCase().includes(searchQuery.toLowerCase()) || false;

            const matchesSearch = nameMatch || emailMatch || companyMatch;
            const matchesStatus = statusFilter === "ALL" || lead.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [initialLeads, searchQuery, statusFilter]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border">
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="flex items-center gap-2">
                        <Filter className="h-5 w-5 text-slate-500" />
                        <h2 className="font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">Filter</h2>
                    </div>
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search leads..."
                            className="pl-10 h-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-1 overflow-x-auto pb-1 md:pb-0">
                        <Button
                            variant={statusFilter === "ALL" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setStatusFilter("ALL")}
                            className="h-8 rounded-full"
                        >
                            All
                        </Button>
                        {Object.entries(statusLabels).map(([value, label]) => (
                            <Button
                                key={value}
                                variant={statusFilter === value ? "default" : "outline"}
                                size="sm"
                                onClick={() => setStatusFilter(value)}
                                className={`h-8 rounded-full whitespace-nowrap ${statusFilter === value ? "bg-blue-600 hover:bg-blue-700" : ""
                                    }`}
                            >
                                {label}
                            </Button>
                        ))}
                    </div>
                </div>

                <Dialog open={isQuickAddOpen} onOpenChange={setIsQuickAddOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                            <Plus className="h-4 w-4 mr-2" />
                            Quick Add
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Quick Add Lead</DialogTitle>
                            <DialogDescription>
                                Add a new lead quickly. You can fill out more details later.
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

            <div className="grid gap-4">
                {filteredLeads.map((lead) => (
                    <Link key={lead.id} href={`/dashboard/leads/${lead.id}`}>
                        <Card className="hover:shadow-lg transition-all cursor-pointer border-l-4" style={{ borderLeftColor: lead.status === 'NEW' ? '#0ea5e9' : lead.status === 'QUALIFIED' ? '#10b981' : '#cbd5e1' }}>
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4">
                                        <Avatar
                                            fallback={`${lead.firstName?.[0] || ""}${lead.lastName?.[0] || ""}` || "?"}
                                            className="h-12 w-12"
                                        />
                                        <div>
                                            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                                                {lead.firstName || "Unknown"} {lead.lastName || "Lead"}
                                            </h3>
                                            {lead.company && (
                                                <div className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 mt-1">
                                                    <Building2 className="h-3.5 w-3.5" />
                                                    {lead.company}
                                                </div>
                                            )}
                                            <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-500 dark:text-slate-400">
                                                {lead.email && (
                                                    <div className="flex items-center gap-1">
                                                        <Mail className="h-3.5 w-3.5" />
                                                        {lead.email}
                                                    </div>
                                                )}
                                                {lead.phone && (
                                                    <div className="flex items-center gap-1">
                                                        <Phone className="h-3.5 w-3.5" />
                                                        {lead.phone}
                                                    </div>
                                                )}
                                                {lead.city && lead.state && (
                                                    <div className="flex items-center gap-1">
                                                        <MapPin className="h-3.5 w-3.5" />
                                                        {lead.city}, {lead.state}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <Badge variant={(statusColors[lead.status] || "default") as any}>
                                            {statusLabels[lead.status] || lead.status}
                                        </Badge>
                                        {lead.photoUrl && (
                                            <div className="mt-1 w-16 h-12 rounded overflow-hidden border shadow-sm">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={lead.photoUrl}
                                                    alt="Photo"
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        )}
                                        {lead.estimatedValue && (
                                            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                ${lead.estimatedValue.toLocaleString()}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
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
