"use client";

import { useState } from "react";
import { Header } from "@/components/dashboard/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Sparkles,
    Mail,
    MessageSquare,
    FileText,
    Target,
    Send,
    Loader2,
    Copy,
    Check,
} from "lucide-react";

type AIAction = "ask-question" | "generate-email" | "summarize-meeting";

export default function AIAssistantPage() {
    const [action, setAction] = useState<AIAction>("ask-question");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    // Form states
    const [question, setQuestion] = useState("");
    const [emailRecipient, setEmailRecipient] = useState("");
    const [emailCompany, setEmailCompany] = useState("");
    const [emailContext, setEmailContext] = useState("");
    const [emailTone, setEmailTone] = useState<"formal" | "friendly" | "persuasive">("friendly");
    const [meetingNotes, setMeetingNotes] = useState("");

    async function handleSubmit() {
        setLoading(true);
        setResult(null);

        try {
            let payload: any = { action };

            switch (action) {
                case "ask-question":
                    payload.params = { question };
                    break;
                case "generate-email":
                    payload.params = {
                        recipientName: emailRecipient,
                        recipientCompany: emailCompany || undefined,
                        context: emailContext,
                        tone: emailTone,
                    };
                    break;
                case "summarize-meeting":
                    payload.params = { notes: meetingNotes };
                    break;
            }

            const res = await fetch("/api/ai", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error("AI request failed");

            const data = await res.json();
            setResult(typeof data.result === "string" ? data.result : JSON.stringify(data.result, null, 2));
        } catch (error) {
            setResult("Sorry, something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    function copyToClipboard() {
        if (result) {
            navigator.clipboard.writeText(result);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }

    return (
        <div className="flex flex-col min-h-screen">
            <Header title="AI Assistant" />

            <div className="flex-1 p-6 max-w-4xl mx-auto w-full">
                <div className="mb-6">
                    <p className="text-slate-500 dark:text-slate-400">
                        Use AI to help with emails, meeting summaries, and CRM insights.
                    </p>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Input Panel */}
                    <div className="space-y-4">
                        {/* Action Selector */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Sparkles className="h-5 w-5 text-indigo-500" />
                                    What would you like to do?
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-3 gap-2">
                                    <ActionButton
                                        icon={MessageSquare}
                                        label="Ask Question"
                                        active={action === "ask-question"}
                                        onClick={() => setAction("ask-question")}
                                    />
                                    <ActionButton
                                        icon={Mail}
                                        label="Draft Email"
                                        active={action === "generate-email"}
                                        onClick={() => setAction("generate-email")}
                                    />
                                    <ActionButton
                                        icon={FileText}
                                        label="Summarize"
                                        active={action === "summarize-meeting"}
                                        onClick={() => setAction("summarize-meeting")}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Input Form */}
                        <Card>
                            <CardContent className="pt-6 space-y-4">
                                {action === "ask-question" && (
                                    <div className="space-y-2">
                                        <Label htmlFor="question">Ask anything about your CRM</Label>
                                        <Textarea
                                            id="question"
                                            placeholder="e.g., What's my pipeline value? How many leads did I get this week?"
                                            value={question}
                                            onChange={(e) => setQuestion(e.target.value)}
                                            rows={4}
                                        />
                                    </div>
                                )}

                                {action === "generate-email" && (
                                    <>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="recipient">Recipient Name</Label>
                                                <Input
                                                    id="recipient"
                                                    placeholder="John Smith"
                                                    value={emailRecipient}
                                                    onChange={(e) => setEmailRecipient(e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="company">Company (optional)</Label>
                                                <Input
                                                    id="company"
                                                    placeholder="Acme Corp"
                                                    value={emailCompany}
                                                    onChange={(e) => setEmailCompany(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="context">What's the email about?</Label>
                                            <Textarea
                                                id="context"
                                                placeholder="e.g., Following up on our demo call last week, they seemed interested in the premium plan"
                                                value={emailContext}
                                                onChange={(e) => setEmailContext(e.target.value)}
                                                rows={3}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="tone">Tone</Label>
                                            <Select value={emailTone} onValueChange={(v: any) => setEmailTone(v)}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="friendly">Friendly</SelectItem>
                                                    <SelectItem value="formal">Formal</SelectItem>
                                                    <SelectItem value="persuasive">Persuasive</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </>
                                )}

                                {action === "summarize-meeting" && (
                                    <div className="space-y-2">
                                        <Label htmlFor="notes">Meeting Notes</Label>
                                        <Textarea
                                            id="notes"
                                            placeholder="Paste your meeting notes here..."
                                            value={meetingNotes}
                                            onChange={(e) => setMeetingNotes(e.target.value)}
                                            rows={8}
                                        />
                                    </div>
                                )}

                                <Button onClick={handleSubmit} disabled={loading} className="w-full">
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="h-4 w-4 mr-2" />
                                            Submit
                                        </>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Result Panel */}
                    <Card className="h-fit">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Result</CardTitle>
                            {result && (
                                <Button variant="ghost" size="sm" onClick={copyToClipboard}>
                                    {copied ? (
                                        <>
                                            <Check className="h-4 w-4 mr-1" />
                                            Copied
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="h-4 w-4 mr-1" />
                                            Copy
                                        </>
                                    )}
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent>
                            {result ? (
                                <div className="prose prose-slate dark:prose-invert max-w-none">
                                    <pre className="whitespace-pre-wrap text-sm bg-slate-50 dark:bg-slate-900 p-4 rounded-lg overflow-auto max-h-[500px]">
                                        {result}
                                    </pre>
                                </div>
                            ) : (
                                <div className="text-center py-12 text-slate-400">
                                    <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>Your AI-generated content will appear here</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function ActionButton({
    icon: Icon,
    label,
    active,
    onClick,
}: {
    icon: React.ElementType;
    label: string;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${active
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
        >
            <Icon className="h-6 w-6" />
            <span className="text-sm font-medium">{label}</span>
        </button>
    );
}
