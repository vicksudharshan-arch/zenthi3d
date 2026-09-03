import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { SiteShell } from "@/components/site-shell";
import { PartPreviewModal } from "@/components/part-preview-modal";
import {
  ExtraDownloadButtons,
  FormatBadges,
  PartNumbers,
  ReferenceOnlyBadge,
} from "@/components/part-meta";
import { supabase } from "@/integrations/supabase/client";
import {
  CATEGORY_LABELS,
  CONTRIBUTOR_TYPE_LABELS,
  parseExtraFiles,
  type AftermarketPartNumber,
  type Category,
  vehicleDetailLabel,
  vehicleLabel,
  type Vehicle,
} from "@/lib/parts";
import { getDownloadUrl } from "@/lib/parts.functions";

export const Route = createFileRoute("/library/$partId")({
  head: () => ({
    meta: [
      { title: "Part details — Zenthi" },
      {
        name: "description",
        content:
          "Full details, fitment, engine specifics, part numbers and file formats for a community-shared car part on Zenthi.",
      },
      { property: "og:title", content: "Part details — Zenthi" },
      {
        property: "og:description",
        content: "Fitment, part numbers and fabrication notes for a shared car part file.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PartDetailPage,
});

type Part = {
  id: string;
  name: string;
  description: string;
  category: string;
  reference_only: boolean;
  placement: string | null;
  material: string | null;
  thickness_infill: string | null;
  contributor_type: string[];
  vehicles: Vehicle[];
  oem_part_numbers: string | null;
  aftermarket_part_numbers: AftermarketPartNumber[];
  extra_files: { kind: string; path: string; name: string; size: number }[];
  notes: string | null;
  uploader_name: string | null;
  step_file_name: string | null;
  stl_file_name: string | null;
  source_link: string | null;
  license_type: string | null;
  original_creator: string | null;
  created_at: string;
};

function PartDetailPage() {
  const { partId } = Route.useParams();
  const [downloading, setDownloading] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["part", partId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parts")
        .select(
          "id,name,description,category,reference_only,placement,material,thickness_infill,contributor_type,vehicles,oem_part_numbers,aftermarket_part_numbers,extra_files,notes,uploader_name,step_file_name,stl_file_name,source_link,license_type,original_creator,created_at",
        )
        .eq("id", partId)
        .eq("status", "approved")
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as unknown as Part | null;
    },
  });

  const extras = parseExtraFiles(data?.extra_files);

  async function download(format: "step" | "stl" | "extra", extraIndex?: number) {
    if (!data) return;
    const key = format === "extra" ? `extra:${extraIndex}` : format;
    setDownloading(key);
    try {
      const { url } = await getDownloadUrl({
        data: { id: data.id, format, ...(extraIndex !== undefined ? { extraIndex } : {}) },
      });
      window.location.href = url;
    } catch {
      toast.error("Could not generate a download link.");
    } finally {
      setDownloading(null);
    }
  }

  async function copyLink() {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    } catch {
      window.prompt("Copy this link", url);
    }
  }

  return (
    <SiteShell>
      <div className="mx-auto w-full max-w-3xl px-5 py-16">
        <Link to="/library" className="font-mono text-xs text-muted-foreground hover:text-primary">
          ← Back to library
        </Link>

        {isLoading ? (
          <p className="mt-16 font-mono text-sm text-muted-foreground">Loading part…</p>
        ) : !data ? (
          <div className="mt-16 rounded-sm border border-dashed border-border bg-card px-8 py-20 text-center">
            <p className="font-display text-2xl font-semibold">This part isn't available.</p>
            <Link
              to="/library"
              className="mt-6 inline-flex h-11 items-center rounded-sm bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Browse the library
            </Link>
          </div>
        ) : (
          <article className="mt-8 rounded-sm border border-border bg-card p-8">
            <div className="flex items-start justify-between gap-4">
              <h1 className="font-display text-3xl font-semibold tracking-tight">{data.name}</h1>
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                {data.reference_only && <ReferenceOnlyBadge />}
                <span className="rounded-sm bg-accent px-2 py-1 font-mono text-[0.65rem] tracking-widest text-accent-foreground uppercase">
                  {CATEGORY_LABELS[data.category as Category] ?? data.category}
                </span>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{data.description}</p>

            {data.reference_only && (
              <p className="mt-4 rounded-sm border border-amber-600/50 bg-amber-500/10 p-4 text-sm leading-relaxed">
                The uploader marked this as reference/measurement only — it has not been verified as
                a functional replacement. Verify fit, material suitability and safety independently.
              </p>
            )}

            <div className="mt-6">
              <p className="tech-label">Fits</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {data.vehicles.map((v, i) => (
                  <li key={i} className="rounded-sm border border-border px-2 py-1 font-mono text-xs">
                    {vehicleLabel(v)}
                    {vehicleDetailLabel(v) && (
                      <span className="block text-[0.65rem] text-muted-foreground">
                        {vehicleDetailLabel(v)}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6">
              <FormatBadges part={data} />
            </div>

            <PartNumbers
              oem={data.oem_part_numbers}
              aftermarket={data.aftermarket_part_numbers}
            />

            <dl className="mt-6 grid gap-3 rounded-sm border border-border bg-secondary/50 p-4 sm:grid-cols-3">
              {data.placement && (
                <div>
                  <dt className="tech-label">Recommended placement</dt>
                  <dd className="mt-1 font-mono text-xs">{data.placement}</dd>
                </div>
              )}
              {data.material && (
                <div>
                  <dt className="tech-label">Material</dt>
                  <dd className="mt-1 font-mono text-xs">{data.material}</dd>
                </div>
              )}
              {data.thickness_infill && (
                <div>
                  <dt className="tech-label">Thickness / infill</dt>
                  <dd className="mt-1 font-mono text-xs">{data.thickness_infill}</dd>
                </div>
              )}
            </dl>

            {data.notes && (
              <div className="mt-6 rounded-sm border border-border bg-secondary/50 p-4">
                <p className="tech-label">Uploader's writeup</p>
                <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap">{data.notes}</p>
              </div>
            )}

            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5">
              <p className="flex flex-wrap items-center gap-2 font-mono text-xs text-muted-foreground">
                <span>
                  {[data.step_file_name, data.stl_file_name, ...extras.map((f) => f.name)]
                    .filter(Boolean)
                    .join(" · ")}
                  {data.uploader_name ? ` · ${data.uploader_name}` : ""}
                </span>

                {(Array.isArray(data.contributor_type)
                  ? data.contributor_type
                  : [data.contributor_type]
                ).map((t) => (
                  <span
                    key={t}
                    className="rounded-sm bg-brass/15 px-2 py-0.5 text-[0.65rem] tracking-wide text-brass-foreground"
                  >
                    {CONTRIBUTOR_TYPE_LABELS[t as keyof typeof CONTRIBUTOR_TYPE_LABELS] ?? t}
                  </span>
                ))}
                {data.original_creator && <span>Created by {data.original_creator}</span>}
                {data.source_link && (

                  <a
                    href={data.source_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline decoration-dotted underline-offset-2 hover:text-primary"
                  >
                    Source ↗
                  </a>
                )}
                {data.license_type && (
                  <span className="rounded-sm bg-brass/15 px-2 py-0.5 text-[0.65rem] tracking-wide text-brass-foreground">
                    {data.license_type}
                  </span>
                )}
              </p>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  onClick={() => setPreview(true)}
                  className="inline-flex h-9 items-center rounded-sm border border-border px-4 text-sm font-medium hover:bg-secondary"
                >
                  Preview
                </button>
                <button
                  onClick={copyLink}
                  className="inline-flex h-9 items-center rounded-sm border border-brass px-4 text-sm font-medium text-brass-foreground hover:bg-brass/15"
                >
                  Copy link
                </button>
                {data.step_file_name && (
                  <button
                    onClick={() => download("step")}
                    disabled={downloading === "step"}
                    className="inline-flex h-9 items-center rounded-sm bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    {downloading === "step" ? "Preparing…" : "Download STEP"}
                  </button>
                )}
                {data.stl_file_name && (
                  <button
                    onClick={() => download("stl")}
                    disabled={downloading === "stl"}
                    className="inline-flex h-9 items-center rounded-sm border border-primary px-4 text-sm font-medium text-primary hover:bg-primary/10 disabled:opacity-50"
                  >
                    {downloading === "stl" ? "Preparing…" : "Download STL"}
                  </button>
                )}
                <ExtraDownloadButtons
                  extras={extras}
                  onDownload={(i) => download("extra", i)}
                  busyKey={downloading}
                />
              </div>
            </div>
          </article>
        )}
      </div>

      {preview && data && (
        <PartPreviewModal
          part={{
            id: data.id,
            name: data.name,
            step_file_name: data.step_file_name,
            stl_file_name: data.stl_file_name,
          }}
          onClose={() => setPreview(false)}
        />
      )}
    </SiteShell>
  );
}
