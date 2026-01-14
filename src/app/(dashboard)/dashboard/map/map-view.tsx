"use client";

import { useState, useMemo } from "react";
import { CRMMap } from "@/components/map/crm-map";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Target, Users, Building2, DoorOpen, Eye, EyeOff, Save, Loader2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface Lead {
    id: string;
    firstName: string;
    lastName: string;
    company?: string | null;
    status: string;
    latitude: number | null;
    longitude: number | null;
    street?: string | null;
    city?: string | null;
    state?: string | null;
    zipCode?: string | null;
    email?: string | null;
    phone?: string | null;
    description?: string | null;
    assignedToId?: string | null;
    assignedTo?: {
        id: string;
        name: string | null;
    } | null;
}

interface Contact {
    id: string;
    firstName: string;
    lastName: string;
    latitude: number | null;
    longitude: number | null;
    city?: string | null;
    state?: string | null;
    assignedToId?: string | null;
}

interface Account {
    id: string;
    name: string;
    industry?: string | null;
    latitude: number | null;
    longitude: number | null;
    billingCity?: string | null;
    billingState?: string | null;
    assignedToId?: string | null;
}

interface DoorActivity {
    id: string;
    outcome: string;
    latitude: number;
    longitude: number;
    createdAt: Date | string;
    notes?: string | null;
    leadId?: string | null;
    contactId?: string | null;
    userId: string;
}

interface MapViewProps {
    data: {
        leads: Lead[];
        contacts: Contact[];
        accounts: Account[];
        doorActivities: DoorActivity[];
    };
    user?: {
        id: string;
        role?: string;
        name?: string | null;
        email?: string | null;
        image?: string | null;
    } | null;
}

interface MapMarker {
    id: string;
    latitude: number;
    longitude: number;
    type: "lead" | "contact" | "account" | "activity";
    status?: string;
    title: string;
    description?: string;
    color?: string;
}

const USER_COLORS = [
    "#3b82f6", // Blue
    "#10b981", // Emerald
    "#f59e0b", // Amber
    "#8b5cf6", // Violet
    "#ef4444", // Red
    "#06b6d4", // Cyan
    "#f97316", // Orange
    "#ec4899", // Pink
    "#6366f1", // Indigo
    "#84cc16", // Lime
];

export function MapView({ data, user }: MapViewProps) {
    const isAdmin = user?.role === "admin";
    const [leads, setLeads] = useState<Lead[]>(data.leads);
    const [filters, setFilters] = useState({
        leads: true,
        contacts: true,
        accounts: true,
        activities: false,
    });
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [editForm, setEditForm] = useState<Lead | null>(null);

    // Map user IDs to colors for admin view
    const userColorMap = useMemo(() => {
        if (!isAdmin) return {};
        const map: Record<string, string> = {};
        const allUserIds = new Set<string>();

        data.leads.forEach(l => l.assignedToId && allUserIds.add(l.assignedToId));
        data.contacts.forEach(c => c.assignedToId && allUserIds.add(c.assignedToId));
        data.accounts.forEach(a => a.assignedToId && allUserIds.add(a.assignedToId));
        data.doorActivities.forEach(d => allUserIds.add(d.userId));

        Array.from(allUserIds).forEach((id, index) => {
            map[id] = USER_COLORS[index % USER_COLORS.length];
        });

        return map;
    }, [data, isAdmin]);

    const handleMarkerClick = (marker: MapMarker) => {
        if (marker.type === "lead") {
            const leadId = marker.id.replace("lead-", "");
            const lead = leads.find((l) => l.id === leadId);
            if (lead) {
                setSelectedLead(lead);
                setEditForm({ ...lead });
            }
        } else if (marker.type === "activity") {
            const activityId = marker.id.replace("activity-", "");
            const activity = data.doorActivities.find((a) => a.id === activityId);
            if (activity?.leadId) {
                const lead = leads.find((l) => l.id === activity.leadId);
                if (lead) {
                    setSelectedLead(lead);
                    setEditForm({ ...lead });
                }
            }
        }
    };

    const handleSave = async () => {
        if (!editForm) return;
        setIsSaving(true);
        try {
            const res = await fetch(`/api/leads/${editForm.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editForm),
            });
            if (res.ok) {
                const updatedLead = await res.json();
                setLeads(prev => prev.map(l => l.id === updatedLead.id ? { ...l, ...updatedLead } : l));
                setSelectedLead(null);
                setEditForm(null);
            }
        } catch (error) {
            console.error("Failed to save lead:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const markers = useMemo(() => {
        const result: MapMarker[] = [];

        if (filters.leads) {
            leads.forEach((lead) => {
                if (lead.latitude && lead.longitude) {
                    result.push({
                        id: `lead-${lead.id}`,
                        latitude: lead.latitude,
                        longitude: lead.longitude,
                        type: "lead" as const,
                        status: lead.status,
                        title: `${lead.firstName} ${lead.lastName}`,
                        description: lead.company || `${lead.city}, ${lead.state}`,
                        color: isAdmin && lead.assignedToId ? userColorMap[lead.assignedToId] : undefined,
                    });
                }
            });
        }

        if (filters.contacts) {
            data.contacts.forEach((contact) => {
                if (contact.latitude && contact.longitude) {
                    result.push({
                        id: `contact-${contact.id}`,
                        latitude: contact.latitude,
                        longitude: contact.longitude,
                        type: "contact" as const,
                        title: `${contact.firstName} ${contact.lastName}`,
                        description: `${contact.city}, ${contact.state}`,
                        color: isAdmin && contact.assignedToId ? userColorMap[contact.assignedToId] : undefined,
                    });
                }
            });
        }

        if (filters.accounts) {
            data.accounts.forEach((account) => {
                if (account.latitude && account.longitude) {
                    result.push({
                        id: `account-${account.id}`,
                        latitude: account.latitude,
                        longitude: account.longitude,
                        type: "account" as const,
                        title: account.name,
                        description: account.industry || `${account.billingCity}, ${account.billingState}`,
                        color: isAdmin && account.assignedToId ? userColorMap[account.assignedToId] : undefined,
                    });
                }
            });
        }

        if (filters.activities) {
            data.doorActivities.forEach((activity) => {
                result.push({
                    id: `activity-${activity.id}`,
                    latitude: activity.latitude,
                    longitude: activity.longitude,
                    type: "activity" as const,
                    status: activity.outcome,
                    title: activity.outcome.replace(/_/g, " "),
                    description: activity.notes?.substring(0, 50) || new Date(activity.createdAt).toLocaleDateString(),
                    color: isAdmin ? userColorMap[activity.userId] : undefined,
                });
            });
        }

        return result;
    }, [data, leads, filters, isAdmin, userColorMap]);

    const stats = {
        leads: data.leads.length,
        contacts: data.contacts.length,
        accounts: data.accounts.length,
        activities: data.doorActivities.length,
    };

    // Prepare legend for admin view
    const legendUsers = useMemo(() => {
        if (!isAdmin) return [];
        const seen = new Set<string>();
        const users: { id: string, name: string, color: string }[] = [];

        data.leads.forEach(l => {
            if (l.assignedToId && !seen.has(l.assignedToId)) {
                seen.add(l.assignedToId);
                users.push({
                    id: l.assignedToId,
                    name: l.assignedTo?.name || "Unassigned",
                    color: userColorMap[l.assignedToId]
                });
            }
        });

        // Add users from activities if not already there
        data.doorActivities.forEach(d => {
            if (d.userId && !seen.has(d.userId)) {
                seen.add(d.userId);
                // We'd need to fetch user names if missing, but let's stick to leads for now or generic names
                users.push({
                    id: d.userId,
                    name: "Unknown User",
                    color: userColorMap[d.userId]
                });
            }
        });

        return users;
    }, [data, isAdmin, userColorMap]);

    return (
        <div className="space-y-4 flex flex-col h-[calc(100vh-8rem)]">
            {/* Filter Controls */}
            <Card className="shrink-0">
                <CardContent className="py-3 px-3 md:py-4 md:px-6">
                    <div className="flex items-center gap-3 overflow-x-auto no-scrollbar scroll-smooth">
                        <span className="hidden sm:inline text-sm font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
                            Show on map:
                        </span>
                        <FilterButton
                            active={filters.leads}
                            onClick={() => setFilters({ ...filters, leads: !filters.leads })}
                            icon={Target}
                            label="Leads"
                            count={stats.leads}
                            color="blue"
                        />
                        <FilterButton
                            active={filters.contacts}
                            onClick={() => setFilters({ ...filters, contacts: !filters.contacts })}
                            icon={Users}
                            label="Contacts"
                            count={stats.contacts}
                            color="cyan"
                        />
                        <FilterButton
                            active={filters.accounts}
                            onClick={() => setFilters({ ...filters, accounts: !filters.accounts })}
                            icon={Building2}
                            label="Accounts"
                            count={stats.accounts}
                            color="orange"
                        />
                        <FilterButton
                            active={filters.activities}
                            onClick={() => setFilters({ ...filters, activities: !filters.activities })}
                            icon={DoorOpen}
                            label="Door Activities"
                            count={stats.activities}
                            color="indigo"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Map */}
            <div className="flex-1 min-h-[400px] relative rounded-xl overflow-hidden shadow-inner border border-slate-200 dark:border-slate-800">
                <CRMMap
                    markers={markers}
                    onMarkerClick={handleMarkerClick}
                    className="w-full h-full"
                />
            </div>

            {/* Lead Edit Dialog */}
            <Dialog open={!!selectedLead} onOpenChange={(open) => !open && setSelectedLead(null)}>
                <DialogContent className="max-w-2xl overflow-y-auto max-h-[90vh] w-[95vw] sm:w-full rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>Edit Lead</DialogTitle>
                        <DialogDescription>
                            Update lead information for {editForm?.firstName} {editForm?.lastName}
                        </DialogDescription>
                    </DialogHeader>

                    {editForm && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">First Name</Label>
                                <Input
                                    id="firstName"
                                    value={editForm.firstName || ""}
                                    onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Last Name</Label>
                                <Input
                                    id="lastName"
                                    value={editForm.lastName || ""}
                                    onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={editForm.email || ""}
                                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    value={editForm.phone || ""}
                                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="company">Company</Label>
                                <Input
                                    id="company"
                                    value={editForm.company || ""}
                                    onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Select
                                    value={editForm.status}
                                    onValueChange={(value) => setEditForm({ ...editForm, status: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="NEW">New</SelectItem>
                                        <SelectItem value="CONTACTED">Contacted</SelectItem>
                                        <SelectItem value="QUALIFIED">Qualified</SelectItem>
                                        <SelectItem value="UNQUALIFIED">Unqualified</SelectItem>
                                        <SelectItem value="CONVERTED">Converted</SelectItem>
                                        <SelectItem value="DEAD">Dead</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <Label htmlFor="street">Street Address</Label>
                                <Input
                                    id="street"
                                    value={editForm.street || ""}
                                    onChange={(e) => setEditForm({ ...editForm, street: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="city">City</Label>
                                <Input
                                    id="city"
                                    value={editForm.city || ""}
                                    onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="state">State</Label>
                                <Input
                                    id="state"
                                    value={editForm.state || ""}
                                    onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                                />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <Label htmlFor="description">Notes</Label>
                                <Textarea
                                    id="description"
                                    value={editForm.description || ""}
                                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                    rows={3}
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedLead(null)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    Save Changes
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Legend */}
            <Card>
                <CardContent className="py-3">
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                        <span className="font-medium text-slate-500 dark:text-slate-400">
                            {isAdmin ? "Users:" : "Lead Status:"}
                        </span>
                        {isAdmin ? (
                            legendUsers.map(u => (
                                <LegendItem key={u.id} color={u.color} label={u.name} />
                            ))
                        ) : (
                            <>
                                <LegendItem color="#3b82f6" label="New" />
                                <LegendItem color="#8b5cf6" label="Contacted" />
                                <LegendItem color="#10b981" label="Qualified" />
                                <LegendItem color="#f59e0b" label="Unqualified" />
                                <LegendItem color="#ef4444" label="Dead" />
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function FilterButton({
    active,
    onClick,
    icon: Icon,
    label,
    count,
    color,
}: {
    active: boolean;
    onClick: () => void;
    icon: React.ElementType;
    label: string;
    count: number;
    color: string;
}) {
    const colorClasses: Record<string, string> = {
        blue: "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
        cyan: "bg-cyan-100 text-cyan-700 border-cyan-300 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-800",
        orange: "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800",
        indigo: "bg-indigo-100 text-indigo-700 border-indigo-300 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800",
    };

    return (
        <button
            onClick={onClick}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${active
                ? colorClasses[color]
                : "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 opacity-60"
                }`}
        >
            <Icon className="h-4 w-4" />
            <span className="font-medium">{label}</span>
            <Badge variant={active ? "default" : "secondary"} className="ml-1">
                {count}
            </Badge>
            {active ? (
                <Eye className="h-3.5 w-3.5 ml-1" />
            ) : (
                <EyeOff className="h-3.5 w-3.5 ml-1" />
            )}
        </button>
    );
}

function LegendItem({ color, label }: { color: string; label: string }) {
    return (
        <div className="flex items-center gap-1.5">
            <div
                className="h-3 w-3 rounded-full border-2 border-white shadow-sm"
                style={{ backgroundColor: color }}
            />
            <span className="text-slate-600 dark:text-slate-400">{label}</span>
        </div>
    );
}
