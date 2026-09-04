import {
  PREVIEWABLE_EXTS,
  parseAftermarket,
  licenseUrl,
  partFileEntries,
  type AftermarketPartNumber,
  type FileGroup,
  type PartFileEntry,
  type PartFileSource,
} from "@/lib/parts";

export type PartFileInfo = PartFileSource;

export function FormatBadges({ part }: { part: PartFileInfo }) {
  const entries = partFileEntries(part);
  if (entries.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="tech-label">Formats</span>
      {entries.map((f) => (
        <span
          key={`${f.group}-${f.index}`}
          title={f.name}
          className={
            "rounded-sm border px-2 py-0.5 font-mono text-[0.65rem] tracking-widest uppercase " +
            (f.group === "step"
              ? "border-primary text-primary"
              : f.group === "stl"
                ? "border-brass text-brass-foreground"
                : "border-border text-muted-foreground")
          }
        >
          {f.badge}
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

/** One preview + download control pair per individual file on the part. */
export function FileActionButtons({
  entries,
  onDownload,
  onPreview,
  busyKey,
}: {
  entries: PartFileEntry[];
  onDownload: (group: FileGroup, index: number) => void;
  onPreview?: (entry: PartFileEntry) => void;
  busyKey: string | null;
}) {
  return (
    <>
      {entries.map((f) => {
        const key = `${f.group}:${f.index}`;
        return (
          <span key={key} className="inline-flex items-center gap-2">
            {onPreview && PREVIEWABLE_EXTS.includes(f.ext) && (
              <button
                onClick={() => onPreview(f)}
                className="inline-flex h-9 items-center rounded-sm border border-border px-3 text-sm font-medium hover:bg-secondary"
              >
                Preview {f.ext.toUpperCase()}
              </button>
            )}
            <button
              onClick={() => onDownload(f.group, f.index)}
              disabled={busyKey === key}
              title={f.name}
              className={
                "inline-flex h-9 max-w-[16rem] items-center truncate rounded-sm px-4 text-sm font-medium disabled:opacity-50 " +
                (f.group === "step"
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : f.group === "stl"
                    ? "border border-primary text-primary hover:bg-primary/10"
                    : "border border-border hover:bg-secondary")
              }
            >
              {busyKey === key ? "Preparing…" : `Download ${f.name}`}
            </button>
          </span>
        );
      })}
    </>
  );
}

/** License badge — links to the license text when we know the URL. */
export function LicenseBadge({ license }: { license: string | null | undefined }) {
  if (!license) return null;
  const url = licenseUrl(license);
  const cls =
    "rounded-sm bg-brass/15 px-2 py-0.5 text-[0.65rem] tracking-wide text-brass-foreground";
  if (!url) return <span className={cls}>{license}</span>;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer license"
      className={cls + " underline decoration-dotted underline-offset-2 hover:text-primary"}
    >
      {license} ↗
    </a>
  );
}
