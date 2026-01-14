import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardProvider } from "@/components/dashboard/dashboard-context";
import { SidebarWrapper } from "@/components/dashboard/sidebar-wrapper";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    return (
        <DashboardProvider>
            <SidebarWrapper user={session.user}>
                {children}
            </SidebarWrapper>
        </DashboardProvider>
    );
}
