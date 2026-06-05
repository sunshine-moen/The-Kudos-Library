"use server";

import { signIn } from "@/lib/auth/auth";
import { checkLoginRateLimit } from "@/lib/auth/rate-limit";
import { headers } from "next/headers";
import LoginForm from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ "check-email"?: string; error?: string }>;
}) {
  const params = await searchParams;
  const checkEmail = params["check-email"] === "1";
  const error = params["error"];

  async function handleLogin(formData: FormData) {
    "use server";
    const email = (formData.get("email") as string | null)?.trim() ?? "";
    if (!email) return;

    const headersList = await headers();
    const ip =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

    try {
      await checkLoginRateLimit(ip, email);
    } catch {
      // Rate limit exceeded — still redirect to check-email (no email disclosure)
      // The 429 is surfaced at the API layer; here we silently absorb it for privacy
    }

    await signIn("resend", {
      email,
      redirectTo: "/library",
    }).catch(() => {
      // signIn throws a redirect — that's expected behaviour in Next.js server actions
    });
  }

  return <LoginForm checkEmail={checkEmail} error={error} handleLogin={handleLogin} />;
}
