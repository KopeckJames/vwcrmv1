import { Header } from "@/components/dashboard/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Key, Calendar, Map, Sparkles, ExternalLink } from "lucide-react";

export default async function SettingsPage() {
    const session = await auth();

    return (
        <div className="flex flex-col min-h-screen">
            <Header title="Settings" />

            <div className="flex-1 p-6 max-w-4xl mx-auto w-full">
                <div className="space-y-6">
                    {/* Profile */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Profile</CardTitle>
                            <CardDescription>Your account information</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4">
                                <Avatar src={session?.user?.image ?? undefined} fallback={session?.user?.name ?? undefined} size="lg" />
                                <div>
                                    <h3 className="font-semibold text-lg">{session?.user?.name}</h3>
                                    <p className="text-slate-500">{session?.user?.email}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Integrations */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Integrations</CardTitle>
                            <CardDescription>Connected services and API keys</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <IntegrationItem
                                icon={Calendar}
                                title="Google Calendar"
                                description="Sync your calendar events"
                                connected={!!(session as { accessToken?: string })?.accessToken}
                            />
                            <IntegrationItem
                                icon={Calendar}
                                title="Outlook Calendar"
                                description="Connect Microsoft 365 calendar"
                                connected={false}
                            />
                            <IntegrationItem
                                icon={Map}
                                title="Mapbox"
                                description="Location and mapping services"
                                connected={!!process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
                            />
                            <IntegrationItem
                                icon={Sparkles}
                                title="Gemini AI"
                                description="AI-powered email drafts and insights"
                                connected={!!process.env.GEMINI_API_KEY}
                            />
                        </CardContent>
                    </Card>

                    {/* API Keys Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Key className="h-5 w-5" />
                                API Configuration
                            </CardTitle>
                            <CardDescription>
                                Configure your API keys in the environment variables
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
                                <code className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                                    {`# Required Environment Variables
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GEMINI_API_KEY=your-gemini-api-key
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your-mapbox-token
DATABASE_URL=your-database-url`}
                                </code>
                            </div>
                            <p className="text-sm text-slate-500 mt-4">
                                See the <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">env.example</code> file for all available options.
                            </p>
                        </CardContent>
                    </Card>

                    {/* Resources */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Resources</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <ResourceLink href="https://console.cloud.google.com" label="Google Cloud Console" />
                            <ResourceLink href="https://portal.azure.com" label="Azure Portal" />
                            <ResourceLink href="https://aistudio.google.com/apikey" label="Gemini API Keys" />
                            <ResourceLink href="https://account.mapbox.com" label="Mapbox Account" />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function IntegrationItem({
    icon: Icon,
    title,
    description,
    connected,
}: {
    icon: React.ElementType;
    title: string;
    description: string;
    connected: boolean;
}) {
    return (
        <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-800 rounded-lg">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    <Icon className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                </div>
                <div>
                    <h4 className="font-medium">{title}</h4>
                    <p className="text-sm text-slate-500">{description}</p>
                </div>
            </div>
            <Badge variant={connected ? "success" : "default"}>
                {connected ? "Connected" : "Not Connected"}
            </Badge>
        </div>
    );
}

function ResourceLink({ href, label }: { href: string; label: string }) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-blue-600 hover:underline"
        >
            <ExternalLink className="h-4 w-4" />
            {label}
        </a>
    );
}
