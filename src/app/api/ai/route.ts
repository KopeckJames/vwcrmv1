import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { answerCRMQuery, generateEmailDraft, scoreLead, summarizeMeetingNotes, suggestFollowUpMessage } from "@/lib/gemini";
import prisma from "@/lib/prisma";

// POST /api/ai - Handle AI requests
export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { action, params } = await request.json();

        switch (action) {
            case "generate-email": {
                const email = await generateEmailDraft({
                    ...params,
                    senderName: session.user.name || "Sales Team",
                });
                return NextResponse.json({ result: email });
            }

            case "score-lead": {
                const score = await scoreLead(params);
                return NextResponse.json({ result: score });
            }

            case "summarize-meeting": {
                const summary = await summarizeMeetingNotes(params.notes);
                return NextResponse.json({ result: summary });
            }

            case "ask-question": {
                // Get CRM context
                const [leadsCount, contactsCount, opportunitiesCount, pipelineValue] = await Promise.all([
                    prisma.lead.count(),
                    prisma.contact.count(),
                    prisma.opportunity.count({ where: { stage: { notIn: ["CLOSED_WON", "CLOSED_LOST"] } } }),
                    prisma.opportunity.aggregate({
                        _sum: { amount: true },
                        where: { stage: { notIn: ["CLOSED_WON", "CLOSED_LOST"] } },
                    }),
                ]);

                const answer = await answerCRMQuery(params.question, {
                    leadsCount,
                    contactsCount,
                    opportunitiesCount,
                    pipelineValue: pipelineValue._sum.amount || 0,
                });
                return NextResponse.json({ result: answer });
            }

            case "suggest-followup": {
                const message = await suggestFollowUpMessage(params);
                return NextResponse.json({ result: message });
            }

            default:
                return NextResponse.json({ error: "Unknown action" }, { status: 400 });
        }
    } catch (error) {
        console.error("AI request failed:", error);
        return NextResponse.json({ error: "AI request failed" }, { status: 500 });
    }
}
