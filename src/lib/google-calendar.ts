import { google } from "googleapis";

export interface CalendarEvent {
    id?: string;
    title: string;
    description?: string;
    location?: string;
    startTime: Date;
    endTime: Date;
    attendees?: string[];
}

export async function createGoogleCalendarClient(accessToken: string) {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    return google.calendar({ version: "v3", auth: oauth2Client });
}

export async function fetchGoogleCalendarEvents(
    accessToken: string,
    startDate: Date,
    endDate: Date
): Promise<CalendarEvent[]> {
    const calendar = await createGoogleCalendarClient(accessToken);

    const response = await calendar.events.list({
        calendarId: "primary",
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        singleEvents: true,
        orderBy: "startTime",
        maxResults: 100,
    });

    return (response.data.items || []).map((event) => ({
        id: event.id || undefined,
        title: event.summary || "Untitled",
        description: event.description || undefined,
        location: event.location || undefined,
        startTime: new Date(event.start?.dateTime || event.start?.date || new Date()),
        endTime: new Date(event.end?.dateTime || event.end?.date || new Date()),
        attendees: event.attendees?.map((a) => a.email).filter(Boolean) as string[],
    }));
}

export async function createGoogleCalendarEvent(
    accessToken: string,
    event: CalendarEvent
): Promise<CalendarEvent> {
    const calendar = await createGoogleCalendarClient(accessToken);

    const response = await calendar.events.insert({
        calendarId: "primary",
        requestBody: {
            summary: event.title,
            description: event.description,
            location: event.location,
            start: {
                dateTime: event.startTime.toISOString(),
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
            end: {
                dateTime: event.endTime.toISOString(),
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
            attendees: event.attendees?.map((email) => ({ email })),
        },
    });

    return {
        id: response.data.id || undefined,
        title: response.data.summary || event.title,
        description: response.data.description || undefined,
        location: response.data.location || undefined,
        startTime: new Date(response.data.start?.dateTime || event.startTime),
        endTime: new Date(response.data.end?.dateTime || event.endTime),
    };
}

export async function updateGoogleCalendarEvent(
    accessToken: string,
    eventId: string,
    updates: Partial<CalendarEvent>
): Promise<CalendarEvent> {
    const calendar = await createGoogleCalendarClient(accessToken);

    const requestBody: any = {};
    if (updates.title) requestBody.summary = updates.title;
    if (updates.description !== undefined) requestBody.description = updates.description;
    if (updates.location !== undefined) requestBody.location = updates.location;
    if (updates.startTime) {
        requestBody.start = {
            dateTime: updates.startTime.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        };
    }
    if (updates.endTime) {
        requestBody.end = {
            dateTime: updates.endTime.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        };
    }

    const response = await calendar.events.patch({
        calendarId: "primary",
        eventId,
        requestBody,
    });

    return {
        id: response.data.id || eventId,
        title: response.data.summary || "",
        description: response.data.description || undefined,
        location: response.data.location || undefined,
        startTime: new Date(response.data.start?.dateTime || new Date()),
        endTime: new Date(response.data.end?.dateTime || new Date()),
    };
}

export async function deleteGoogleCalendarEvent(
    accessToken: string,
    eventId: string
): Promise<void> {
    const calendar = await createGoogleCalendarClient(accessToken);
    await calendar.events.delete({
        calendarId: "primary",
        eventId,
    });
}

export async function getFreeBusySlots(
    accessToken: string,
    emails: string[],
    startDate: Date,
    endDate: Date
): Promise<Record<string, { start: Date; end: Date }[]>> {
    const calendar = await createGoogleCalendarClient(accessToken);

    const response = await calendar.freebusy.query({
        requestBody: {
            timeMin: startDate.toISOString(),
            timeMax: endDate.toISOString(),
            items: emails.map((email) => ({ id: email })),
        },
    });

    const result: Record<string, { start: Date; end: Date }[]> = {};

    for (const [email, data] of Object.entries(response.data.calendars || {})) {
        result[email] = (data.busy || []).map((slot) => ({
            start: new Date(slot.start || new Date()),
            end: new Date(slot.end || new Date()),
        }));
    }

    return result;
}
