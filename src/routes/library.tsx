import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { SiteShell } from "@/components/site-shell";
import { supabase } from "@/integrations/supabase/client";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  CONTRIBUTOR_TYPE_LABELS,
  type Category,
  vehicleLabel,
  type Vehicle,
} from "@/lib/parts";
import { getDownloadUrl } from "@/lib/parts.functions";

export const Route = createFileRoute("/library")({
  head: () => ({
    meta: [
      { title: "Part library — Zenthi" },
      {
        name: "description",
        content:
          "Browse community-shared STL and STEP files for brackets, housings, covers and trim, filtered by make, model and category.",
      },
      { property: "og:title", content: "Part library — Zenthi" },
      {
        property: "og:description",
        content: "Downloadable 3D-printable parts for exotic and high-performance cars.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LibraryPage,
});

type Part = {
  id: string;
  name: string;
  description: string;
  category: string;
  placement: string | null;
  material: string | null;
  thickness_infill: string | null;
  contributor_type: string[];
  vehicles: Vehicle[];
  notes: string | null;
  uploader_name: string | null;
  file_name: string;
  created_at: string;
};

function LibraryPage() {
  const [make, setMake] = useState("all");
  const [model, setModel] = useState("all");
  const [category, setCategory] = useState("all");
  const [downloading, setDownloading] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["parts", "approved"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parts")
        .select("id,name,description,category,placement,material,thickness_infill,contributor_type,vehicles,notes,uploader_name,file_name,created_at")
        .eq("status", "approved")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Part[];
    },
  });

  const parts = data ?? [];

  const makes = useMemo(
    () =>
      Array.from(new Set(parts.flatMap((p) => p.vehicles.map((v) => v.make).filter(Boolean)))).sort(),
    [parts],
  );
  const models = useMemo(
    () =>
      Array.from(
        new Set(
          parts
            .flatMap((p) => p.vehicles)
            .filter((v) => make === "all" || v.make === make)
            .map((v) => v.model)
            .filter(Boolean),
        ),
      ).sort(),
    [parts, make],
  );

  const filtered = parts.filter((p) => {
    if (category !== "all" && p.category !== category) return false;
    if (make !== "all" && !p.vehicles.some((v) => v.make === make)) return false;
    if (model !== "all" && !p.vehicles.some((v) => v.model === model)) return false;
    return true;
  });

  async function download(id: string) {
    setDownloading(id);
    try {
      const { url } = await getDownloadUrl({ data: { id } });
      window.location.href = url;
    } catch {
      toast.error("Could not generate a download link.");
    } finally {
      setDownloading(null);
    }
  }

  const selectCls =
    "rounded-sm border border-input bg-card px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/25";

  return (
    <SiteShell>
      <div className="mx-auto w-full max-w-6xl px-5 py-16">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="tech-label">Catalogue</p>
            <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight">
              Part library
            </h1>
          </div>
          <Link
            to="/upload"
            className="inline-flex h-11 items-center rounded-sm border border-brass bg-brass/10 px-5 text-sm font-medium text-brass-foreground hover:bg-brass/20"
          >
            Upload a file
          </Link>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-3 rounded-sm border border-border bg-card p-4">
          <span className="tech-label">Filter</span>
          <select
            aria-label="Make"
            value={make}
            onChange={(e) => {
              setMake(e.target.value);
              setModel("all");
            }}
            className={selectCls}
          >
            <option value="all">All makes</option>
            {makes.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <select
            aria-label="Model"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className={selectCls}
          >
            <option value="all">All models</option>
            {models.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <select
            aria-label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={selectCls}
          >
            <option value="all">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c as Category]}
              </option>
            ))}
          </select>
          <span className="ml-auto font-mono text-xs text-muted-foreground">
            {filtered.length} file{filtered.length === 1 ? "" : "s"}
          </span>
        </div>

        {isLoading ? (
          <p className="mt-16 font-mono text-sm text-muted-foreground">Loading catalogue…</p>
        ) : filtered.length === 0 ? (
          <div className="mt-16 rounded-sm border border-dashed border-border bg-card px-8 py-20 text-center">
            <p className="font-display text-2xl font-semibold">
              Nothing here yet — be the first to share a fix.
            </p>
            <Link
              to="/upload"
              className="mt-6 inline-flex h-11 items-center rounded-sm bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Upload a file
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {filtered.map((p) => (
              <article
                key={p.id}
                className="flex flex-col rounded-sm border border-border bg-card p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <h2 className="font-display text-xl font-semibold tracking-tight">{p.name}</h2>
                  <span className="shrink-0 rounded-sm bg-accent px-2 py-1 font-mono text-[0.65rem] tracking-widest text-accent-foreground uppercase">
                    {CATEGORY_LABELS[p.category as Category] ?? p.category}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {p.description}
                </p>
                <div className="mt-4">
                  <p className="tech-label">Fits</p>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {p.vehicles.map((v, i) => (
                      <li
                        key={i}
                        className="rounded-sm border border-border px-2 py-1 font-mono text-xs"
                      >
                        {vehicleLabel(v)}
                      </li>
                    ))}
                  </ul>
                </div>
                <dl className="mt-4 grid gap-3 rounded-sm border border-border bg-secondary/50 p-4 sm:grid-cols-3">
                  {p.placement && (
                    <div>
                      <dt className="tech-label">Recommended placement</dt>
                      <dd className="mt-1 font-mono text-xs">{p.placement}</dd>
                    </div>
                  )}
                  {p.material && (
                    <div>
                      <dt className="tech-label">Material</dt>
                      <dd className="mt-1 font-mono text-xs">{p.material}</dd>
                    </div>
                  )}
                  {p.thickness_infill && (
                    <div>
                      <dt className="tech-label">Thickness / infill</dt>
                      <dd className="mt-1 font-mono text-xs">{p.thickness_infill}</dd>
                    </div>
                  )}
                </dl>
                {p.notes && (
                  <details className="mt-4 rounded-sm border border-border bg-secondary/50 p-4">
                    <summary className="tech-label cursor-pointer">Uploader's writeup</summary>
                    <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                      {p.notes}
                    </p>
                  </details>
                )}
                <div className="mt-6 flex items-center justify-between gap-4 border-t border-border pt-4">
                  <p className="flex flex-wrap items-center gap-2 font-mono text-xs text-muted-foreground">
                    <span>
                      {p.file_name}
                      {p.uploader_name ? ` · ${p.uploader_name}` : ""}
                    </span>
                    {(Array.isArray(p.contributor_type) ? p.contributor_type : [p.contributor_type]).map(
                      (t) => (
                        <span
                          key={t}
                          className="rounded-sm bg-brass/15 px-2 py-0.5 text-[0.65rem] tracking-wide text-brass-foreground"
                        >
                          {CONTRIBUTOR_TYPE_LABELS[t as keyof typeof CONTRIBUTOR_TYPE_LABELS] ?? t}
                        </span>
                      ),
                    )}
                  </p>
                  <button
                    onClick={() => download(p.id)}
                    disabled={downloading === p.id}
                    className="inline-flex h-9 items-center rounded-sm bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    {downloading === p.id ? "Preparing…" : "Download"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </SiteShell>
  );
}
