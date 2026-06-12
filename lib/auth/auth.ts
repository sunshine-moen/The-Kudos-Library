import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Resend({
      from: process.env.RESEND_FROM_EMAIL ?? "kudos@example.com",
    }),
  ],
  pages: {
    signIn: "/login",
    verifyRequest: "/login?check-email=1",
  },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      const member = await prisma.user.findFirst({
        where: { email: user.email },
        select: { status: true },
      });
      if (member?.status === "pending_deletion") return "/login?error=account-pending-deletion";
      return true;
    },
    session({ session, user }) {
      if (session.user && user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
});
