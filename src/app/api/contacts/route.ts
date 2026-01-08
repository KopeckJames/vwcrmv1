import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/contacts - List all contacts
export async function GET() {
    const session = (await auth()) as { user?: { id: string } } | null;
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const contacts = await prisma.contact.findMany({
            include: {
                account: {
                    select: { id: true, name: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(contacts);
    } catch (error) {
        console.error("Failed to fetch contacts:", error);
        return NextResponse.json({ error: "Failed to fetch contacts" }, { status: 500 });
    }
}

// POST /api/contacts - Create a new contact
export async function POST(request: NextRequest) {
    const session = (await auth()) as { user?: { id: string } } | null;
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const data = await request.json();

        // Validate required fields
        if (!data.firstName || !data.lastName) {
            return NextResponse.json(
                { error: "First name and last name are required" },
                { status: 400 }
            );
        }

        const contact = await prisma.contact.create({
            data: {
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email || null,
                phone: data.phone || null,
                mobile: data.mobile || null,
                jobTitle: data.jobTitle || null,
                department: data.department || null,
                description: data.description || null,
                street: data.street || null,
                city: data.city || null,
                state: data.state || null,
                zipCode: data.zipCode || null,
                country: data.country || null,
                latitude: data.latitude || null,
                longitude: data.longitude || null,
                accountId: data.accountId || null,
            },
            include: {
                account: {
                    select: { id: true, name: true },
                },
            },
        });

        return NextResponse.json(contact, { status: 201 });
    } catch (error) {
        console.error("Failed to create contact:", error);
        return NextResponse.json({ error: "Failed to create contact" }, { status: 500 });
    }
}
