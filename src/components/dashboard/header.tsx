"use client";

import { Bell, Search, Plus, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface HeaderProps {
    title: string;
    onMobileMenuToggle?: () => void;
}

export function Header({ title, onMobileMenuToggle }: HeaderProps) {
    const [searchOpen, setSearchOpen] = useState(false);

    return (
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-slate-200 bg-white/80 backdrop-blur-sm px-6 dark:border-slate-800 dark:bg-slate-950/80">
            {/* Mobile menu button */}
            <button
                onClick={onMobileMenuToggle}
                className="lg:hidden p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            >
                <Menu className="h-5 w-5" />
            </button>

            {/* Title */}
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                {title}
            </h1>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Search */}
            <div className="hidden md:flex items-center">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        type="search"
                        placeholder="Search... (⌘K)"
                        className="w-64 pl-9 bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-800"
                    />
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
                </Button>

                <Button size="sm">
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline ml-1">New</span>
                </Button>
            </div>
        </header>
    );
}
