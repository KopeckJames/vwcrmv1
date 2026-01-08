import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/tasks - List all tasks
export async function GET() {
    const session = (await auth()) as { user?: { id: string } } | null;
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const tasks = await prisma.task.findMany({
            where: { assignedToId: session.user.id },
            include: {
                assignedTo: { select: { id: true, name: true } },
                contact: { select: { id: true, firstName: true, lastName: true } },
                lead: { select: { id: true, firstName: true, lastName: true } },
                opportunity: { select: { id: true, name: true } },
            },
            orderBy: { dueDate: "asc" },
        });

        return NextResponse.json(tasks);
    } catch (error) {
        console.error("Failed to fetch tasks:", error);
        return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
    }
}

// POST /api/tasks - Create a new task
export async function POST(request: NextRequest) {
    const session = (await auth()) as { user?: { id: string } } | null;
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const data = await request.json();

        if (!data.title) {
            return NextResponse.json({ error: "Task title is required" }, { status: 400 });
        }

        const task = await prisma.task.create({
            data: {
                title: data.title,
                description: data.description || null,
                status: data.status || "NOT_STARTED",
                priority: data.priority || "MEDIUM",
                dueDate: data.dueDate ? new Date(data.dueDate) : null,
                assignedToId: session.user.id,
                contactId: data.contactId || null,
                leadId: data.leadId || null,
                opportunityId: data.opportunityId || null,
            },
            include: {
                assignedTo: { select: { id: true, name: true } },
            },
        });

        return NextResponse.json(task, { status: 201 });
    } catch (error) {
        console.error("Failed to create task:", error);
        return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
    }
}
