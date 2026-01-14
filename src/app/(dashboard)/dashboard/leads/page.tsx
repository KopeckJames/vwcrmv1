import Link from "next/link";
import { Header } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { LeadList } from "./lead-list";

async function getLeads(session: any) {
    if (!session?.user) return [];

    try {
        const where: any = {};
        if (session.user.role !== "admin") {
            where.assignedToId = session.user.id;
        }

        const leads = await prisma.lead.findMany({
            where,
            include: {
                assignedTo: {
                    select: { id: true, name: true, image: true },
                },
                assignedAdmin: {
                    select: { id: true, name: true, image: true },
                },
            },
            orderBy: { createdAt: "desc" },
            take: 100,
        });
        console.log(`[LeadsPage] Fetched ${leads.length} leads`);
        return leads;
    } catch (error) {
        console.error("[LeadsPage] Error fetching leads:", error);
        return [];
    }
}

export default async function LeadsPage() {
    const session = await auth();
    const leads = await getLeads(session);

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

                <LeadList initialLeads={leads} />
            </div>
        </div>
    );
}
