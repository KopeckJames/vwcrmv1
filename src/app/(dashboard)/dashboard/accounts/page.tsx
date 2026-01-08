import Link from "next/link";
import { Header } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Globe, Phone, Users, DollarSign } from "lucide-react";
import prisma from "@/lib/prisma";

type AccountWithCount = {
    id: string;
    name: string;
    industry: string | null;
    website: string | null;
    phone: string | null;
    _count: { contacts: number; opportunities: number };
};

async function getAccounts(): Promise<AccountWithCount[]> {
    try {
        const accounts = await prisma.cRMAccount.findMany({
            select: {
                id: true,
                name: true,
                industry: true,
                website: true,
                phone: true,
                _count: {
                    select: { contacts: true, opportunities: true },
                },
            },
            orderBy: { createdAt: "desc" },
            take: 100,
        });
        return accounts;
    } catch {
        return [];
    }
}

export default async function AccountsPage() {
    const accounts = await getAccounts();

    return (
        <div className="flex flex-col min-h-screen">
            <Header title="Accounts" />

            <div className="flex-1 p-6">
                <div className="flex items-center justify-between mb-6">
                    <p className="text-slate-500 dark:text-slate-400">
                        Manage your company accounts
                    </p>
                    <Link href="/dashboard/accounts/new">
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Account
                        </Button>
                    </Link>
                </div>

                {accounts.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                                <Plus className="h-8 w-8 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">No accounts yet</h3>
                            <p className="text-slate-500 text-center max-w-md mb-6">
                                Start by adding your first company account.
                            </p>
                            <Link href="/dashboard/accounts/new">
                                <Button>Add Your First Account</Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {accounts.map((account) => (
                            <Link key={account.id} href={`/dashboard/accounts/${account.id}`}>
                                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white font-bold text-lg">
                                                {account.name.charAt(0).toUpperCase()}
                                            </div>
                                            {account.industry && (
                                                <Badge variant="secondary">{account.industry}</Badge>
                                            )}
                                        </div>
                                        <h3 className="font-semibold text-lg mb-2">{account.name}</h3>
                                        <div className="space-y-1 text-sm text-slate-500">
                                            {account.website && (
                                                <div className="flex items-center gap-1">
                                                    <Globe className="h-3.5 w-3.5" />
                                                    <span className="truncate">{account.website}</span>
                                                </div>
                                            )}
                                            {account.phone && (
                                                <div className="flex items-center gap-1">
                                                    <Phone className="h-3.5 w-3.5" />
                                                    {account.phone}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                            <div className="flex items-center gap-1 text-sm">
                                                <Users className="h-4 w-4 text-slate-400" />
                                                <span>{account._count.contacts} contacts</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-sm">
                                                <DollarSign className="h-4 w-4 text-slate-400" />
                                                <span>{account._count.opportunities} opps</span>
                                            </div>
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
