import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/opportunities - List all opportunities
export async function GET() {
    const session = (await auth()) as { user?: { id: string } } | null;
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const opportunities = await prisma.opportunity.findMany({
            where: { assignedToId: session.user.id },
            include: {
                account: { select: { id: true, name: true } },
                contact: { select: { id: true, firstName: true, lastName: true } },
                assignedTo: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(opportunities);
    } catch (error) {
        console.error("Failed to fetch opportunities:", error);
        return NextResponse.json({ error: "Failed to fetch opportunities" }, { status: 500 });
    }
}

// POST /api/opportunities - Create a new opportunity
export async function POST(request: NextRequest) {
    const session = (await auth()) as { user?: { id: string } } | null;
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const data = await request.json();

        if (!data.name) {
            return NextResponse.json({ error: "Opportunity name is required" }, { status: 400 });
        }

        const opportunity = await prisma.opportunity.create({
            data: {
                name: data.name,
                description: data.description || null,
                stage: data.stage || "PROSPECTING",
                amount: data.amount ? parseFloat(data.amount) : null,
                probability: data.probability ? parseInt(data.probability) : 0,
                expectedCloseDate: data.expectedCloseDate ? new Date(data.expectedCloseDate) : null,
                accountId: data.accountId || null,
                contactId: data.contactId || null,
                assignedToId: session.user.id,
            },
            include: {
                account: { select: { id: true, name: true } },
                contact: { select: { id: true, firstName: true, lastName: true } },
            },
        });

        return NextResponse.json(opportunity, { status: 201 });
    } catch (error) {
        console.error("Failed to create opportunity:", error);
        return NextResponse.json({ error: "Failed to create opportunity" }, { status: 500 });
    }
}
