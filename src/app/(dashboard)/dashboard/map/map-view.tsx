"use client";

import { useState, useMemo } from "react";
import { CRMMap } from "@/components/map/crm-map";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Target, Users, Building2, DoorOpen, Eye, EyeOff } from "lucide-react";

interface MapViewProps {
    data: {
        leads: any[];
        contacts: any[];
        accounts: any[];
        doorActivities: any[];
    };
}

export function MapView({ data }: MapViewProps) {
    const [filters, setFilters] = useState({
        leads: true,
        contacts: true,
        accounts: true,
        activities: false,
    });

    const markers = useMemo(() => {
        const result: any[] = [];

        if (filters.leads) {
            data.leads.forEach((lead) => {
                if (lead.latitude && lead.longitude) {
                    result.push({
                        id: `lead-${lead.id}`,
                        latitude: lead.latitude,
                        longitude: lead.longitude,
                        type: "lead" as const,
                        status: lead.status,
                        title: `${lead.firstName} ${lead.lastName}`,
                        description: lead.company || `${lead.city}, ${lead.state}`,
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
                });
            });
        }

        return result;
    }, [data, filters]);

    const stats = {
        leads: data.leads.length,
        contacts: data.contacts.length,
        accounts: data.accounts.length,
        activities: data.doorActivities.length,
    };

    return (
        <div className="space-y-4">
            {/* Filter Controls */}
            <Card>
                <CardContent className="py-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
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
            <CRMMap
                markers={markers}
                className="w-full h-[calc(100vh-280px)] min-h-[400px]"
            />

            {/* Legend */}
            <Card>
                <CardContent className="py-3">
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                        <span className="font-medium text-slate-500 dark:text-slate-400">
                            Lead Status:
                        </span>
                        <LegendItem color="#3b82f6" label="New" />
                        <LegendItem color="#8b5cf6" label="Contacted" />
                        <LegendItem color="#10b981" label="Qualified" />
                        <LegendItem color="#f59e0b" label="Unqualified" />
                        <LegendItem color="#ef4444" label="Dead" />
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
