import { auth } from "@/lib/auth";
import { Header } from "@/components/dashboard/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Target,
    Users,
    TrendingUp,
    DollarSign,
    ArrowUpRight,
    ArrowDownRight,
} from "lucide-react";
import prisma from "@/lib/prisma";

async function getStats() {
    try {
        const [leadsCount, contactsCount, opportunitiesCount] = await Promise.all([
            prisma.lead.count(),
            prisma.contact.count(),
            prisma.opportunity.count(),
        ]);

        const totalPipelineValue = await prisma.opportunity.aggregate({
            _sum: {
                amount: true,
            },
            where: {
                stage: {
                    notIn: ["CLOSED_WON", "CLOSED_LOST"],
                },
            },
        });

        return {
            leads: leadsCount,
            contacts: contactsCount,
            opportunities: opportunitiesCount,
            pipelineValue: totalPipelineValue._sum.amount || 0,
        };
    } catch {
        // Return defaults if database is not set up yet
        return {
            leads: 0,
            contacts: 0,
            opportunities: 0,
            pipelineValue: 0,
        };
    }
}

export default async function DashboardPage() {
    const session = await auth();
    const stats = await getStats();

    const statCards = [
        {
            title: "Total Leads",
            value: stats.leads.toLocaleString(),
            change: "+12%",
            trend: "up",
            icon: Target,
            color: "from-blue-500 to-cyan-500",
        },
        {
            title: "Contacts",
            value: stats.contacts.toLocaleString(),
            change: "+8%",
            trend: "up",
            icon: Users,
            color: "from-violet-500 to-purple-500",
        },
        {
            title: "Opportunities",
            value: stats.opportunities.toLocaleString(),
            change: "+23%",
            trend: "up",
            icon: TrendingUp,
            color: "from-emerald-500 to-teal-500",
        },
        {
            title: "Pipeline Value",
            value: new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                notation: "compact",
                maximumFractionDigits: 1,
            }).format(stats.pipelineValue),
            change: "-5%",
            trend: "down",
            icon: DollarSign,
            color: "from-orange-500 to-amber-500",
        },
    ];

    return (
        <div className="flex flex-col min-h-screen">
            <Header title="Dashboard" />

            <div className="flex-1 p-6 space-y-6">
                {/* Welcome message */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                            Welcome back, {session?.user?.name?.split(" ")[0] || "there"}! 👋
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">
                            Here's what's happening with your sales today.
                        </p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {statCards.map((stat) => (
                        <Card key={stat.title} className="relative overflow-hidden">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                    {stat.title}
                                </CardTitle>
                                <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.color}`}>
                                    <stat.icon className="h-4 w-4 text-white" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                                    {stat.value}
                                </div>
                                <div className="flex items-center mt-2 text-sm">
                                    {stat.trend === "up" ? (
                                        <ArrowUpRight className="h-4 w-4 text-emerald-500 mr-1" />
                                    ) : (
                                        <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                                    )}
                                    <span
                                        className={
                                            stat.trend === "up" ? "text-emerald-500" : "text-red-500"
                                        }
                                    >
                                        {stat.change}
                                    </span>
                                    <span className="text-slate-400 ml-1">vs last month</span>
                                </div>
                            </CardContent>
                            {/* Decorative gradient */}
                            <div
                                className={`absolute -bottom-4 -right-4 h-24 w-24 rounded-full bg-gradient-to-br ${stat.color} opacity-10 blur-2xl`}
                            />
                        </Card>
                    ))}
                </div>

                {/* Quick Actions & Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Quick Actions */}
                    <Card className="lg:col-span-1">
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <QuickActionButton
                                href="/dashboard/leads/new"
                                label="Add New Lead"
                                icon={Target}
                                color="blue"
                            />
                            <QuickActionButton
                                href="/dashboard/contacts/new"
                                label="Add New Contact"
                                icon={Users}
                                color="violet"
                            />
                            <QuickActionButton
                                href="/dashboard/door-activity/new"
                                label="Log Door Activity"
                                icon={TrendingUp}
                                color="emerald"
                            />
                        </CardContent>
                    </Card>

                    {/* Recent Activity Placeholder */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Recent Activity</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                                <p>No recent activity yet.</p>
                                <p className="text-sm mt-1">
                                    Start by adding leads or logging door-to-door activities.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function QuickActionButton({
    href,
    label,
    icon: Icon,
    color,
}: {
    href: string;
    label: string;
    icon: React.ElementType;
    color: "blue" | "violet" | "emerald";
}) {
    const colorStyles = {
        blue: "bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-400 dark:hover:bg-blue-900",
        violet: "bg-violet-50 text-violet-600 hover:bg-violet-100 dark:bg-violet-950 dark:text-violet-400 dark:hover:bg-violet-900",
        emerald: "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-400 dark:hover:bg-emerald-900",
    };

    return (
        <a
            href={href}
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${colorStyles[color]}`}
        >
            <Icon className="h-5 w-5" />
            <span className="font-medium">{label}</span>
        </a>
    );
}
