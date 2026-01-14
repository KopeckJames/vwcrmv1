import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const leadCreateSchema = z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
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
    territoryId: z.string().optional().nullable(),
});

// GET /api/leads - List all leads
export async function GET(request: NextRequest) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: any = {};

    // Only filter by assignedToId if the user is NOT an admin
    if (session.user.role !== "admin") {
        where.assignedToId = session.user.id;
    }

    if (status) {
        where.status = status;
    }

    if (search) {
        where.OR = [
            { firstName: { contains: search, mode: "insensitive" } },
            { lastName: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { company: { contains: search, mode: "insensitive" } },
        ];
    }

    const [leads, total] = await Promise.all([
        prisma.lead.findMany({
            where,
            include: {
                assignedTo: {
                    select: { id: true, name: true, image: true },
                },
                territory: true,
            },
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.lead.count({ where }),
    ]);

    return NextResponse.json({
        data: leads,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
        },
    });
}

// POST /api/leads - Create a new lead
export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const validated = leadCreateSchema.parse(body);

        const lead = await prisma.lead.create({
            data: {
                ...validated,
                assignedToId: session.user.id,
            },
            include: {
                assignedTo: {
                    select: { id: true, name: true, image: true },
                },
            },
        });

        return NextResponse.json(lead, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error("Failed to create lead:", error);
        return NextResponse.json({ error: "Failed to create lead" }, { status: 500 });
    }
}
