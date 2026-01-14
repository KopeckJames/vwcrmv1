import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const bulkAssignSchema = z.object({
    leadIds: z.array(z.string()).min(1),
    assignedToId: z.string().min(1),
});

export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { leadIds, assignedToId } = bulkAssignSchema.parse(body);

        // Verify user exists
        const user = await prisma.user.findUnique({
            where: { id: assignedToId },
            select: { id: true },
        });

        if (!user) {
            return NextResponse.json({ error: "Target user not found" }, { status: 404 });
        }

        const result = await prisma.lead.updateMany({
            where: {
                id: { in: leadIds },
            },
            data: {
                assignedToId,
            },
        });

        return NextResponse.json({
            message: `Successfully reassigned ${result.count} leads`,
            count: result.count,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error("Failed to bulk reassign leads:", error);
        return NextResponse.json({ error: "Failed to bulk reassign leads" }, { status: 500 });
    }
}
