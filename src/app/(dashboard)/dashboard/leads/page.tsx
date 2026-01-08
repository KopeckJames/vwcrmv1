import Link from "next/link";
import { Header } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Plus, MapPin, Phone, Mail, Building2 } from "lucide-react";
import prisma from "@/lib/prisma";

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

async function getLeads() {
    try {
        return await prisma.lead.findMany({
            include: {
                assignedTo: {
                    select: { id: true, name: true, image: true },
                },
            },
            orderBy: { createdAt: "desc" },
            take: 100,
        });
    } catch {
        return [];
    }
}

export default async function LeadsPage() {
    const leads = await getLeads();

    return (
        <div className="flex flex-col min-h-screen">
            <Header title="Leads" />

            <div className="flex-1 p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <p className="text-slate-500 dark:text-slate-400">
                            Manage your sales leads and track their progress
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Link href="/dashboard/leads/import">
                            <Button variant="outline">
                                Import CSV
                            </Button>
                        </Link>
                        <Link href="/dashboard/leads/new">
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Lead
                            </Button>
                        </Link>
                    </div>
                </div>

                {leads.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                                <Plus className="h-8 w-8 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                                No leads yet
                            </h3>
                            <p className="text-slate-500 dark:text-slate-400 text-center max-w-md mb-6">
                                Start by adding your first lead. You can import leads from a CSV file or add them manually.
                            </p>
                            <Link href="/dashboard/leads/new">
                                <Button>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Your First Lead
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4">
                        {leads.map((lead: typeof leads[number]) => (
                            <Link key={lead.id} href={`/dashboard/leads/${lead.id}`}>
                                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-4">
                                                <Avatar
                                                    fallback={`${lead.firstName} ${lead.lastName}`}
                                                    size="lg"
                                                />
                                                <div>
                                                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                                                        {lead.firstName} {lead.lastName}
                                                    </h3>
                                                    {lead.company && (
                                                        <div className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 mt-1">
                                                            <Building2 className="h-3.5 w-3.5" />
                                                            {lead.company}
                                                            {lead.jobTitle && ` • ${lead.jobTitle}`}
                                                        </div>
                                                    )}
                                                    <div className="flex flex-wrap gap-3 mt-2 text-sm text-slate-500 dark:text-slate-400">
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
                                                <Badge variant={statusColors[lead.status]}>
                                                    {statusLabels[lead.status]}
                                                </Badge>
                                                {(lead as any).photoUrl && (
                                                    <div className="mt-2 w-16 h-12 rounded overflow-hidden border">
                                                        <img
                                                            src={(lead as any).photoUrl}
                                                            alt="Door Placement"
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                )}
                                                {lead.estimatedValue && (
                                                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                                        ${lead.estimatedValue.toLocaleString()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
