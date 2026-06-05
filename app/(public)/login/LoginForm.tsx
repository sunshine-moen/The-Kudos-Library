"use client";

import { useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-sm px-4 py-2 disabled:opacity-60"
      style={{
        background: "var(--btn-primary-bg)",
        color: "var(--btn-primary-text)",
        font: "var(--text-app-ui)",
        fontWeight: 600,
      }}
    >
      {pending ? "Sending…" : "Send login link"}
    </button>
  );
}

interface LoginFormProps {
  checkEmail: boolean;
  error?: string;
  handleLogin: (formData: FormData) => Promise<void>;
}

export default function LoginForm({ checkEmail, error, handleLogin }: LoginFormProps) {
  if (checkEmail) {
    return (
      <main
        id="main-content"
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--lib-cream)" }}
      >
        <div className="w-full max-w-sm px-6 text-center">
          <h1
            className="mb-4"
            style={{ font: "var(--text-app-title)", color: "var(--inst-navy)" }}
          >
            Check your email
          </h1>
          <p style={{ font: "var(--text-app-body-sm)", color: "var(--lib-ink)" }}>
            If that email is in our system, we sent you a login link. It expires in 10 minutes.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main
      id="main-content"
      className="min-h-screen flex items-center justify-center"
      style={{ background: "var(--lib-cream)" }}
    >
      <div className="w-full max-w-sm px-6">
        <h1
          className="mb-2 text-center"
          style={{ font: "var(--text-app-title)", color: "var(--inst-navy)" }}
        >
          The Kudos Library
        </h1>
        <p
          className="mb-8 text-center"
          style={{ font: "var(--text-app-body-sm)", color: "var(--lib-ink)" }}
        >
          Enter your email to receive a login link.
        </p>

        {error && (
          <p
            className="mb-4 rounded px-3 py-2 text-sm"
            style={{ background: "var(--state-error-bg)", color: "var(--state-error-text)" }}
            role="alert"
          >
            {error === "OAuthSignin" || error === "EmailSignin"
              ? "Sign-in link is invalid or expired."
              : "Something went wrong. Please try again."}
          </p>
        )}

        <form action={handleLogin} className="space-y-4">
          <label
            htmlFor="email"
            className="block"
            style={{ font: "var(--text-app-ui)", color: "var(--lib-ink)" }}
          >
            Email address
            <input
              id="email"
              type="email"
              name="email"
              autoComplete="email"
              required
              className="mt-1 block w-full rounded border px-3 py-2"
              style={{
                borderColor: "var(--wood-walnut-deep)",
                background: "var(--lib-cream)",
                font: "var(--text-app-ui)",
                color: "var(--lib-ink)",
              }}
            />
          </label>
          <SubmitButton />
        </form>
      </div>
    </main>
  );
}
