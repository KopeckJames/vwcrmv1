import Link from "next/link";
import { Header } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Plus, Mail, Phone, Building2, MapPin } from "lucide-react";
import prisma from "@/lib/prisma";

type ContactWithAccount = {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    jobTitle: string | null;
    city: string | null;
    state: string | null;
    account: { id: string; name: string } | null;
};

async function getContacts(): Promise<ContactWithAccount[]> {
    try {
        const contacts = await prisma.contact.findMany({
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                jobTitle: true,
                city: true,
                state: true,
                account: {
                    select: { id: true, name: true },
                },
            },
            orderBy: { createdAt: "desc" },
            take: 100,
        });
        return contacts;
    } catch {
        return [];
    }
}

export default async function ContactsPage() {
    const contacts = await getContacts();

    return (
        <div className="flex flex-col min-h-screen">
            <Header title="Contacts" />

            <div className="flex-1 p-6">
                <div className="flex items-center justify-between mb-6">
                    <p className="text-slate-500 dark:text-slate-400">
                        Manage your customer contacts
                    </p>
                    <Link href="/dashboard/contacts/new">
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Contact
                        </Button>
                    </Link>
                </div>

                {contacts.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                                <Plus className="h-8 w-8 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">No contacts yet</h3>
                            <p className="text-slate-500 text-center max-w-md mb-6">
                                Start by adding your first contact.
                            </p>
                            <Link href="/dashboard/contacts/new">
                                <Button>Add Your First Contact</Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4">
                        {contacts.map((contact) => (
                            <Link key={contact.id} href={`/dashboard/contacts/${contact.id}`}>
                                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                                    <CardContent className="p-4">
                                        <div className="flex items-start gap-4">
                                            <Avatar fallback={`${contact.firstName} ${contact.lastName}`} size="lg" />
                                            <div className="flex-1">
                                                <h3 className="font-semibold">
                                                    {contact.firstName} {contact.lastName}
                                                </h3>
                                                {contact.account && (
                                                    <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                                                        <Building2 className="h-3.5 w-3.5" />
                                                        {contact.account.name}
                                                        {contact.jobTitle && ` • ${contact.jobTitle}`}
                                                    </div>
                                                )}
                                                <div className="flex flex-wrap gap-3 mt-2 text-sm text-slate-500">
                                                    {contact.email && (
                                                        <span className="flex items-center gap-1">
                                                            <Mail className="h-3.5 w-3.5" />
                                                            {contact.email}
                                                        </span>
                                                    )}
                                                    {contact.phone && (
                                                        <span className="flex items-center gap-1">
                                                            <Phone className="h-3.5 w-3.5" />
                                                            {contact.phone}
                                                        </span>
                                                    )}
                                                    {contact.city && (
                                                        <span className="flex items-center gap-1">
                                                            <MapPin className="h-3.5 w-3.5" />
                                                            {contact.city}, {contact.state}
                                                        </span>
                                                    )}
                                                </div>
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
