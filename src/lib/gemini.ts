import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function generateEmailDraft(params: {
    recipientName: string;
    recipientCompany?: string;
    context: string;
    tone: "formal" | "friendly" | "persuasive";
    senderName: string;
}): Promise<string> {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Generate a professional email draft with the following parameters:
  
Recipient: ${params.recipientName}${params.recipientCompany ? ` from ${params.recipientCompany}` : ""}
Context/Purpose: ${params.context}
Tone: ${params.tone}
Sender: ${params.senderName}

Write a complete email including subject line, greeting, body, and signature. Format it clearly with "Subject:" on the first line.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
}

export async function scoreLead(leadData: {
    firstName: string;
    lastName: string;
    company?: string;
    jobTitle?: string;
    source?: string;
    estimatedValue?: number;
    interactions?: number;
    daysSinceCreated?: number;
}): Promise<{ score: number; reasoning: string; nextSteps: string[] }> {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Analyze this sales lead and provide a quality score from 1-100, along with reasoning and suggested next steps.

Lead Data:
- Name: ${leadData.firstName} ${leadData.lastName}
- Company: ${leadData.company || "Not provided"}
- Job Title: ${leadData.jobTitle || "Not provided"}
- Lead Source: ${leadData.source || "Unknown"}
- Estimated Value: ${leadData.estimatedValue ? `$${leadData.estimatedValue}` : "Not provided"}
- Number of Interactions: ${leadData.interactions || 0}
- Days Since Created: ${leadData.daysSinceCreated || 0}

Respond in JSON format:
{
  "score": <number 1-100>,
  "reasoning": "<brief explanation of the score>",
  "nextSteps": ["<action 1>", "<action 2>", "<action 3>"]
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
    }

    return { score: 50, reasoning: "Unable to analyze", nextSteps: ["Follow up with lead"] };
}

export async function summarizeMeetingNotes(notes: string): Promise<{
    summary: string;
    actionItems: string[];
    keyDecisions: string[];
    followUpDate?: string;
}> {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Analyze these meeting notes and provide a structured summary.

Meeting Notes:
${notes}

Respond in JSON format:
{
  "summary": "<2-3 sentence summary of the meeting>",
  "actionItems": ["<action 1>", "<action 2>", ...],
  "keyDecisions": ["<decision 1>", "<decision 2>", ...],
  "followUpDate": "<suggested follow-up date if mentioned, or null>"
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
    }

    return { summary: notes.substring(0, 200), actionItems: [], keyDecisions: [] };
}

export async function answerCRMQuery(
    question: string,
    context: {
        leadsCount?: number;
        contactsCount?: number;
        opportunitiesCount?: number;
        pipelineValue?: number;
        recentActivities?: string[];
    }
): Promise<string> {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are a helpful CRM assistant. Answer the user's question based on the provided context.

CRM Context:
- Total Leads: ${context.leadsCount || "Unknown"}
- Total Contacts: ${context.contactsCount || "Unknown"}
- Active Opportunities: ${context.opportunitiesCount || "Unknown"}
- Pipeline Value: ${context.pipelineValue ? `$${context.pipelineValue.toLocaleString()}` : "Unknown"}
${context.recentActivities?.length ? `- Recent Activities: ${context.recentActivities.join(", ")}` : ""}

User Question: ${question}

Provide a helpful, concise answer. If you don't have enough information, suggest what data would be needed.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
}

export async function suggestFollowUpMessage(params: {
    leadName: string;
    lastInteraction: string;
    daysSinceContact: number;
    previousOutcome: string;
}): Promise<string> {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Suggest a follow-up message for a sales lead.

Lead: ${params.leadName}
Last Interaction: ${params.lastInteraction}
Days Since Last Contact: ${params.daysSinceContact}
Previous Outcome: ${params.previousOutcome}

Write a short, compelling follow-up message (2-3 sentences) that would be appropriate for SMS or a brief email.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
}
