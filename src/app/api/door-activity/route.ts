import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const doorActivitySchema = z.object({
    outcome: z.enum([
        "NO_ANSWER",
        "LEFT_MATERIALS",
        "SPOKE_WITH_RESIDENT",
        "NOT_INTERESTED",
        "INTERESTED",
        "APPOINTMENT_SET",
        "WRONG_ADDRESS",
        "DO_NOT_CONTACT",
    ]),
    notes: z.string().optional().nullable(),
    leftMaterials: z.boolean().default(false),
    materialsType: z.string().optional().nullable(),
    latitude: z.number(),
    longitude: z.number(),
    photoUrl: z.string().optional().nullable(),
    leadId: z.string().optional().nullable(),
    contactId: z.string().optional().nullable(),
});

// GET /api/door-activity - List door activities
export async function GET(request: NextRequest) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const date = searchParams.get("date"); // Format: YYYY-MM-DD

    const where: any = {
        userId: session.user.id,
    };

    if (date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        where.createdAt = {
            gte: startOfDay,
            lte: endOfDay,
        };
    }

    const [activities, total] = await Promise.all([
        prisma.doorActivity.findMany({
            where,
            include: {
                lead: {
                    select: { id: true, firstName: true, lastName: true },
                },
                contact: {
                    select: { id: true, firstName: true, lastName: true },
                },
            },
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.doorActivity.count({ where }),
    ]);

    return NextResponse.json({
        data: activities,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
        },
    });
}

// POST /api/door-activity - Log a new door activity
export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const validated = doorActivitySchema.parse(body);

        const activity = await prisma.doorActivity.create({
            data: {
                ...validated,
                userId: session.user.id,
            },
            include: {
                lead: {
                    select: { id: true, firstName: true, lastName: true },
                },
                contact: {
                    select: { id: true, firstName: true, lastName: true },
                },
            },
        });

        // If this was linked to a lead and they were interested, update the lead status
        if (validated.leadId && validated.outcome === "INTERESTED") {
            await prisma.lead.update({
                where: { id: validated.leadId },
                data: { status: "CONTACTED" },
            });
        }

        // If an appointment was set, update to qualified
        if (validated.leadId && validated.outcome === "APPOINTMENT_SET") {
            await prisma.lead.update({
                where: { id: validated.leadId },
                data: { status: "QUALIFIED" },
            });
        }

        return NextResponse.json(activity, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error("Failed to create door activity:", error);
        return NextResponse.json({ error: "Failed to create door activity" }, { status: 500 });
    }
}
