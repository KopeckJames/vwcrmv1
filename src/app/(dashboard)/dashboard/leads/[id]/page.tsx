import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import {
    ChevronLeft,
    Calendar,
    Mail,
    Phone,
    Building2,
    MapPin,
    Clock,
    MoreHorizontal,
    Edit,
    CheckCircle2,
    History,
    Layout
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";

interface PageProps {
    params: Promise<{ id: string }>;
}

const statusColors: Record<string, "default" | "info" | "warning" | "success" | "danger" | "secondary"> = {
    NEW: "info",
    CONTACTED: "secondary",
    QUALIFIED: "success",
    UNQUALIFIED: "warning",
    CONVERTED: "success",
    DEAD: "danger",
};

export default async function LeadDetailPage({ params }: PageProps) {
    const session = await auth();
    if (!session?.user) {
        redirect("/login");
    }

    const { id } = await params;

    const where: any = { id };
    if (session.user.role !== "admin") {
        where.assignedToId = session.user.id;
    }

    const lead = await prisma.lead.findFirst({
        where,
        include: {
            assignedTo: {
                select: { id: true, name: true, email: true, image: true },
            },
            territory: true,
            activities: {
                orderBy: { dateTime: "desc" },
                take: 20,
            },
            tasks: {
                orderBy: { dueDate: "asc" },
                include: {
                    assignedTo: {
                        select: { name: true }
                    }
                }
            },
            doorActivities: {
                orderBy: { createdAt: "desc" },
                take: 20,
            },
        },
    });

    if (!lead) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <div className="h-16 w-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                    <Layout className="h-8 w-8 text-slate-400" />
                </div>
                <h2 className="text-xl font-semibold">Lead not found</h2>
                <p className="text-slate-500">The lead you're looking for doesn't exist or you don't have access.</p>
                <Button asChild>
                    <Link href="/dashboard/leads">Back to Leads</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2 text-slate-500">
                        <Link href="/dashboard/leads">
                            <ChevronLeft className="mr-1 h-4 w-4" />
                            Back to Leads
                        </Link>
                    </Button>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight">
                            {lead.firstName} {lead.lastName}
                        </h1>
                        <Badge variant={statusColors[lead.status] || "default"} className="h-6">
                            {lead.status}
                        </Badge>
                    </div>
                    {lead.company && (
                        <p className="text-slate-500 mt-1 flex items-center gap-1.5">
                            <Building2 className="h-4 w-4" />
                            {lead.company} {lead.jobTitle ? `• ${lead.jobTitle}` : ''}
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Lead
                    </Button>
                    <Button size="sm">
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Convert
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Left Column - Details */}
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Contact Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {lead.email && (
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                                        <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-medium text-slate-500 uppercase">Email</p>
                                        <p className="text-sm truncate">{lead.email}</p>
                                    </div>
                                </div>
                            )}
                            {lead.phone && (
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center shrink-0">
                                        <Phone className="h-4 w-4 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-medium text-slate-500 uppercase">Phone</p>
                                        <p className="text-sm">{lead.phone}</p>
                                    </div>
                                </div>
                            )}
                            {(lead.street || lead.city) && (
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-slate-50 dark:bg-slate-900/20 flex items-center justify-center shrink-0">
                                        <MapPin className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-medium text-slate-500 uppercase">Address</p>
                                        <p className="text-sm">
                                            {[lead.street, lead.city, lead.state, lead.zipCode].filter(Boolean).join(', ')}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Assignment</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <Avatar
                                    src={lead.assignedTo?.image}
                                    fallback={lead.assignedTo?.name || undefined}
                                    className="h-10 w-10"
                                />
                                <div>
                                    <p className="text-sm font-medium">{lead.assignedTo?.name || 'Unassigned'}</p>
                                    <p className="text-xs text-slate-500">{lead.assignedTo?.email}</p>
                                </div>
                            </div>
                            {lead.territory && (
                                <div className="pt-2 border-t">
                                    <p className="text-xs font-medium text-slate-500 uppercase">Territory</p>
                                    <p className="text-sm font-semibold">{lead.territory.name}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Activities & Tasks */}
                <div className="lg:col-span-2 space-y-6">
                    <Tabs defaultValue="activity" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="activity">Activities</TabsTrigger>
                            <TabsTrigger value="tasks">Tasks</TabsTrigger>
                            <TabsTrigger value="door">Door Activity</TabsTrigger>
                        </TabsList>
                        <TabsContent value="activity" className="space-y-4 pt-4">
                            {lead.activities.length === 0 ? (
                                <div className="text-center py-10 border-2 border-dashed rounded-xl">
                                    <p className="text-slate-500">No activity recorded yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {lead.activities.map((activity) => (
                                        <div key={activity.id} className="flex gap-4">
                                            <div className="flex flex-col items-center">
                                                <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                                    <Clock className="h-4 w-4 text-slate-500" />
                                                </div>
                                                <div className="w-0.5 flex-1 bg-slate-100 dark:bg-slate-800 my-1" />
                                            </div>
                                            <div className="bg-white dark:bg-slate-900 border rounded-lg p-3 flex-1">
                                                <div className="flex justify-between items-start">
                                                    <h4 className="font-medium text-sm">{activity.subject}</h4>
                                                    <span className="text-[10px] text-slate-400">
                                                        {format(new Date(activity.dateTime), 'MMM d, h:mm a')}
                                                    </span>
                                                </div>
                                                {activity.description && (
                                                    <p className="text-xs text-slate-500 mt-1">{activity.description}</p>
                                                )}
                                                <Badge variant="secondary" className="mt-2 text-[10px] h-5">
                                                    {activity.type}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                        <TabsContent value="tasks" className="space-y-4 pt-4">
                            {lead.tasks.length === 0 ? (
                                <div className="text-center py-10 border-2 border-dashed rounded-xl">
                                    <p className="text-slate-500">No pending tasks.</p>
                                    <Button variant="outline" size="sm" className="mt-4">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add Task
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {lead.tasks.map((task) => (
                                        <Card key={task.id}>
                                            <CardContent className="p-3 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={`h-2 w-2 rounded-full ${task.priority === 'HIGH' || task.priority === 'URGENT' ? 'bg-red-500' :
                                                        task.priority === 'MEDIUM' ? 'bg-amber-500' : 'bg-slate-300'
                                                        }`} />
                                                    <div>
                                                        <p className="text-sm font-medium">{task.title}</p>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="text-xs text-slate-500 flex items-center gap-1">
                                                                <Calendar className="h-3 w-3" />
                                                                {task.dueDate ? format(new Date(task.dueDate), 'MMM d') : 'No due date'}
                                                            </span>
                                                            <span className="text-xs text-slate-500">•</span>
                                                            <span className="text-xs text-slate-500">{task.status.replace('_', ' ')}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                        <TabsContent value="door" className="space-y-4 pt-4">
                            {lead.doorActivities.length === 0 ? (
                                <div className="text-center py-10 border-2 border-dashed rounded-xl">
                                    <p className="text-slate-500">No door knocking activity recorded.</p>
                                </div>
                            ) : (
                                <div className="grid gap-3">
                                    {lead.doorActivities.map((door) => (
                                        <Card key={door.id}>
                                            <CardContent className="p-3">
                                                <div className="flex justify-between items-start mb-2">
                                                    <Badge variant="default">{door.outcome.replace('_', ' ')}</Badge>
                                                    <span className="text-[10px] text-slate-400">
                                                        {format(new Date(door.createdAt), 'MMM d, p')}
                                                    </span>
                                                </div>
                                                {door.notes && <p className="text-sm text-slate-600 dark:text-slate-400">{door.notes}</p>}
                                                <div className="flex gap-3 mt-2">
                                                    {door.leftMaterials && (
                                                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-400">
                                                            Left: {door.materialsType || 'Materials'}
                                                        </span>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}

function Plus({ className, ...props }: React.ComponentProps<"svg">) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            {...props}
        >
            <path d="M5 12h14" />
            <path d="M12 5v14" />
        </svg>
    )
}
