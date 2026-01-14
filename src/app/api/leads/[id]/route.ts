import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const leadUpdateSchema = z.object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    email: z.string().email().optional().nullable(),
    phone: z.string().optional().nullable(),
    mobile: z.string().optional().nullable(),
    company: z.string().optional().nullable(),
    jobTitle: z.string().optional().nullable(),
    website: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "UNQUALIFIED", "CONVERTED", "DEAD"]).optional(),
    source: z.string().optional().nullable(),
    estimatedValue: z.number().optional().nullable(),
    street: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    state: z.string().optional().nullable(),
    zipCode: z.string().optional().nullable(),
    country: z.string().optional().nullable(),
    latitude: z.number().optional().nullable(),
    longitude: z.number().optional().nullable(),
    assignedToId: z.string().optional().nullable(),
    territoryId: z.string().optional().nullable(),
});

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/leads/[id] - Get a single lead
export async function GET(request: NextRequest, { params }: RouteParams) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const where: any = { id };
    if (session.user.role !== "admin") {
        where.assignedToId = session.user.id;
    }

    const lead = await prisma.lead.findFirst({
        where,
        include: {
            assignedTo: {
                select: { id: true, name: true, email: true, image: true },
            },
            territory: true,
            activities: {
                orderBy: { dateTime: "desc" },
                take: 10,
            },
            tasks: {
                orderBy: { dueDate: "asc" },
                where: { status: { not: "COMPLETED" } },
                take: 5,
            },
            doorActivities: {
                orderBy: { createdAt: "desc" },
                take: 10,
            },
        },
    });

    if (!lead) {
        return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json(lead);
}

// PATCH /api/leads/[id] - Update a lead
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    try {
        const body = await request.json();
        const validated = leadUpdateSchema.parse(body);

        const where: any = { id };
        if (session.user.role !== "admin") {
            where.assignedToId = session.user.id;
        }

        const lead = await prisma.lead.update({
            where,
            data: validated,
            include: {
                assignedTo: {
                    select: { id: true, name: true, image: true },
                },
            },
        });

        return NextResponse.json(lead);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error("Failed to update lead:", error);
        return NextResponse.json({ error: "Failed to update lead" }, { status: 500 });
    }
}

// DELETE /api/leads/[id] - Delete a lead
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    try {
        const where: any = { id };
        if (session.user.role !== "admin") {
            where.assignedToId = session.user.id;
        }

        await prisma.lead.delete({
            where,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete lead:", error);
        return NextResponse.json({ error: "Failed to delete lead" }, { status: 500 });
    }
}
