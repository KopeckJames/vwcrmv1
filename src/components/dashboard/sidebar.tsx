"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Users,
    Building2,
    Target,
    TrendingUp,
    CheckSquare,
    Calendar,
    Map,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    DoorOpen,
} from "lucide-react";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { Avatar } from "@/components/ui/avatar";

interface SidebarProps {
    user?: {
        name?: string | null;
        email?: string | null;
        image?: string | null;
    };
}

const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Leads", href: "/dashboard/leads", icon: Target },
    { name: "Contacts", href: "/dashboard/contacts", icon: Users },
    { name: "Accounts", href: "/dashboard/accounts", icon: Building2 },
    { name: "Opportunities", href: "/dashboard/opportunities", icon: TrendingUp },
    { name: "Tasks", href: "/dashboard/tasks", icon: CheckSquare },
    { name: "Door Activity", href: "/dashboard/door-activity", icon: DoorOpen },
    { name: "Calendar", href: "/dashboard/calendar", icon: Calendar },
    { name: "Map", href: "/dashboard/map", icon: Map },
];

const bottomNavigation = [
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar({ user }: SidebarProps) {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);

    return (
        <aside
            className={cn(
                "flex flex-col h-screen bg-slate-900 text-white transition-all duration-300",
                collapsed ? "w-16" : "w-64"
            )}
        >
            {/* Logo */}
            <div className="flex items-center h-16 px-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-lg">
                        C
                    </div>
                    {!collapsed && (
                        <span className="font-semibold text-lg">My CRM</span>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4">
                <ul className="space-y-1 px-2">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                        return (
                            <li key={item.name}>
                                <Link
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                                        isActive
                                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25"
                                            : "text-slate-300 hover:bg-slate-800 hover:text-white"
                                    )}
                                >
                                    <item.icon className="h-5 w-5 flex-shrink-0" />
                                    {!collapsed && <span>{item.name}</span>}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* Bottom section */}
            <div className="border-t border-slate-800 p-2">
                <ul className="space-y-1">
                    {bottomNavigation.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <li key={item.name}>
                                <Link
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                                        isActive
                                            ? "bg-slate-800 text-white"
                                            : "text-slate-300 hover:bg-slate-800 hover:text-white"
                                    )}
                                >
                                    <item.icon className="h-5 w-5 flex-shrink-0" />
                                    {!collapsed && <span>{item.name}</span>}
                                </Link>
                            </li>
                        );
                    })}
                    <li>
                        <button
                            onClick={() => signOut({ callbackUrl: "/login" })}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-all duration-200 w-full"
                        >
                            <LogOut className="h-5 w-5 flex-shrink-0" />
                            {!collapsed && <span>Sign Out</span>}
                        </button>
                    </li>
                </ul>

                {/* User profile */}
                {user && (
                    <div className="mt-4 pt-4 border-t border-slate-800">
                        <div className="flex items-center gap-3 px-3 py-2">
                            <Avatar
                                src={user.image ?? undefined}
                                fallback={user.name || user.email || undefined}
                                size="sm"
                            />
                            {!collapsed && (
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate">
                                        {user.name}
                                    </p>
                                    <p className="text-xs text-slate-400 truncate">
                                        {user.email}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Collapse button */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="mt-2 flex items-center justify-center w-full py-2 text-slate-400 hover:text-white transition-colors"
                >
                    {collapsed ? (
                        <ChevronRight className="h-5 w-5" />
                    ) : (
                        <ChevronLeft className="h-5 w-5" />
                    )}
                </button>
            </div>
        </aside>
    );
}
