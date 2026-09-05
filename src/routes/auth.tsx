import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SiteShell } from "@/components/site-shell";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search['redirect'] === "string" ? (search['redirect'] as string) : undefined,
    mode: search['mode'] === "signup" ? ("signup" as const) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in or create an account — Zenthi" },
      {
        name: "description",
        content:
          "Sign in to Zenthi with email or Google. An account is needed to upload parts, post requests and review submissions — browsing stays open to everyone.",
      },
      { property: "og:title", content: "Sign in or create an account — Zenthi" },
      {
        property: "og:description",
        content: "Sign in with email or Google to upload parts and post requests on Zenthi.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

const labelCls = "tech-label block";
const fieldCls =
  "mt-2 w-full rounded-sm border border-input bg-card px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-ring focus:ring-2 focus:ring-ring/25";

/** Only same-origin relative paths are accepted as a post sign-in destination. */
function safePath(value: string | undefined): string | null {
  if (!value) return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}

const RETURN_KEY = "zenthi:auth-return";

function AuthPage() {
  const router = useRouter();
  const search = Route.useSearch();
  const { session, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">(
    search.mode === "signup" ? "signup" : "signin",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  const returnTo = safePath(search.redirect);

  useEffect(() => {
    if (loading || !session) return;
    let target = returnTo;
    if (!target && typeof window !== "undefined") {
      target = safePath(window.sessionStorage.getItem(RETURN_KEY) ?? undefined);
    }
    if (typeof window !== "undefined") window.sessionStorage.removeItem(RETURN_KEY);
    void router.navigate({ to: target ?? "/account" });
  }, [loading, session, router, returnTo]);

  async function onSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (!data.session) {
          setCheckEmail(true);
          return;
        }
        toast.success("Account created.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Signed in.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function onGoogle(): Promise<void> {
    setBusy(true);
    try {
      // The redirect target must be a public URL, so the intended destination
      // is stashed locally and applied once the session lands.
      if (returnTo) window.sessionStorage.setItem(RETURN_KEY, returnTo);
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error(result.error.message || "Google sign-in failed.");
        return;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google sign-in failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <SiteShell>
      <div className="mx-auto w-full max-w-md px-5 py-20">
        <p className="tech-label text-brass">Accounts</p>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight">
          {mode === "signin" ? "Sign in" : "Create an account"}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Browsing and searching the library is open to everyone. You need an account to upload a
          part, post or fulfil a request, and for anything in the review queue.
        </p>

        <button
          type="button"
          onClick={onGoogle}
          disabled={busy}
          className="mt-8 inline-flex h-11 w-full items-center justify-center gap-3 rounded-sm border border-border bg-card px-6 text-sm font-medium hover:bg-secondary disabled:opacity-40"
        >
          <svg aria-hidden="true" viewBox="0 0 18 18" className="h-4 w-4">
            <path
              fill="#4285F4"
              d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
            />
            <path
              fill="#34A853"
              d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z"
            />
            <path
              fill="#FBBC05"
              d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33Z"
            />
            <path
              fill="#EA4335"
              d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
            />
          </svg>
          Continue with Google
        </button>

        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          <span className="font-mono uppercase tracking-widest">or use email</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        {checkEmail ? (
          <div className="rounded-sm border border-border bg-card p-6 text-sm leading-relaxed">
            Check your email to confirm your address, then come back and sign in.
          </div>
        ) : (
          <form className="space-y-4" onSubmit={onSubmit}>
            <div>
              <label className={labelCls} htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={fieldCls}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={fieldCls}
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex h-11 items-center rounded-sm bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
            >
              {busy ? "Working…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>
        )}

        <button
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setCheckEmail(false);
          }}
          className="mt-6 font-mono text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          {mode === "signin"
            ? "No account yet? Create one"
            : "Already have an account? Sign in"}
        </button>

        <p className="mt-8 text-xs leading-relaxed text-muted-foreground">
          Thinking about helping review submissions? Read the{" "}
          <Link to="/community-guidelines" className="underline underline-offset-2">
            community guidelines
          </Link>{" "}
          first.
        </p>
      </div>
    </SiteShell>
  );
}
