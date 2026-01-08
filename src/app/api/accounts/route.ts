import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/accounts - List all accounts
export async function GET() {
    const session = (await auth()) as { user?: { id: string } } | null;
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const accounts = await prisma.cRMAccount.findMany({
            include: {
                _count: {
                    select: {
                        contacts: true,
                        opportunities: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(accounts);
    } catch (error) {
        console.error("Failed to fetch accounts:", error);
        return NextResponse.json({ error: "Failed to fetch accounts" }, { status: 500 });
    }
}

// POST /api/accounts - Create a new account
export async function POST(request: NextRequest) {
    const session = (await auth()) as { user?: { id: string } } | null;
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const data = await request.json();

        // Validate required fields
        if (!data.name) {
            return NextResponse.json(
                { error: "Account name is required" },
                { status: 400 }
            );
        }

        const account = await prisma.cRMAccount.create({
            data: {
                name: data.name,
                website: data.website || null,
                industry: data.industry || null,
                description: data.description || null,
                phone: data.phone || null,
                annualRevenue: data.annualRevenue || null,
                employees: data.employees || null,
                billingStreet: data.billingStreet || null,
                billingCity: data.billingCity || null,
                billingState: data.billingState || null,
                billingZipCode: data.billingZipCode || null,
                billingCountry: data.billingCountry || null,
                shippingStreet: data.shippingStreet || null,
                shippingCity: data.shippingCity || null,
                shippingState: data.shippingState || null,
                shippingZipCode: data.shippingZipCode || null,
                shippingCountry: data.shippingCountry || null,
                latitude: data.latitude || null,
                longitude: data.longitude || null,
            },
        });

        return NextResponse.json(account, { status: 201 });
    } catch (error) {
        console.error("Failed to create account:", error);
        return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
    }
}
