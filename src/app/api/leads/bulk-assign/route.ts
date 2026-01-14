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

        const leadsToUpdate = await prisma.lead.findMany({
            where: { id: { in: leadIds } },
            include: { assignedTo: true },
        });

        const updates = leadsToUpdate.map(lead => {
            const data: any = { assignedToId };
            // If currently assigned to an admin and has no overseeing admin,
            // set the overseeing admin to the current admin.
            if (lead.assignedTo?.role === "admin" && !lead.assignedAdminId) {
                data.assignedAdminId = lead.assignedToId;
            }
            return prisma.lead.update({
                where: { id: lead.id },
                data,
            });
        });

        await Promise.all(updates);

        return NextResponse.json({
            message: `Successfully reassigned ${leadsToUpdate.length} leads`,
            count: leadsToUpdate.length,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error("Failed to bulk reassign leads:", error);
        return NextResponse.json({ error: "Failed to bulk reassign leads" }, { status: 500 });
    }
}
