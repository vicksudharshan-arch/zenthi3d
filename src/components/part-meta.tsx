import {
  extraFileBadge,
  parseAftermarket,
  parseExtraFiles,
  type AftermarketPartNumber,
  type ExtraFile,
} from "@/lib/parts";

export type PartFileInfo = {
  step_file_name: string | null;
  stl_file_name: string | null;
  extra_files: ExtraFile[] | unknown;
};

export function FormatBadges({ part }: { part: PartFileInfo }) {
  const extras = parseExtraFiles(part.extra_files);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="tech-label">Formats</span>
      {part.step_file_name && (
        <span className="rounded-sm border border-primary px-2 py-0.5 font-mono text-[0.65rem] tracking-widest text-primary uppercase">
          STEP · editable
        </span>
      )}
      {part.stl_file_name && (
        <span className="rounded-sm border border-brass px-2 py-0.5 font-mono text-[0.65rem] tracking-widest text-brass-foreground uppercase">
          STL · print-ready
        </span>
      )}
      {extras.map((f, i) => (
        <span
          key={`${f.kind}-${i}`}
          className="rounded-sm border border-border px-2 py-0.5 font-mono text-[0.65rem] tracking-widest text-muted-foreground uppercase"
        >
          {extraFileBadge(f.kind)}
        </span>
      ))}
    </div>
  );
}

export function ReferenceOnlyBadge() {
  return (
    <span className="rounded-sm border border-amber-600/60 bg-amber-500/15 px-2 py-0.5 font-mono text-[0.65rem] tracking-widest text-amber-800 uppercase dark:text-amber-300">
      Reference only
    </span>
  );
}

export function PartNumbers({
  oem,
  aftermarket,
}: {
  oem: string | null;
  aftermarket: AftermarketPartNumber[] | unknown;
}) {
  const rows = parseAftermarket(aftermarket);
  const oemList = (oem ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (oemList.length === 0 && rows.length === 0) return null;

  return (
    <div className="mt-4 rounded-sm border border-border bg-secondary/50 p-4">
      <p className="tech-label">Part numbers</p>
      {oemList.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="font-mono text-[0.65rem] tracking-widest text-muted-foreground uppercase">
            OEM
          </span>
          {oemList.map((n) => (
            <span key={n} className="rounded-sm border border-border px-2 py-0.5 font-mono text-xs">
              {n}
            </span>
          ))}
        </div>
      )}
      {rows.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="font-mono text-[0.65rem] tracking-widest text-muted-foreground uppercase">
            Aftermarket
          </span>
          {rows.map((r, i) => (
            <span
              key={i}
              className="rounded-sm border border-border px-2 py-0.5 font-mono text-xs"
            >
              {[r.brand, r.number].filter(Boolean).join(" ")}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function ExtraDownloadButtons({
  extras,
  onDownload,
  busyKey,
}: {
  extras: ExtraFile[];
  onDownload: (index: number) => void;
  busyKey: string | null;
}) {
  return (
    <>
      {extras.map((f, i) => (
        <button
          key={`${f.path}-${i}`}
          onClick={() => onDownload(i)}
          disabled={busyKey === `extra:${i}`}
          title={f.name}
          className="inline-flex h-9 max-w-[16rem] items-center truncate rounded-sm border border-border px-4 text-sm font-medium hover:bg-secondary disabled:opacity-50"
        >
          {busyKey === `extra:${i}` ? "Preparing…" : `Download ${f.name}`}
        </button>
      ))}

    </>
  );
}
