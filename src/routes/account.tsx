import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SiteShell } from "@/components/site-shell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { getMyAccess, submitAdminRequest } from "@/lib/admin-access.functions";

export const Route = createFileRoute("/account")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Your account — Zenthi" },
      {
        name: "description",
        content:
          "Manage your Zenthi account, check your admin role status, and request admin access to help review community submissions.",
      },
      { property: "og:title", content: "Your account — Zenthi" },
      { property: "og:description", content: "Account status and admin access requests." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AccountPage,
});

const fieldCls =
  "mt-2 w-full rounded-sm border border-input bg-card px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-ring focus:ring-2 focus:ring-ring/25";

function AccountPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { session, email, loading } = useAuth();
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!loading && !session) void router.navigate({ to: "/auth" });
  }, [loading, session, router]);

  const access = useQuery({
    queryKey: ["access", "me"],
    queryFn: () => getMyAccess(),
    enabled: !!session,
  });

  const request = useMutation({
    mutationFn: () => submitAdminRequest({ data: { reason } }),
    onSuccess: () => {
      setReason("");
      toast.success("Request submitted for review.");
      qc.invalidateQueries({ queryKey: ["access", "me"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not submit."),
  });

  async function signOut(): Promise<void> {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    void router.navigate({ to: "/auth", replace: true });
  }

  if (loading || !session) {
    return (
      <SiteShell>
        <div className="mx-auto max-w-2xl px-5 py-24 font-mono text-sm text-muted-foreground">
          Loading…
        </div>
      </SiteShell>
    );
  }

  const pending = access.data?.request?.status === "pending";
  const denied = access.data?.request?.status === "denied";
  const isAdmin = !!access.data?.isAdmin;

  return (
    <SiteShell>
      <div className="mx-auto w-full max-w-2xl px-5 py-16">
        <p className="tech-label text-brass">Account</p>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight">{email}</h1>
        <p className="mt-3 font-mono text-xs text-muted-foreground">
          {isAdmin ? "Role: admin" : "Role: community member"}
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          {isAdmin && (
            <Link
              to="/admin"
              className="inline-flex h-10 items-center rounded-sm bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Open review queue
            </Link>
          )}
          <button
            onClick={signOut}
            className="h-10 rounded-sm border border-border px-5 text-sm font-medium hover:bg-secondary"
          >
            Sign out
          </button>
        </div>

        {!isAdmin && (
          <section className="mt-12 border-t border-border pt-10">
            <h2 className="font-display text-2xl font-semibold tracking-tight">
              Request admin access
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Admins review submitted parts and copyright reports. Read the{" "}
              <Link to="/community-guidelines" className="underline underline-offset-2">
                community guidelines
              </Link>{" "}
              before requesting — they cover what admins check and how admins are expected to
              behave.
            </p>

            {pending ? (
              <p className="mt-6 rounded-sm border border-brass/40 bg-brass/10 p-4 text-sm">
                Your request is pending review.
              </p>
            ) : (
              <form
                className="mt-6 space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (reason.trim().length < 20) {
                    toast.error("Please give a little more detail (at least 20 characters).");
                    return;
                  }
                  request.mutate();
                }}
              >
                {denied && (
                  <p className="rounded-sm border border-border bg-secondary/60 p-4 text-sm text-muted-foreground">
                    A previous request was declined. You're welcome to submit another.
                  </p>
                )}
                <div>
                  <label className="tech-label block" htmlFor="reason">
                    Why do you want admin access?
                  </label>
                  <textarea
                    id="reason"
                    rows={5}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Your background with car parts, CAD, or moderating communities."
                    className={fieldCls}
                  />
                </div>
                <button
                  type="submit"
                  disabled={request.isPending}
                  className="inline-flex h-11 items-center rounded-sm bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
                >
                  {request.isPending ? "Sending…" : "Submit request"}
                </button>
              </form>
            )}
          </section>
        )}
      </div>
    </SiteShell>
  );
}
