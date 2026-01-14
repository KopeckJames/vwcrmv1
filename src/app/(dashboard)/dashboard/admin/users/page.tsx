import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default async function AdminUsersPage() {
    const session = await auth();

    if (!session?.user || session.user.role !== "admin") {
        redirect("/dashboard");
    }

    const users = await prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            _count: {
                select: {
                    assignedLeads: true,
                    administeredLeads: true,
                }
            }
        }
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight">Users</h1>
                        <Badge variant="secondary" className="px-2 py-0.5">
                            {users.length} Total
                        </Badge>
                    </div>
                    <p className="text-slate-500">
                        Manage all registered users and track their lead assignments.
                    </p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead className="text-center">Assigned Leads</TableHead>
                            <TableHead className="text-center">Overseeing</TableHead>
                            <TableHead>Registered</TableHead>
                            <TableHead className="text-right">ID</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar
                                            src={user.image ?? undefined}
                                            fallback={user.name || "U"}
                                            className="h-9 w-9"
                                        />
                                        <div className="flex flex-col">
                                            <span className="font-medium">{user.name || "N/A"}</span>
                                            <span className="text-xs text-slate-500">{user.email}</span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant={user.role === "admin" ? "secondary" : "default"}
                                        className={user.role === "admin" ? "bg-slate-700 text-slate-100" : ""}
                                    >
                                        {user.role}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                    <Badge variant="default" className="font-mono">
                                        {user._count.assignedLeads}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                    {user.role === "admin" ? (
                                        <Badge variant="info" className="font-mono bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800">
                                            {user._count.administeredLeads}
                                        </Badge>
                                    ) : (
                                        <span className="text-slate-300">—</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-sm">
                                    {format(new Date(user.createdAt), "MMM d, yyyy")}
                                </TableCell>
                                <TableCell className="text-right text-[10px] text-slate-400 font-mono">
                                    {user.id}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

// Minimal Table implementation if UI component doesn't exist
// (Adding this just in case, but usually I'd check src/components/ui/table.tsx)
