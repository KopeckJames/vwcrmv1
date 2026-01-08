"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";

type Account = { id: string; name: string };
type Contact = { id: string; firstName: string; lastName: string };

const stages = [
    { value: "PROSPECTING", label: "Prospecting" },
    { value: "QUALIFICATION", label: "Qualification" },
    { value: "NEEDS_ANALYSIS", label: "Needs Analysis" },
    { value: "VALUE_PROPOSITION", label: "Value Proposition" },
    { value: "NEGOTIATION", label: "Negotiation" },
    { value: "CLOSED_WON", label: "Closed Won" },
    { value: "CLOSED_LOST", label: "Closed Lost" },
];

export default function NewOpportunityPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [stage, setStage] = useState("PROSPECTING");
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [selectedAccountId, setSelectedAccountId] = useState("");
    const [selectedContactId, setSelectedContactId] = useState("");

    useEffect(() => {
        fetch("/api/accounts").then(r => r.json()).then(d => Array.isArray(d) && setAccounts(d)).catch(() => { });
        fetch("/api/contacts").then(r => r.json()).then(d => Array.isArray(d) && setContacts(d)).catch(() => { });
    }, []);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const data = {
            name: formData.get("name") as string,
            description: formData.get("description") || null,
            stage,
            amount: formData.get("amount") || null,
            probability: formData.get("probability") || null,
            expectedCloseDate: formData.get("expectedCloseDate") || null,
            accountId: selectedAccountId || null,
            contactId: selectedContactId || null,
        };

        try {
            const res = await fetch("/api/opportunities", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || "Failed to create opportunity");
            }

            router.push("/dashboard/opportunities");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create opportunity");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex flex-col min-h-screen">
            <Header title="New Opportunity" />

            <div className="flex-1 p-6 max-w-4xl mx-auto w-full">
                <Link href="/dashboard/opportunities" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 mb-6">
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back to Opportunities
                </Link>

                <form onSubmit={handleSubmit}>
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
                            {error}
                        </div>
                    )}

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Opportunity Details</CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="name">Opportunity Name *</Label>
                                    <Input id="name" name="name" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="stage">Stage</Label>
                                    <Select value={stage} onValueChange={setStage}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {stages.map(s => (
                                                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="amount">Amount ($)</Label>
                                    <Input id="amount" name="amount" type="number" step="0.01" min="0" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="probability">Probability (%)</Label>
                                    <Input id="probability" name="probability" type="number" min="0" max="100" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="expectedCloseDate">Expected Close Date</Label>
                                    <Input id="expectedCloseDate" name="expectedCloseDate" type="date" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="account">Account</Label>
                                    <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select account (optional)" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {accounts.map(a => (
                                                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="contact">Contact</Label>
                                    <Select value={selectedContactId} onValueChange={setSelectedContactId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select contact (optional)" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {contacts.map(c => (
                                                <SelectItem key={c.id} value={c.id}>{c.firstName} {c.lastName}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea id="description" name="description" rows={3} placeholder="Add notes..." />
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex justify-end gap-4">
                            <Link href="/dashboard/opportunities">
                                <Button type="button" variant="outline">Cancel</Button>
                            </Link>
                            <Button type="submit" disabled={loading}>
                                {loading ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating...</>) : (<><Save className="h-4 w-4 mr-2" />Create Opportunity</>)}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
