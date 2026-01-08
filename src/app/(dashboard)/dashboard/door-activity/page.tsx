import Link from "next/link";
import { Header } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, MapPin, Clock, DoorOpen, Package, UserCheck, ThumbsUp, Calendar, XCircle, AlertCircle, Ban, type LucideIcon } from "lucide-react";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";


const outcomeConfig: Record<string, { label: string; icon: LucideIcon; variant: "default" | "info" | "warning" | "success" | "danger" | "secondary" }> = {
    NO_ANSWER: { label: "No Answer", icon: DoorOpen, variant: "default" },
    LEFT_MATERIALS: { label: "Left Materials", icon: Package, variant: "info" },
    SPOKE_WITH_RESIDENT: { label: "Spoke with Resident", icon: UserCheck, variant: "secondary" },
    NOT_INTERESTED: { label: "Not Interested", icon: XCircle, variant: "warning" },
    INTERESTED: { label: "Interested", icon: ThumbsUp, variant: "success" },
    APPOINTMENT_SET: { label: "Appointment Set", icon: Calendar, variant: "success" },
    WRONG_ADDRESS: { label: "Wrong Address", icon: AlertCircle, variant: "warning" },
    DO_NOT_CONTACT: { label: "Do Not Contact", icon: Ban, variant: "danger" },
};

async function getDoorActivities() {
    const session = await auth();
    if (!session?.user) return [];

    try {
        return await prisma.doorActivity.findMany({
            where: { userId: session.user.id },
            include: {
                lead: {
                    select: { id: true, firstName: true, lastName: true },
                },
                contact: {
                    select: { id: true, firstName: true, lastName: true },
                },
            },
            orderBy: { createdAt: "desc" },
            take: 100,
        });
    } catch {
        return [];
    }
}

export default async function DoorActivityPage() {
    const activities = await getDoorActivities();

    // Group activities by date
    const groupedActivities = activities.reduce((acc: Record<string, typeof activities>, activity: typeof activities[number]) => {
        const date = new Date(activity.createdAt).toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });
        if (!acc[date]) acc[date] = [];
        acc[date].push(activity);
        return acc;
    }, {} as Record<string, typeof activities>);

    return (
        <div className="flex flex-col min-h-screen">
            <Header title="Door Activity" />

            <div className="flex-1 p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <p className="text-slate-500 dark:text-slate-400">
                            Track your door-to-door sales activities
                        </p>
                    </div>
                    <Link href="/dashboard/door-activity/new">
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Log Activity
                        </Button>
                    </Link>
                </div>

                {activities.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                                <DoorOpen className="h-8 w-8 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                                No activities logged yet
                            </h3>
                            <p className="text-slate-500 dark:text-slate-400 text-center max-w-md mb-6">
                                Start logging your door-to-door activities to track your progress and follow up with leads.
                            </p>
                            <Link href="/dashboard/door-activity/new">
                                <Button>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Log Your First Activity
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-8">
                        {Object.entries(groupedActivities).map(([date, dayActivities]) => (
                            <div key={date}>
                                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">
                                    {date}
                                </h3>
                                <div className="space-y-3">
                                    {dayActivities.map((activity) => {
                                        const config = outcomeConfig[activity.outcome];
                                        const Icon = config.icon;
                                        return (
                                            <Card key={activity.id}>
                                                <CardContent className="p-4">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex items-start gap-4">
                                                            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                                                                <Icon className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <Badge variant={config.variant}>{config.label}</Badge>
                                                                    {activity.leftMaterials && (
                                                                        <Badge variant="info">
                                                                            <Package className="h-3 w-3 mr-1" />
                                                                            {activity.materialsType || "Materials"}
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                {activity.notes && (
                                                                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                                                                        {activity.notes}
                                                                    </p>
                                                                )}
                                                                <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                                                                    <span className="flex items-center gap-1">
                                                                        <Clock className="h-3 w-3" />
                                                                        {new Date(activity.createdAt).toLocaleTimeString("en-US", {
                                                                            hour: "numeric",
                                                                            minute: "2-digit",
                                                                        })}
                                                                    </span>
                                                                    <span className="flex items-center gap-1">
                                                                        <MapPin className="h-3 w-3" />
                                                                        {activity.latitude.toFixed(4)}, {activity.longitude.toFixed(4)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {activity.lead && (
                                                            <Link
                                                                href={`/dashboard/leads/${activity.lead.id}`}
                                                                className="text-sm text-blue-600 hover:underline"
                                                            >
                                                                {activity.lead.firstName} {activity.lead.lastName}
                                                            </Link>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
