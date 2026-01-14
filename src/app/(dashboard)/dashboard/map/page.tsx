import { Header } from "@/components/dashboard/header";
import { MapView } from "./map-view";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

async function getMapData() {
    const session = await auth();
    if (!session?.user) {
        return { leads: [], contacts: [], accounts: [], doorActivities: [], user: null };
    }

    const userId = session.user.id;
    const isAdmin = session.user.role === "admin";

    try {
        const [leads, contacts, accounts, doorActivities] = await Promise.all([
            prisma.lead.findMany({
                where: {
                    latitude: { not: null },
                    longitude: { not: null },
                    ...(isAdmin ? {} : { assignedToId: userId }),
                },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    company: true,
                    status: true,
                    latitude: true,
                    longitude: true,
                    street: true,
                    city: true,
                    state: true,
                    zipCode: true,
                    email: true,
                    phone: true,
                    description: true,
                    assignedToId: true,
                    assignedTo: {
                        select: {
                            id: true,
                            name: true,
                            image: true,
                        },
                    },
                    assignedAdmin: {
                        select: {
                            id: true,
                            name: true,
                            image: true,
                        },
                    },
                },
            }),
            prisma.contact.findMany({
                where: {
                    latitude: { not: null },
                    longitude: { not: null },
                    ...(isAdmin ? {} : { assignedToId: userId }),
                },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    latitude: true,
                    longitude: true,
                    city: true,
                    state: true,
                    assignedToId: true,
                },
            }),
            prisma.cRMAccount.findMany({
                where: {
                    latitude: { not: null },
                    longitude: { not: null },
                    ...(isAdmin ? {} : { assignedToId: userId }),
                },
                select: {
                    id: true,
                    name: true,
                    industry: true,
                    latitude: true,
                    longitude: true,
                    billingCity: true,
                    billingState: true,
                    assignedToId: true,
                },
            }),
            prisma.doorActivity.findMany({
                where: {
                    ...(isAdmin ? {} : { userId: userId }),
                },
                select: {
                    id: true,
                    outcome: true,
                    latitude: true,
                    longitude: true,
                    createdAt: true,
                    notes: true,
                    leadId: true,
                    contactId: true,
                    userId: true,
                },
                orderBy: { createdAt: "desc" },
                take: 1000,
            }),
        ]);

        return { leads, contacts, accounts, doorActivities, user: session.user };
    } catch (error) {
        console.error("Failed to fetch map data:", error);
        return { leads: [], contacts: [], accounts: [], doorActivities: [], user: session.user };
    }
}

export default async function MapPage() {
    const data = await getMapData();

    return (
        <div className="flex flex-col min-h-screen">
            <Header title="Map" />
            <div className="flex-1 p-6">
                <MapView data={data} user={data.user} />
            </div>
        </div>
    );
}
