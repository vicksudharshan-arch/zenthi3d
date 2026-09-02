import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { SiteShell } from "@/components/site-shell";
import { CATEGORY_LABELS, vehicleLabel, type Category } from "@/lib/parts";
import { listAllParts, setPartStatus } from "@/lib/parts.functions";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Review queue — Scarpa" },
      {
        name: "description",
        content: "Internal review queue for approving or rejecting submitted Scarpa part files.",
      },
      { property: "og:title", content: "Review queue — Scarpa" },
      { property: "og:description", content: "Approve or reject submitted part files." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

const TABS = ["pending", "approved", "rejected"] as const;

function AdminPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("pending");
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["parts", "all"],
    queryFn: () => listAllParts(),
  });

  const mutation = useMutation({
    mutationFn: (vars: { id: string; status: "approved" | "rejected" | "pending" }) =>
      setPartStatus({ data: vars }),
    onSuccess: (_d, vars) => {
      toast.success(`Marked ${vars.status}.`);
      qc.invalidateQueries({ queryKey: ["parts"] });
    },
    onError: () => toast.error("Update failed."),
  });

  const parts = (data ?? []).filter((p) => p.status === tab);

  return (
    <SiteShell>
      <div className="mx-auto w-full max-w-5xl px-5 py-16">
        <p className="tech-label">Internal</p>
        <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight">Review queue</h1>

        <div className="mt-8 flex gap-1 border-b border-border">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`-mb-px border-b-2 px-4 py-2 font-mono text-xs tracking-widest uppercase transition-colors ${
                tab === t
                  ? "border-brass text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t} ({(data ?? []).filter((p) => p.status === t).length})
            </button>
          ))}
        </div>

        {isLoading ? (
          <p className="mt-12 font-mono text-sm text-muted-foreground">Loading…</p>
        ) : parts.length === 0 ? (
          <p className="mt-12 font-mono text-sm text-muted-foreground">
            No {tab} submissions.
          </p>
        ) : (
          <div className="mt-8 space-y-4">
            {parts.map((p) => (
              <article key={p.id} className="rounded-sm border border-border bg-card p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-xl font-semibold">{p.name}</h2>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">
                      {CATEGORY_LABELS[p.category as Category] ?? p.category} · {p.file_name} ·{" "}
                      {new Date(p.created_at).toLocaleDateString()}
                      {p.uploader_name ? ` · ${p.uploader_name}` : ""}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {p.status !== "approved" && (
                      <button
                        onClick={() => mutation.mutate({ id: p.id, status: "approved" })}
                        className="h-9 rounded-sm bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                      >
                        Approve
                      </button>
                    )}
                    {p.status !== "rejected" && (
                      <button
                        onClick={() => mutation.mutate({ id: p.id, status: "rejected" })}
                        className="h-9 rounded-sm border border-destructive/40 px-4 text-sm font-medium text-destructive hover:bg-destructive/10"
                      >
                        Reject
                      </button>
                    )}
                    {p.status !== "pending" && (
                      <button
                        onClick={() => mutation.mutate({ id: p.id, status: "pending" })}
                        className="h-9 rounded-sm border border-border px-4 text-sm font-medium hover:bg-secondary"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  {p.description}
                </p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {p.vehicles.map((v, i) => (
                    <li
                      key={i}
                      className="rounded-sm border border-border px-2 py-1 font-mono text-xs"
                    >
                      {vehicleLabel(v)}
                    </li>
                  ))}
                </ul>
                {p.notes && (
                  <p className="mt-4 rounded-sm bg-secondary/60 p-4 text-sm leading-relaxed whitespace-pre-wrap">
                    {p.notes}
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </SiteShell>
  );
}
