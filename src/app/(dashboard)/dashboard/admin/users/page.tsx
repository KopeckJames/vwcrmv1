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
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Users</h1>
                    <p className="text-slate-500">
                        Manage all registered users in the CRM.
                    </p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Registered</TableHead>
                            <TableHead className="text-right">ID</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell className="flex items-center gap-3">
                                    <Avatar
                                        src={user.image}
                                        fallback={user.name || user.email}
                                        size="sm"
                                    />
                                    <span className="font-medium">{user.name || "N/A"}</span>
                                </TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                    <Badge
                                        variant={user.role === "admin" ? "secondary" : "default"}
                                        className={user.role === "admin" ? "bg-slate-700 text-slate-100" : ""}
                                    >
                                        {user.role}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {format(new Date(user.createdAt), "MMM d, yyyy")}
                                </TableCell>
                                <TableCell className="text-right text-xs text-slate-400 font-mono">
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
