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
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
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

    const where: { userId: string; createdAt?: { gte: Date; lte: Date } } = {
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

        const { street, city, state, zipCode, latitude, longitude, photoUrl, outcome, notes, leftMaterials, materialsType, contactId } = validated;

        // 1. Find or create a lead based on address
        let leadId = validated.leadId;

        if (!leadId) {
            const existingLead = await prisma.lead.findFirst({
                where: {
                    street: { equals: street, mode: 'insensitive' },
                    zipCode: { equals: zipCode, mode: 'insensitive' },
                },
            });

            if (existingLead) {
                leadId = existingLead.id;
                // Update existing lead with new info
                await (prisma.lead as any).update({
                    where: { id: leadId },
                    data: {
                        photoUrl: photoUrl || undefined,
                        lastActivityAt: new Date(),
                    },
                });
            } else {
                // Create new lead
                const newLead = await (prisma.lead as any).create({
                    data: {
                        firstName: "Unknown",
                        lastName: "Resident",
                        street,
                        city,
                        state,
                        zipCode,
                        latitude,
                        longitude,
                        photoUrl,
                        status: outcome === "INTERESTED" ? "CONTACTED" : outcome === "APPOINTMENT_SET" ? "QUALIFIED" : "NEW",
                        assignedToId: session.user.id,
                        lastActivityAt: new Date(),
                    },
                });
                leadId = newLead.id;
            }
        } else {
            // Update existing lead if ID was provided
            await (prisma.lead as any).update({
                where: { id: leadId },
                data: {
                    photoUrl: photoUrl || undefined,
                    lastActivityAt: new Date(),
                },
            });
        }

        // 2. Create the door activity
        const activity = await prisma.doorActivity.create({
            data: {
                outcome,
                notes,
                leftMaterials,
                materialsType,
                latitude,
                longitude,
                photoUrl,
                userId: session.user.id,
                leadId,
                contactId,
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

        // 3. Update lead status based on outcome (redundant for new, but good for existing)
        if (leadId) {
            if (outcome === "INTERESTED") {
                await prisma.lead.update({
                    where: { id: leadId },
                    data: { status: "CONTACTED" },
                });
            } else if (outcome === "APPOINTMENT_SET") {
                await prisma.lead.update({
                    where: { id: leadId },
                    data: { status: "QUALIFIED" },
                });
            }
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
