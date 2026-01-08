import Link from "next/link";
import { Header } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, CheckCircle, Clock, AlertCircle } from "lucide-react";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { formatDate } from "@/lib/utils";

type TaskItem = {
    id: string;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    dueDate: Date | null;
    lead: { id: string; firstName: string; lastName: string } | null;
    contact: { id: string; firstName: string; lastName: string } | null;
    opportunity: { id: string; name: string } | null;
};

const statusConfig: Record<string, { label: string; color: "default" | "info" | "warning" | "success" | "danger" | "secondary"; icon: typeof Clock }> = {
    NOT_STARTED: { label: "Not Started", color: "default", icon: Clock },
    IN_PROGRESS: { label: "In Progress", color: "info", icon: AlertCircle },
    COMPLETED: { label: "Completed", color: "success", icon: CheckCircle },
    WAITING: { label: "Waiting", color: "warning", icon: Clock },
    DEFERRED: { label: "Deferred", color: "secondary", icon: Clock },
};

const priorityColors: Record<string, string> = {
    LOW: "text-slate-500",
    MEDIUM: "text-blue-500",
    HIGH: "text-orange-500",
    URGENT: "text-red-500",
};

async function getTasks(): Promise<TaskItem[]> {
    const session = await auth();
    if (!session?.user) return [];

    try {
        const tasks = await prisma.task.findMany({
            where: { assignedToId: session.user.id },
            select: {
                id: true,
                title: true,
                description: true,
                status: true,
                priority: true,
                dueDate: true,
                lead: { select: { id: true, firstName: true, lastName: true } },
                contact: { select: { id: true, firstName: true, lastName: true } },
                opportunity: { select: { id: true, name: true } },
            },
            orderBy: [
                { status: "asc" },
                { dueDate: "asc" },
            ],
            take: 100,
        });
        return tasks;
    } catch {
        return [];
    }
}

export default async function TasksPage() {
    const tasks = await getTasks();

    return (
        <div className="flex flex-col min-h-screen">
            <Header title="Tasks" />

            <div className="flex-1 p-6">
                <div className="flex items-center justify-between mb-6">
                    <p className="text-slate-500 dark:text-slate-400">
                        Manage your to-do items and follow-ups
                    </p>
                    <Link href="/dashboard/tasks/new">
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Task
                        </Button>
                    </Link>
                </div>

                {tasks.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                                <CheckCircle className="h-8 w-8 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">No tasks yet</h3>
                            <p className="text-slate-500 text-center max-w-md mb-6">
                                You&apos;re all caught up! Add a task to get started.
                            </p>
                            <Link href="/dashboard/tasks/new">
                                <Button>Add Your First Task</Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {tasks.map((task: TaskItem) => {
                            const config = statusConfig[task.status];
                            const Icon = config.icon;
                            const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "COMPLETED";

                            return (
                                <Card key={task.id} className={`${task.status === "COMPLETED" ? "opacity-60" : ""}`}>
                                    <CardContent className="p-4">
                                        <div className="flex items-start gap-4">
                                            <div className={`p-2 rounded-lg ${task.status === "COMPLETED" ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-slate-100 dark:bg-slate-800"}`}>
                                                <Icon className={`h-5 w-5 ${task.status === "COMPLETED" ? "text-emerald-600" : "text-slate-500"}`} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <h3 className={`font-medium ${task.status === "COMPLETED" ? "line-through" : ""}`}>
                                                            {task.title}
                                                        </h3>
                                                        {task.description && (
                                                            <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                                                                {task.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-xs font-medium ${priorityColors[task.priority]}`}>
                                                            {task.priority}
                                                        </span>
                                                        <Badge variant={config.color}>{config.label}</Badge>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
                                                    {task.dueDate && (
                                                        <div className={`flex items-center gap-1 ${isOverdue ? "text-red-500" : ""}`}>
                                                            <Calendar className="h-3.5 w-3.5" />
                                                            {formatDate(task.dueDate)}
                                                            {isOverdue && " (Overdue)"}
                                                        </div>
                                                    )}
                                                    {task.lead && (
                                                        <span>Lead: {task.lead.firstName} {task.lead.lastName}</span>
                                                    )}
                                                    {task.opportunity && (
                                                        <span>Opp: {task.opportunity.name}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
