import { Header } from "@/components/dashboard/header";
import { MapView } from "./map-view";
import prisma from "@/lib/prisma";

async function getMapData() {
    try {
        const [leads, contacts, accounts, doorActivities] = await Promise.all([
            prisma.lead.findMany({
                where: {
                    latitude: { not: null },
                    longitude: { not: null },
                },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    company: true,
                    status: true,
                    latitude: true,
                    longitude: true,
                    city: true,
                    state: true,
                },
            }),
            prisma.contact.findMany({
                where: {
                    latitude: { not: null },
                    longitude: { not: null },
                },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    latitude: true,
                    longitude: true,
                    city: true,
                    state: true,
                },
            }),
            prisma.cRMAccount.findMany({
                where: {
                    latitude: { not: null },
                    longitude: { not: null },
                },
                select: {
                    id: true,
                    name: true,
                    industry: true,
                    latitude: true,
                    longitude: true,
                    billingCity: true,
                    billingState: true,
                },
            }),
            prisma.doorActivity.findMany({
                select: {
                    id: true,
                    outcome: true,
                    latitude: true,
                    longitude: true,
                    createdAt: true,
                    notes: true,
                },
                orderBy: { createdAt: "desc" },
                take: 500,
            }),
        ]);

        return { leads, contacts, accounts, doorActivities };
    } catch {
        return { leads: [], contacts: [], accounts: [], doorActivities: [] };
    }
}

export default async function MapPage() {
    const data = await getMapData();

    return (
        <div className="flex flex-col min-h-screen">
            <Header title="Map" />
            <div className="flex-1 p-6">
                <MapView data={data} />
            </div>
        </div>
    );
}
