import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { SiteShell } from "@/components/site-shell";
import { AuthGate } from "@/components/auth-gate";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { CATEGORIES, CATEGORY_LABELS, DRIVETRAINS } from "@/lib/parts";
import {
  searchExternalSources,
  type ExternalFilters,
  type ExternalResult,
} from "@/lib/external-search.functions";

export const Route = createFileRoute("/search-web")({
  head: () => ({
    meta: [
      { title: "Search the web for car part models — Zenthi" },
      {
        name: "description",
        content:
          "Search other 3D model sites by make, model, year, engine and drivetrain. Zenthi shows titles, thumbnails and licences only, and links straight back to the original listing.",
      },
      { property: "og:title", content: "Search the web for car part models — Zenthi" },
      {
        property: "og:description",
        content:
          "Structured fitment search across external model sites — metadata and a link out, never the file itself.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SearchWebPage,
});

const labelCls = "tech-label block";
const fieldCls =
  "mt-2 w-full rounded-sm border border-input bg-card px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-ring focus:ring-2 focus:ring-ring/25";

const EMPTY: ExternalFilters = {
  make: "",
  model: "",
  yearFrom: "",
  yearTo: "",
  engineMake: "",
  engineSeries: "",
  displacement: "",
  generation: "",
  drivetrain: "",
  category: "",
  keyword: "",
};

function SearchWebPage() {
  const [filters, setFilters] = useState<ExternalFilters>(EMPTY);
  const set = (patch: Partial<ExternalFilters>) => setFilters((f) => ({ ...f, ...patch }));

  const search = useMutation({
    mutationFn: (data: ExternalFilters) => searchExternalSources({ data }),
    onError: () => toast.error("Search failed. Try again in a moment."),
  });

  const data = search.data;

  return (
    <SiteShell>
      <div className="mx-auto w-full max-w-5xl px-5 py-16">
        <p className="tech-label">Discovery</p>
        <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight">
          Search the web
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Look for an existing model on other sites using the same fitment filters as the library.
          Zenthi only shows the title, thumbnail, licence and a link to the original listing — the
          file itself is never downloaded, stored or rehosted here.
        </p>

        <form
          className="mt-10 space-y-5 rounded-sm border border-border bg-card p-6 sm:p-8"
          onSubmit={(e) => {
            e.preventDefault();
            search.mutate(filters);
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls} htmlFor="sw-make">
                Make
              </label>
              <input
                id="sw-make"
                value={filters.make}
                onChange={(e) => set({ make: e.target.value })}
                placeholder="e.g. Volkswagen"
                className={fieldCls}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="sw-model">
                Model
              </label>
              <input
                id="sw-model"
                value={filters.model}
                onChange={(e) => set({ model: e.target.value })}
                placeholder="e.g. Golf Mk2"
                className={fieldCls}
              />
            </div>
          </div>

          <div>
            <span className={labelCls}>Year range</span>
            <div className="grid grid-cols-2 gap-4">
              <input
                aria-label="Year from"
                value={filters.yearFrom}
                onChange={(e) => set({ yearFrom: e.target.value })}
                placeholder="Year from"
                className={fieldCls + " font-mono"}
              />
              <input
                aria-label="Year to"
                value={filters.yearTo}
                onChange={(e) => set({ yearTo: e.target.value })}
                placeholder="Year to"
                className={fieldCls + " font-mono"}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className={labelCls} htmlFor="sw-engine-make">
                Engine manufacturer
              </label>
              <input
                id="sw-engine-make"
                value={filters.engineMake}
                onChange={(e) => set({ engineMake: e.target.value })}
                className={fieldCls}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="sw-engine-series">
                Engine series
              </label>
              <input
                id="sw-engine-series"
                value={filters.engineSeries}
                onChange={(e) => set({ engineSeries: e.target.value })}
                className={fieldCls}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="sw-displacement">
                Displacement
              </label>
              <input
                id="sw-displacement"
                value={filters.displacement}
                onChange={(e) => set({ displacement: e.target.value })}
                placeholder="e.g. 5.3L"
                className={fieldCls}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className={labelCls} htmlFor="sw-generation">
                Generation
              </label>
              <input
                id="sw-generation"
                value={filters.generation}
                onChange={(e) => set({ generation: e.target.value })}
                className={fieldCls}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="sw-drivetrain">
                Drivetrain
              </label>
              <select
                id="sw-drivetrain"
                value={filters.drivetrain}
                onChange={(e) => set({ drivetrain: e.target.value })}
                className={fieldCls}
              >
                <option value="">Any</option>
                {DRIVETRAINS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls} htmlFor="sw-category">
                Category
              </label>
              <select
                id="sw-category"
                value={filters.category}
                onChange={(e) => set({ category: e.target.value })}
                className={fieldCls}
              >
                <option value="">Any</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls} htmlFor="sw-keyword">
              Extra words (optional)
            </label>
            <input
              id="sw-keyword"
              value={filters.keyword}
              onChange={(e) => set({ keyword: e.target.value })}
              placeholder="e.g. washer nozzle splitter"
              className={fieldCls}
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={search.isPending}
              className="inline-flex h-11 items-center rounded-sm bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
            >
              {search.isPending ? "Searching…" : "Search external sites"}
            </button>
            <button
              type="button"
              onClick={() => setFilters(EMPTY)}
              className="inline-flex h-11 items-center rounded-sm border border-border px-6 text-sm font-medium hover:bg-secondary"
            >
              Clear
            </button>
          </div>
        </form>

        {data?.notices.length ? (
          <ul className="mt-6 space-y-2">
            {data.notices.map((n) => (
              <li
                key={n}
                className="rounded-sm border border-border bg-secondary/50 p-3 text-xs leading-relaxed text-muted-foreground"
              >
                {n}
              </li>
            ))}
          </ul>
        ) : null}

        {data && !data.configured && (
          <div className="mt-8 rounded-sm border border-brass/30 bg-brass/5 p-6">
            <p className="tech-label text-brass">Not ready yet</p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Search is not yet configured — check back soon.
            </p>
          </div>
        )}

        {data?.configured && (
          <section className="mt-10">
            <h2 className="font-display text-2xl font-semibold tracking-tight">
              {data.results.length} result{data.results.length === 1 ? "" : "s"}
            </h2>
            {data.results.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Nothing matched those filters. Try loosening the model or generation.
              </p>
            ) : (
              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {data.results.map((r) => (
                  <ResultCard key={r.id} result={r} />
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </SiteShell>
  );
}

function ResultCard({ result }: { result: ExternalResult }) {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [asking, setAsking] = useState(false);

  async function suggest(): Promise<void> {
    if (!user) return;
    setBusy(true);
    try {
      const { error } = await supabase.from("external_leads").insert({
        source_url: result.sourceUrl,
        title: result.title,
        thumbnail_url: result.thumbnail,
        source_site: result.source,
        suggested_by: user.id,
      });
      if (error) throw error;
      setSaved(true);
      toast.success("Sent to the admin queue as a re-upload lead.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save that suggestion.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="flex flex-col overflow-hidden rounded-sm border border-border bg-card">
      {result.thumbnail ? (
        <img
          src={result.thumbnail}
          alt={`Thumbnail of ${result.title} on ${result.source}`}
          loading="lazy"
          className="h-40 w-full object-cover"
        />
      ) : (
        <div className="flex h-40 w-full items-center justify-center bg-secondary/60 text-xs text-muted-foreground">
          No thumbnail
        </div>
      )}
      <div className="flex flex-1 flex-col p-4">
        <p className="tech-label">{result.source}</p>
        <h3 className="mt-2 font-display text-base font-semibold leading-snug">{result.title}</h3>
        <p className="mt-2 text-xs text-muted-foreground">
          {result.author ? `By ${result.author}` : "Author not listed"}
          {result.license ? ` · ${result.license}` : ""}
        </p>
        <div className="mt-4 flex flex-wrap gap-2 pt-2">
          <a
            href={result.sourceUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="inline-flex h-9 items-center rounded-sm bg-primary px-4 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            View original listing
          </a>
          {saved ? (
            <span className="inline-flex h-9 items-center rounded-sm border border-border px-4 text-xs text-muted-foreground">
              Suggested
            </span>
          ) : user ? (
            <button
              type="button"
              onClick={suggest}
              disabled={busy}
              className="inline-flex h-9 items-center rounded-sm border border-border px-4 text-xs font-medium hover:bg-secondary disabled:opacity-40"
            >
              {busy ? "Saving…" : "Suggest for Zenthi library"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setAsking((v) => !v)}
              className="inline-flex h-9 items-center rounded-sm border border-border px-4 text-xs font-medium hover:bg-secondary"
            >
              Suggest for Zenthi library
            </button>
          )}
        </div>
        {asking && !user && (
          <div className="mt-4">
            <AuthGate
              title="Sign in to suggest this listing"
              description="Suggestions go to the admin queue so a person can re-upload the file properly with attribution and licence checks."
            >
              <span />
            </AuthGate>
          </div>
        )}
      </div>
    </article>
  );
}
