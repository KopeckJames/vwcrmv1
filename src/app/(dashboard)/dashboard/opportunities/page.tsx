import Link from "next/link";
import { Header } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Building2, Calendar, DollarSign } from "lucide-react";
import prisma from "@/lib/prisma";
import { formatDate, formatCurrency } from "@/lib/utils";

type OpportunityItem = {
    id: string;
    name: string;
    stage: string;
    amount: number | null;
    probability: number | null;
    expectedCloseDate: Date | null;
    account: { id: string; name: string } | null;
};

const stageLabels: Record<string, string> = {
    PROSPECTING: "Prospecting",
    QUALIFICATION: "Qualification",
    NEEDS_ANALYSIS: "Needs Analysis",
    VALUE_PROPOSITION: "Value Proposition",
    NEGOTIATION: "Negotiation",
    CLOSED_WON: "Closed Won",
    CLOSED_LOST: "Closed Lost",
};

const stageColors: Record<string, "default" | "info" | "warning" | "success" | "danger" | "secondary"> = {
    PROSPECTING: "default",
    QUALIFICATION: "info",
    NEEDS_ANALYSIS: "secondary",
    VALUE_PROPOSITION: "warning",
    NEGOTIATION: "warning",
    CLOSED_WON: "success",
    CLOSED_LOST: "danger",
};

async function getOpportunities(): Promise<OpportunityItem[]> {
    try {
        const opportunities = await prisma.opportunity.findMany({
            select: {
                id: true,
                name: true,
                stage: true,
                amount: true,
                probability: true,
                expectedCloseDate: true,
                account: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: "desc" },
            take: 100,
        });
        return opportunities;
    } catch {
        return [];
    }
}

export default async function OpportunitiesPage() {
    const opportunities = await getOpportunities();

    return (
        <div className="flex flex-col min-h-screen">
            <Header title="Opportunities" />

            <div className="flex-1 p-6">
                <div className="flex items-center justify-between mb-6">
                    <p className="text-slate-500 dark:text-slate-400">
                        Track your sales pipeline
                    </p>
                    <Link href="/dashboard/opportunities/new">
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Opportunity
                        </Button>
                    </Link>
                </div>

                {opportunities.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                                <Plus className="h-8 w-8 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">No opportunities yet</h3>
                            <p className="text-slate-500 text-center max-w-md mb-6">
                                Start by adding your first sales opportunity.
                            </p>
                            <Link href="/dashboard/opportunities/new">
                                <Button>Add Your First Opportunity</Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4">
                        {opportunities.map((opp) => (
                            <Link key={opp.id} href={`/dashboard/opportunities/${opp.id}`}>
                                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="font-semibold text-lg">{opp.name}</h3>
                                                {opp.account && (
                                                    <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                                                        <Building2 className="h-3.5 w-3.5" />
                                                        {opp.account.name}
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-4 mt-3">
                                                    {opp.amount && (
                                                        <div className="flex items-center gap-1 text-sm">
                                                            <DollarSign className="h-4 w-4 text-emerald-500" />
                                                            <span className="font-medium">{formatCurrency(opp.amount)}</span>
                                                        </div>
                                                    )}
                                                    {opp.expectedCloseDate && (
                                                        <div className="flex items-center gap-1 text-sm text-slate-500">
                                                            <Calendar className="h-4 w-4" />
                                                            {formatDate(opp.expectedCloseDate)}
                                                        </div>
                                                    )}
                                                    {opp.probability != null && (
                                                        <span className="text-sm text-slate-500">
                                                            {opp.probability}% probability
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <Badge variant={stageColors[opp.stage]}>
                                                {stageLabels[opp.stage]}
                                            </Badge>
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
