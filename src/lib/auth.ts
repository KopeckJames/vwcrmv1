import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import { authConfig } from "./auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
    adapter: PrismaAdapter(prisma),
    ...authConfig,
    callbacks: {
        ...authConfig.callbacks,
        async session({ session, token, user }) {
            // If using JWT strategy (which we are), token will be available
            if (token && session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
            }

            // For extra safety or if users are already in DB with 'user' role, 
            // ensure the admin email gets the admin role in the session
            if (session.user?.email?.toLowerCase() === "admin@velvetwatertx.com") {
                session.user.role = "admin";
            }

            // Still need to fetch tokens for calendar if needed
            const userId = token?.id as string || user?.id;
            if (userId && session.user) {
                const account = await prisma.account.findFirst({
                    where: {
                        userId: userId,
                        provider: "google",
                    },
                });
                if (account) {
                    (session as any).accessToken = account.access_token;
                    (session as any).refreshToken = account.refresh_token;
                }
            }
            return session;
        },
    },
    events: {
        async createUser({ user }) {
            if (user.email === "Admin@velvetwatertx.com") {
                await prisma.user.update({
                    where: { id: user.id },
                    data: { role: "admin" },
                });
            }
        },
    },
});

// Type augmentation for session
declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            name?: string | null;
            email?: string | null;
            image?: string | null;
            role?: string;
        };
        accessToken?: string;
        refreshToken?: string;
    }
}
