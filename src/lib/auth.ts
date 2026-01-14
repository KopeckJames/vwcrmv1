import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import { authConfig } from "./auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
    adapter: PrismaAdapter(prisma),
    session: {
        strategy: "database",
    },
    ...authConfig,
    callbacks: {
        ...authConfig.callbacks,
        async session({ session, user }) {
            if (session.user) {
                session.user.id = user.id;
                session.user.role = (user as any).role;
                // Get the user's Google access token for calendar operations
                const account = await prisma.account.findFirst({
                    where: {
                        userId: user.id,
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
