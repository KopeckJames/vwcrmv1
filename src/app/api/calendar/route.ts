import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
    fetchGoogleCalendarEvents,
    createGoogleCalendarEvent,
} from "@/lib/google-calendar";
import prisma from "@/lib/prisma";

// GET /api/calendar - Fetch calendar events
export async function GET(request: NextRequest) {
    const session = await auth() as { user?: { id: string }; accessToken?: string } | null;
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    if (!start || !end) {
        return NextResponse.json({ error: "start and end dates required" }, { status: 400 });
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    try {
        // Fetch from Google Calendar if connected
        let googleEvents: { id?: string; title: string; description?: string; location?: string; startTime: Date; endTime: Date }[] = [];
        if (session.accessToken) {
            try {
                googleEvents = await fetchGoogleCalendarEvents(session.accessToken, startDate, endDate);
            } catch (error) {
                console.error("Failed to fetch Google Calendar events:", error);
            }
        }

        // Fetch local events
        const localEvents = await prisma.calendarEvent.findMany({
            where: {
                userId: session.user.id,
                startTime: { gte: startDate },
                endTime: { lte: endDate },
            },
            orderBy: { startTime: "asc" },
        });

        // Combine and deduplicate events
        const allEvents = [
            ...googleEvents.map((e) => ({
                ...e,
                provider: "GOOGLE",
            })),
            ...localEvents.map((e: typeof localEvents[number]) => ({
                id: e.id,
                title: e.title,
                description: e.description,
                location: e.location,
                startTime: e.startTime,
                endTime: e.endTime,
                provider: e.provider || "LOCAL",
            })),
        ];

        return NextResponse.json({ events: allEvents });
    } catch (error) {
        console.error("Failed to fetch calendar events:", error);
        return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
    }
}

// POST /api/calendar - Create a calendar event
export async function POST(request: NextRequest) {
    const session = await auth() as { user?: { id: string }; accessToken?: string } | null;
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { title, description, location, startTime, endTime, syncToGoogle } = body;

        let googleEventId: string | undefined;

        // Create in Google Calendar if requested and connected
        if (syncToGoogle && session.accessToken) {
            try {
                const googleEvent = await createGoogleCalendarEvent(session.accessToken, {
                    title,
                    description,
                    location,
                    startTime: new Date(startTime),
                    endTime: new Date(endTime),
                });
                googleEventId = googleEvent.id;
            } catch (error) {
                console.error("Failed to create Google Calendar event:", error);
            }
        }

        // Create local event
        const event = await prisma.calendarEvent.create({
            data: {
                title,
                description,
                location,
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                userId: session.user.id,
                provider: googleEventId ? "GOOGLE" : "LOCAL",
                externalId: googleEventId,
                syncedAt: googleEventId ? new Date() : null,
            },
        });

        return NextResponse.json(event, { status: 201 });
    } catch (error) {
        console.error("Failed to create calendar event:", error);
        return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
    }
}
