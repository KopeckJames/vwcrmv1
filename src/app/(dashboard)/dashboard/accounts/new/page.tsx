"use client";

import { useState } from "react";
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

const industries = [
    "Agriculture",
    "Automotive",
    "Banking",
    "Construction",
    "Education",
    "Energy",
    "Entertainment",
    "Financial Services",
    "Healthcare",
    "Hospitality",
    "Insurance",
    "Manufacturing",
    "Media",
    "Real Estate",
    "Retail",
    "Technology",
    "Telecommunications",
    "Transportation",
    "Utilities",
    "Other",
];

export default function NewAccountPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [industry, setIndustry] = useState<string>("");

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const data = {
            name: formData.get("name") as string,
            website: formData.get("website") || null,
            industry: industry || null,
            phone: formData.get("phone") || null,
            annualRevenue: formData.get("annualRevenue")
                ? parseFloat(formData.get("annualRevenue") as string)
                : null,
            employees: formData.get("employees")
                ? parseInt(formData.get("employees") as string)
                : null,
            billingStreet: formData.get("billingStreet") || null,
            billingCity: formData.get("billingCity") || null,
            billingState: formData.get("billingState") || null,
            billingZipCode: formData.get("billingZipCode") || null,
            billingCountry: formData.get("billingCountry") || null,
            description: formData.get("description") || null,
        };

        try {
            const res = await fetch("/api/accounts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || "Failed to create account");
            }

            router.push("/dashboard/accounts");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create account");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex flex-col min-h-screen">
            <Header title="New Account" />

            <div className="flex-1 p-6 max-w-4xl mx-auto w-full">
                <Link
                    href="/dashboard/accounts"
                    className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 mb-6"
                >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back to Accounts
                </Link>

                <form onSubmit={handleSubmit}>
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
                            {error}
                        </div>
                    )}

                    <div className="space-y-6">
                        {/* Basic Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Account Information</CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="name">Account Name *</Label>
                                    <Input id="name" name="name" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="website">Website</Label>
                                    <Input id="website" name="website" type="url" placeholder="https://" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone</Label>
                                    <Input id="phone" name="phone" type="tel" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="industry">Industry</Label>
                                    <Select value={industry} onValueChange={setIndustry}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select industry" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {industries.map((ind) => (
                                                <SelectItem key={ind} value={ind}>
                                                    {ind}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="employees">Number of Employees</Label>
                                    <Input id="employees" name="employees" type="number" min="0" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="annualRevenue">Annual Revenue ($)</Label>
                                    <Input
                                        id="annualRevenue"
                                        name="annualRevenue"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Billing Address */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Billing Address</CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="billingStreet">Street Address</Label>
                                    <Input id="billingStreet" name="billingStreet" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="billingCity">City</Label>
                                    <Input id="billingCity" name="billingCity" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="billingState">State/Province</Label>
                                    <Input id="billingState" name="billingState" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="billingZipCode">ZIP/Postal Code</Label>
                                    <Input id="billingZipCode" name="billingZipCode" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="billingCountry">Country</Label>
                                    <Input id="billingCountry" name="billingCountry" defaultValue="USA" />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Description */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Description</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        name="description"
                                        rows={3}
                                        placeholder="Add notes about this account..."
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Actions */}
                        <div className="flex justify-end gap-4">
                            <Link href="/dashboard/accounts">
                                <Button type="button" variant="outline">
                                    Cancel
                                </Button>
                            </Link>
                            <Button type="submit" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4 mr-2" />
                                        Create Account
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
