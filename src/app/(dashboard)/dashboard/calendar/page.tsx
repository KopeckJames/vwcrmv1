"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/dashboard/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    ChevronLeft,
    ChevronRight,
    Plus,
    Calendar as CalendarIcon,
    Clock,
    MapPin,
    Loader2,
} from "lucide-react";
import { addDays, startOfWeek, format, isSameDay, addWeeks, subWeeks } from "date-fns";

interface CalendarEvent {
    id: string;
    title: string;
    description?: string;
    location?: string;
    startTime: Date | string;
    endTime: Date | string;
    provider?: string;
}

export default function CalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewEvent, setShowNewEvent] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [creatingEvent, setCreatingEvent] = useState(false);

    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    useEffect(() => {
        fetchEvents();
    }, [currentDate]);

    async function fetchEvents() {
        setLoading(true);
        try {
            const start = weekStart.toISOString();
            const end = addDays(weekStart, 7).toISOString();
            const res = await fetch(`/api/calendar?start=${start}&end=${end}`);
            if (res.ok) {
                const data = await res.json();
                setEvents(
                    data.events.map((e: any) => ({
                        ...e,
                        startTime: new Date(e.startTime),
                        endTime: new Date(e.endTime),
                    }))
                );
            }
        } catch (error) {
            console.error("Failed to fetch events:", error);
        } finally {
            setLoading(false);
        }
    }

    async function handleCreateEvent(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setCreatingEvent(true);

        const formData = new FormData(e.currentTarget);
        const startDate = formData.get("date") as string;
        const startTime = formData.get("startTime") as string;
        const endTime = formData.get("endTime") as string;

        try {
            const res = await fetch("/api/calendar", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: formData.get("title"),
                    description: formData.get("description") || undefined,
                    location: formData.get("location") || undefined,
                    startTime: new Date(`${startDate}T${startTime}`).toISOString(),
                    endTime: new Date(`${startDate}T${endTime}`).toISOString(),
                    syncToGoogle: formData.get("syncToGoogle") === "on",
                }),
            });

            if (res.ok) {
                setShowNewEvent(false);
                fetchEvents();
            }
        } catch (error) {
            console.error("Failed to create event:", error);
        } finally {
            setCreatingEvent(false);
        }
    }

    function getEventsForDay(date: Date) {
        return events.filter((event) =>
            isSameDay(new Date(event.startTime), date)
        );
    }

    const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 7 PM

    return (
        <div className="flex flex-col min-h-screen">
            <Header title="Calendar" />

            <div className="flex-1 p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" onClick={() => setCurrentDate(subWeeks(currentDate, 1))}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <h2 className="text-xl font-semibold">
                            {format(weekStart, "MMMM d")} - {format(addDays(weekStart, 6), "MMMM d, yyyy")}
                        </h2>
                        <Button variant="outline" size="icon" onClick={() => setCurrentDate(addWeeks(currentDate, 1))}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" onClick={() => setCurrentDate(new Date())}>
                            Today
                        </Button>
                    </div>
                    <Button onClick={() => { setSelectedDate(new Date()); setShowNewEvent(true); }}>
                        <Plus className="h-4 w-4 mr-2" />
                        New Event
                    </Button>
                </div>

                <Card>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                            </div>
                        ) : (
                            <div className="grid grid-cols-8 divide-x divide-slate-200 dark:divide-slate-800">
                                {/* Time column */}
                                <div className="divide-y divide-slate-200 dark:divide-slate-800">
                                    <div className="h-16" /> {/* Header spacer */}
                                    {hours.map((hour) => (
                                        <div key={hour} className="h-16 p-2 text-xs text-slate-400">
                                            {format(new Date().setHours(hour, 0), "h a")}
                                        </div>
                                    ))}
                                </div>

                                {/* Day columns */}
                                {weekDays.map((day) => {
                                    const dayEvents = getEventsForDay(day);
                                    const isToday = isSameDay(day, new Date());

                                    return (
                                        <div key={day.toISOString()} className="divide-y divide-slate-200 dark:divide-slate-800">
                                            {/* Day header */}
                                            <div
                                                className={`h-16 p-2 text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors ${isToday ? "bg-blue-50 dark:bg-blue-950" : ""
                                                    }`}
                                                onClick={() => { setSelectedDate(day); setShowNewEvent(true); }}
                                            >
                                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                                    {format(day, "EEE")}
                                                </div>
                                                <div
                                                    className={`text-lg font-semibold ${isToday
                                                            ? "bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto"
                                                            : ""
                                                        }`}
                                                >
                                                    {format(day, "d")}
                                                </div>
                                            </div>

                                            {/* Hour slots */}
                                            {hours.map((hour) => (
                                                <div
                                                    key={hour}
                                                    className="h-16 p-1 relative hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer transition-colors"
                                                    onClick={() => {
                                                        const date = new Date(day);
                                                        date.setHours(hour);
                                                        setSelectedDate(date);
                                                        setShowNewEvent(true);
                                                    }}
                                                >
                                                    {dayEvents
                                                        .filter((e) => new Date(e.startTime).getHours() === hour)
                                                        .map((event) => (
                                                            <div
                                                                key={event.id}
                                                                className="absolute inset-x-1 bg-blue-500 text-white text-xs p-1 rounded truncate"
                                                                style={{ top: "2px" }}
                                                            >
                                                                {event.title}
                                                            </div>
                                                        ))}
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* New Event Dialog */}
            <Dialog open={showNewEvent} onOpenChange={setShowNewEvent}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Event</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateEvent}>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Title</Label>
                                <Input id="title" name="title" required placeholder="Meeting with client" />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="date">Date</Label>
                                    <Input
                                        id="date"
                                        name="date"
                                        type="date"
                                        required
                                        defaultValue={selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="startTime">Start</Label>
                                    <Input
                                        id="startTime"
                                        name="startTime"
                                        type="time"
                                        required
                                        defaultValue={selectedDate ? format(selectedDate, "HH:00") : "09:00"}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="endTime">End</Label>
                                    <Input
                                        id="endTime"
                                        name="endTime"
                                        type="time"
                                        required
                                        defaultValue={selectedDate ? format(new Date(selectedDate.getTime() + 60 * 60 * 1000), "HH:00") : "10:00"}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="location">Location</Label>
                                <Input id="location" name="location" placeholder="Meeting room or address" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea id="description" name="description" rows={3} placeholder="Add details..." />
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" id="syncToGoogle" name="syncToGoogle" className="h-4 w-4 rounded" />
                                <Label htmlFor="syncToGoogle">Sync to Google Calendar</Label>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowNewEvent(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={creatingEvent}>
                                {creatingEvent ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    "Create Event"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
