import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SiteShell } from "@/components/site-shell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in or create an account — Zenthi" },
      {
        name: "description",
        content:
          "Sign in to Zenthi or create an account. Accounts are only needed for admin review access — browsing and uploading stay open to everyone.",
      },
      { property: "og:title", content: "Sign in or create an account — Zenthi" },
      {
        property: "og:description",
        content: "Accounts are only needed for admin access on Zenthi.",
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

function AuthPage() {
  const router = useRouter();
  const { session, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  useEffect(() => {
    if (!loading && session) void router.navigate({ to: "/account" });
  }, [loading, session, router]);

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

  return (
    <SiteShell>
      <div className="mx-auto w-full max-w-md px-5 py-20">
        <p className="tech-label text-brass">Accounts</p>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight">
          {mode === "signin" ? "Sign in" : "Create an account"}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          You don't need an account to browse the library or upload files — those stay open to
          everyone. Accounts exist so the community can run reviews.
        </p>

        {checkEmail ? (
          <div className="mt-8 rounded-sm border border-border bg-card p-6 text-sm leading-relaxed">
            Check your email to confirm your address, then come back and sign in.
          </div>
        ) : (
          <form className="mt-8 space-y-4" onSubmit={onSubmit}>
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
