import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { finalizeRequestFulfillment, getRequestSummary } from "@/lib/requests.functions";
import { toast } from "sonner";
import { SiteShell } from "@/components/site-shell";
import {
  AftermarketNumberFields,
  VehicleFitmentFields,
} from "@/components/vehicle-fitment-fields";
import { supabase } from "@/integrations/supabase/client";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  CONTRIBUTOR_TYPES,
  CONTRIBUTOR_TYPE_LABELS,
  LICENSE_OPTIONS,
  NO_DERIVATIVE_LICENSES,
  RESTRICTED_MAKE_MESSAGE,
  SAFETY_SENSITIVE_CATEGORIES,
  emptyVehicle,
  isRestrictedMake,
  type AftermarketPartNumber,
  type Category,
  type ContributorType,
  type Vehicle,
} from "@/lib/parts";


export const Route = createFileRoute("/upload")({
  validateSearch: (search: Record<string, unknown>): { requestId?: string } =>
    typeof search["requestId"] === "string" ? { requestId: search["requestId"] } : {},
  head: () => ({
    meta: [
      { title: "Upload a part file — Zenthi" },
      {
        name: "description",
        content:
          "Share STEP, STL, scan, cutting or drawing files for any car part, with fitment, engine details and part numbers so others can cross-reference and fabricate.",
      },
      { property: "og:title", content: "Upload a part file — Zenthi" },
      {
        property: "og:description",
        content: "Contribute a car part file and the story of how you solved the problem.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: UploadRoute,
});

/** Uploading requires an account; browsing the library does not. */
function UploadRoute() {
  const { session, loading } = useAuth();
  if (loading) return null;
  if (!session) {
    return (
      <SiteShell>
        <div className="mx-auto w-full max-w-3xl px-5 py-16">
          <AuthGate
            title="Sign in to upload a part"
            description="Files are credited to an account so attribution, licences and the review queue stay trustworthy."
          >
            <span />
          </AuthGate>
        </div>
      </SiteShell>
    );
  }
  return <UploadPage />;
}


const labelCls = "tech-label block";
const fieldCls =
  "mt-2 w-full rounded-sm border border-input bg-card px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-ring focus:ring-2 focus:ring-ring/25";
const fileCls =
  fieldCls +
  " file:mr-4 file:rounded-sm file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:text-secondary-foreground";

type Origin = "zenthi" | "external" | "modified";
type Visibility = "private" | "public_reviewed" | "public_auto";

type FileStatus = {
  status: "uploading" | "done" | "error";
  pct: number;
  error?: string;
};

export const fileKey = (group: string, f: File) => `${group}:${f.name}:${f.size}`;

function SelectedFileList({
  files,
  group,
  statuses,
  onRemove,
  onRetry,
}: {
  files: File[];
  group: string;
  statuses: Record<string, FileStatus>;
  onRemove: (i: number) => void;
  onRetry: (f: File, group: string) => void;
}) {
  if (files.length === 0) return null;
  return (
    <ul className="space-y-2">
      {files.map((f, i) => {
        const st = statuses[fileKey(group, f)];
        return (
          <li
            key={`${f.name}-${f.size}-${i}`}
            className="rounded-sm border border-border bg-background px-3 py-2"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="min-w-0 flex-1 truncate font-mono text-xs">{f.name}</span>
              <span className="font-mono text-[0.65rem] tracking-widest text-muted-foreground uppercase">
                {(f.size / 1024).toFixed(0)} KB
              </span>
              {st?.status === "error" ? (
                <button
                  type="button"
                  onClick={() => onRetry(f, group)}
                  className="font-mono text-[0.65rem] tracking-widest text-primary uppercase hover:underline"
                >
                  Retry
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="font-mono text-[0.65rem] tracking-widest text-muted-foreground uppercase hover:text-foreground"
              >
                Remove
              </button>
            </div>
            {st ? (
              <div className="mt-2">
                <div className="h-1 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className={`h-full transition-all ${
                      st.status === "error" ? "bg-destructive" : "bg-primary"
                    }`}
                    style={{ width: `${st.status === "done" ? 100 : st.pct}%` }}
                  />
                </div>
                <p className="mt-1 font-mono text-[0.65rem] tracking-widest text-muted-foreground uppercase">
                  {st.status === "done"
                    ? "Uploaded"
                    : st.status === "error"
                      ? `Failed — ${st.error ?? "network error"}`
                      : `Uploading ${st.pct}%`}
                </p>
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}


function UploadPage() {
  const { requestId } = Route.useSearch();
  const { data: requestSummary } = useQuery({
    queryKey: ["request-summary", requestId],
    enabled: !!requestId,
    queryFn: () => getRequestSummary({ data: { id: requestId! } }),
  });
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [uploader, setUploader] = useState("");
  const [contributorTypes, setContributorTypes] = useState<ContributorType[]>([]);
  const [category, setCategory] = useState<Category>("bracket_mount");
  const [referenceOnly, setReferenceOnly] = useState(false);
  const [placement, setPlacement] = useState("");
  const [material, setMaterial] = useState("");
  const [thickness, setThickness] = useState("");
  const [vehicles, setVehicles] = useState<Vehicle[]>([emptyVehicle()]);
  const [oemNumbers, setOemNumbers] = useState("");
  const [aftermarket, setAftermarket] = useState<AftermarketPartNumber[]>([
    { brand: "", number: "" },
  ]);
  const [notes, setNotes] = useState("");
  const [stepFiles, setStepFiles] = useState<File[]>([]);
  const [stlFiles, setStlFiles] = useState<File[]>([]);
  const [extraFiles, setExtraFiles] = useState<File[]>([]);
  const [origin, setOrigin] = useState<Origin>("zenthi");
  const [visibility, setVisibility] = useState<Visibility>("public_reviewed");
  const [sourceLink, setSourceLink] = useState("");
  const [licenseType, setLicenseType] = useState("");
  const [originalCreator, setOriginalCreator] = useState("");
  const [originalLicense, setOriginalLicense] = useState("");
  const [modificationNotes, setModificationNotes] = useState("");

  const [licensed, setLicensed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [submittedStatus, setSubmittedStatus] = useState<string>("pending");
  const [statuses, setStatuses] = useState<Record<string, FileStatus>>({});
  const uploadedRef = useRef<Record<string, string>>({});

  const hasAnyFile = stepFiles.length > 0 || stlFiles.length > 0 || extraFiles.length > 0;
  const encourageReference = SAFETY_SENSITIVE_CATEGORIES.includes(category);
  const hasFailures = Object.values(statuses).some((s) => s.status === "error");

  function setStatus(key: string, next: FileStatus) {
    setStatuses((s) => ({ ...s, [key]: next }));
  }

  /** Uploads via XHR so we get real progress events; caches the path so retries
   *  only re-send files that actually failed. */
  function uploadFile(f: File, group: string) {
    const key = fileKey(group, f);
    const cached = uploadedRef.current[key];
    if (cached) {
      setStatus(key, { status: "done", pct: 100 });
      return Promise.resolve(cached);
    }
    const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
    const path = `${crypto.randomUUID()}.${ext}`;
    const url = `${import.meta.env["VITE_SUPABASE_URL"]}/storage/v1/object/part-files/${path}`;
    const apiKey = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] as string;

    setStatus(key, { status: "uploading", pct: 0 });

    return new Promise<string>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", url, true);
      xhr.setRequestHeader("apikey", apiKey);
      xhr.setRequestHeader("x-upsert", "false");
      xhr.setRequestHeader("Content-Type", f.type || "application/octet-stream");
      xhr.upload.onprogress = (ev) => {
        if (!ev.lengthComputable) return;
        setStatus(key, {
          status: "uploading",
          pct: Math.min(99, Math.round((ev.loaded / ev.total) * 100)),
        });
      };
      const fail = (message: string) => {
        setStatus(key, { status: "error", pct: 0, error: message });
        reject(new Error(`${f.name}: ${message}`));
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          uploadedRef.current[key] = path;
          setStatus(key, { status: "done", pct: 100 });
          resolve(path);
        } else {
          let message = `upload failed (${xhr.status})`;
          try {
            const body = JSON.parse(xhr.responseText) as { message?: string; error?: string };
            message = body.message || body.error || message;
          } catch {
            /* keep default */
          }
          fail(message);
        }
      };
      xhr.onerror = () => fail("network error");
      xhr.ontimeout = () => fail("timed out");
      xhr.onabort = () => fail("upload cancelled");
      xhr.send(f);
    });
  }

  async function retryFile(f: File, group: string) {
    try {
      await uploadFile(f, group);
      toast.success(`${f.name} uploaded — submit again to finish.`);
    } catch {
      toast.error(`${f.name} failed again. Check your connection and retry.`);
    }
  }


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!licensed) return;
    if (!hasAnyFile) {
      toast.error("Attach at least one file — STEP is recommended, but any supported type works.");
      return;
    }
    if (
      stepFiles.some((f) => !["step", "stp"].includes(f.name.split(".").pop()?.toLowerCase() ?? ""))
    ) {
      toast.error("The STEP field only accepts .step or .stp files.");
      return;
    }
    if (stlFiles.some((f) => f.name.split(".").pop()?.toLowerCase() !== "stl")) {
      toast.error("The STL field only accepts .stl files.");
      return;
    }
    const cleanVehicles = vehicles.filter((v) => v.make.trim() || v.model.trim());
    if (cleanVehicles.length === 0) {
      toast.error("Add at least one vehicle this part fits.");
      return;
    }
    const restrictedVehicle = cleanVehicles.find((v) => isRestrictedMake(v.make));
    if (restrictedVehicle) {
      toast.error(RESTRICTED_MAKE_MESSAGE);
      return;
    }

    if (origin === "zenthi" && contributorTypes.length === 0) {
      toast.error("Select at least one contributor tag — what best describes you.");
      return;
    }
    if (origin === "external") {
      if (!sourceLink.trim()) {
        toast.error("Add the link to the original listing this file came from.");
        return;
      }
      try {
        new URL(sourceLink.trim());
      } catch {
        toast.error("The source link doesn't look like a valid URL.");
        return;
      }
      if (!licenseType) {
        toast.error("Select the license type of the original source file.");
        return;
      }
      if (!originalCreator.trim()) {
        toast.error("Add the original creator's name, or type 'Unknown'.");
        return;
      }
    }
    if (origin === "modified") {
      if (!sourceLink.trim()) {
        toast.error("Add the link to the original file you modified.");
        return;
      }
      try {
        new URL(sourceLink.trim());
      } catch {
        toast.error("The original source link doesn't look like a valid URL.");
        return;
      }
      if (!originalCreator.trim()) {
        toast.error("Add the original creator's name, or type 'Unknown'.");
        return;
      }
      if (!originalLicense) {
        toast.error("Select the license the original file was published under.");
        return;
      }
      if (NO_DERIVATIVE_LICENSES.includes(originalLicense)) {
        toast.error(
          "This license doesn't permit modified/derivative versions to be shared. This file can't be uploaded as a modification.",
        );
        return;
      }
      if (originalLicense === "Other/Unsure") {
        toast.error(
          "We can't verify an unknown license. Confirm the original file's license before uploading a modified version.",
        );
        return;
      }
      if (!modificationNotes.trim()) {
        toast.error("Describe what you changed from the original file.");
        return;
      }
      if (originalLicense !== "CC BY-SA" && !licenseType) {
        toast.error("Select the license for your modified version.");
        return;
      }
    }


    setSubmitting(true);
    try {
      const stepUploads = [];
      for (const file of stepFiles) {
        stepUploads.push({ path: await uploadFile(file, "step"), name: file.name, size: file.size });
      }
      const stlUploads = [];
      for (const file of stlFiles) {
        stlUploads.push({ path: await uploadFile(file, "stl"), name: file.name, size: file.size });
      }
      const extras = [];
      for (const file of extraFiles) {
        const kind = file.name.split(".").pop()?.toLowerCase() ?? "file";
        extras.push({ kind, path: await uploadFile(file, "extra"), name: file.name, size: file.size });
      }

      const submissionStatus = requestId
        ? visibility === "private"
          ? "private_fulfillment"
          : visibility === "public_auto"
            ? "approved"
            : "pending"
        : "pending";

      const { data: inserted, error } = await supabase.from("parts").insert({
        request_id: requestId ?? null,
        name: name.trim(),
        description: description.trim(),
        category,
        reference_only: referenceOnly,
        placement: placement.trim() || null,
        material: material.trim(),
        thickness_infill: thickness.trim(),
        contributor_type: contributorTypes,
        vehicles: cleanVehicles,
        oem_part_numbers: oemNumbers.trim() || null,
        aftermarket_part_numbers: aftermarket.filter((r) => r.brand.trim() || r.number.trim()),
        notes: notes.trim() || null,
        uploader_name: uploader.trim() || null,
        step_files: stepUploads,
        stl_files: stlUploads,
        step_file_path: stepUploads[0]?.path ?? null,
        step_file_name: stepUploads[0]?.name ?? null,
        step_file_size: stepUploads[0]?.size ?? null,
        stl_file_path: stlUploads[0]?.path ?? null,
        stl_file_name: stlUploads[0]?.name ?? null,
        stl_file_size: stlUploads[0]?.size ?? null,
        extra_files: extras,
        source_link: origin === "zenthi" ? null : sourceLink.trim(),
        license_type:
          origin === "zenthi"
            ? "CC BY"
            : origin === "modified" && originalLicense === "CC BY-SA"
              ? "CC BY-SA"
              : licenseType,
        original_creator: origin === "zenthi" ? null : originalCreator.trim(),
        modification_notes: origin === "modified" ? modificationNotes.trim() : null,

        license_accepted: true,
        status: submissionStatus,
      }).select("id").maybeSingle();
      if (error) throw error;
      if (requestId && inserted?.id && submissionStatus !== "pending") {
        await finalizeRequestFulfillment({ data: { requestId, partId: inserted.id } });
      }
      setSubmittedStatus(submissionStatus);
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <SiteShell>
        <div className="mx-auto w-full max-w-2xl px-5 py-28 text-center">
          <p className="tech-label">Submission received</p>
          <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight">
            {submittedStatus === "private_fulfillment"
              ? "Thanks — sent privately to the requester."
              : submittedStatus === "approved"
                ? "Thanks — your file is live."
                : "Thanks — this is queued for a quick review before it goes live."}
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            {submittedStatus === "private_fulfillment"
              ? "It stays out of the public library and search. The request is now marked fulfilled, and the requester can reveal the download from their request card."
              : submittedStatus === "approved"
                ? "It's in the public library now and the request is marked fulfilled."
                : "We check that the fitment details make sense and that the attribution is in order. Once approved it appears in the public library."}
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link
              to="/library"
              className="inline-flex h-11 items-center rounded-sm bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Browse the library
            </Link>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex h-11 items-center rounded-sm border border-border px-6 text-sm font-medium hover:bg-secondary"
            >
              Upload another
            </button>
          </div>
        </div>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <div className="mx-auto w-full max-w-3xl px-5 py-16">
        {requestSummary && (
          <div className="mb-8 rounded-sm border border-primary/40 bg-primary/5 p-4 text-sm text-foreground">
            <p className="tech-label mb-2 text-brass">Fulfilling a request</p>
            <p>
              You're fulfilling a request: {requestSummary.part_description}
              {requestSummary.make || requestSummary.model
                ? ` (${[requestSummary.make, requestSummary.model].filter(Boolean).join(" ")})`
                : ""}
            </p>
          </div>
        )}
        <p className="tech-label">Contribute</p>
        <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight">Upload a file</h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Any car part is welcome — including suspension, brakes, engine and structural components.
          Those are valuable as fitment and measurement references even when they shouldn't be
          fabricated as functional replacements.
        </p>

        <form onSubmit={handleSubmit} className="mt-12 space-y-10">
          {requestId && (
            <fieldset className="space-y-4">
              <legend className="tech-label mb-4 text-brass">00 — Who can see this file?</legend>
              <div className="grid gap-3">
                {(
                  [
                    [
                      "private",
                      "Private — only visible to the requester",
                      "Stays out of the public library and search. The requester can reveal a download link from their request card.",
                    ],
                    [
                      "public_reviewed",
                      "Public — goes through normal review",
                      "Queued for a quick check. It appears in the library and fulfils the request once approved.",
                    ],
                    [
                      "public_auto",
                      "Public — publish immediately, skip review",
                      "Skips review — your submission goes live immediately without a check.",
                    ],
                  ] as const
                ).map(([value, label, help]) => (
                  <label
                    key={value}
                    className={
                      "flex cursor-pointer items-start gap-3 rounded-sm border p-4 text-sm transition-colors " +
                      (visibility === value
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:border-ring")
                    }
                  >
                    <input
                      type="radio"
                      name="visibility"
                      value={value}
                      checked={visibility === value}
                      onChange={() => setVisibility(value)}
                      className="mt-0.5 size-4 shrink-0 accent-[var(--primary)]"
                    />
                    <span>
                      {label}
                      <span
                        className={
                          "mt-1 block text-xs leading-relaxed " +
                          (value === "public_auto" ? "text-brass" : "text-muted-foreground")
                        }
                      >
                        {help}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          <fieldset className="space-y-4">
            <legend className="tech-label mb-4 text-brass">01 — Where is this file from?</legend>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(
                [
                  ["zenthi", "I made this / uploading directly to Zenthi"],
                  ["external", "This is from another site"],
                  ["modified", "I modified someone else's file"],
                ] as const
              ).map(([value, label]) => (
                <label
                  key={value}
                  className={
                    "flex cursor-pointer items-start gap-3 rounded-sm border p-4 text-sm transition-colors " +
                    (origin === value
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-ring")
                  }
                >
                  <input
                    type="radio"
                    name="origin"
                    value={value}
                    checked={origin === value}
                    onChange={() => {
                      setOrigin(value);
                      if (value === "zenthi") {
                        setSourceLink("");
                        setLicenseType("");
                        setOriginalLicense("");
                        setModificationNotes("");
                      }
                    }}
                    className="mt-0.5 size-4 shrink-0 accent-[var(--primary)]"
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
            {origin === "external" && (
              <div className="grid gap-6 rounded-sm border border-border bg-secondary/50 p-4 sm:grid-cols-2">
                <div>
                  <label className={labelCls} htmlFor="sourceLink">
                    Source link
                  </label>
                  <input
                    id="sourceLink"
                    type="url"
                    required
                    value={sourceLink}
                    onChange={(e) => setSourceLink(e.target.value)}
                    placeholder="https://www.thingiverse.com/thing:…"
                    className={fieldCls}
                  />
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    Link to the original listing (Thingiverse, Printables, GrabCAD…) so attribution
                    stays intact.
                  </p>
                </div>
                <div>
                  <label className={labelCls} htmlFor="licenseType">
                    License type
                  </label>
                  <select
                    id="licenseType"
                    required
                    value={licenseType}
                    onChange={(e) => setLicenseType(e.target.value)}
                    className={fieldCls}
                  >
                    <option value="" disabled>
                      Select license…
                    </option>
                    <option value="CC0">CC0</option>
                    <option value="CC BY">CC BY</option>
                    <option value="CC BY-SA">CC BY-SA</option>
                    <option value="CC BY-NC">CC BY-NC</option>
                    <option value="CC BY-ND">CC BY-ND</option>
                    <option value="CC BY-NC-ND">CC BY-NC-ND</option>
                    <option value="Other/Unsure">Other/Unsure</option>
                  </select>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    Check the original listing and select the license it was published under.
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls} htmlFor="originalCreator">
                    Credits (original creator)
                  </label>
                  <input
                    id="originalCreator"
                    type="text"
                    required
                    value={originalCreator}
                    onChange={(e) => setOriginalCreator(e.target.value)}
                    placeholder="Creator name or handle"
                    className={fieldCls}
                  />
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    Enter the creator's name, or type "Unknown" if you don't know who made it.
                  </p>
                </div>
              </div>
            )}

            {origin === "modified" && (
              <div className="grid gap-6 rounded-sm border border-border bg-secondary/50 p-4 sm:grid-cols-2">
                <div>
                  <label className={labelCls} htmlFor="sourceLink">
                    Original source link
                  </label>
                  <input
                    id="sourceLink"
                    type="url"
                    required
                    value={sourceLink}
                    onChange={(e) => setSourceLink(e.target.value)}
                    placeholder="https://www.printables.com/model/…"
                    className={fieldCls}
                  />
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    Where the file you started from came from.
                  </p>
                </div>
                <div>
                  <label className={labelCls} htmlFor="originalCreator">
                    Original creator
                  </label>
                  <input
                    id="originalCreator"
                    type="text"
                    required
                    value={originalCreator}
                    onChange={(e) => setOriginalCreator(e.target.value)}
                    placeholder="Creator name or handle"
                    className={fieldCls}
                  />
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    Enter the creator&apos;s name, or type &quot;Unknown&quot; if you don&apos;t
                    know who made it.
                  </p>
                </div>
                <div>
                  <label className={labelCls} htmlFor="originalLicense">
                    Original file&apos;s license
                  </label>
                  <select
                    id="originalLicense"
                    required
                    value={originalLicense}
                    onChange={(e) => {
                      setOriginalLicense(e.target.value);
                      if (e.target.value === "CC BY-SA") setLicenseType("CC BY-SA");
                    }}
                    className={fieldCls}
                  >
                    <option value="" disabled>
                      Select license…
                    </option>
                    {LICENSE_OPTIONS.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    Licenses ending in ND don&apos;t allow modified versions to be shared.
                  </p>
                </div>
                <div>
                  <label className={labelCls} htmlFor="licenseType">
                    License for your modified version
                  </label>
                  <select
                    id="licenseType"
                    required
                    disabled={originalLicense === "CC BY-SA"}
                    value={originalLicense === "CC BY-SA" ? "CC BY-SA" : licenseType}
                    onChange={(e) => setLicenseType(e.target.value)}
                    className={fieldCls + " disabled:opacity-60"}
                  >
                    <option value="" disabled>
                      Select license…
                    </option>
                    {LICENSE_OPTIONS.filter((l) => l !== "Other/Unsure").map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {originalLicense === "CC BY-SA"
                      ? "ShareAlike carries forward — your version stays CC BY-SA."
                      : "Keep it at least as restrictive as the original file's license."}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls} htmlFor="modificationNotes">
                    What did you change?
                  </label>
                  <textarea
                    id="modificationNotes"
                    required
                    rows={3}
                    value={modificationNotes}
                    onChange={(e) => setModificationNotes(e.target.value)}
                    placeholder="Scaled up 10%, added a mounting tab, thicker walls for PETG…"
                    className={fieldCls}
                  />
                </div>
              </div>
            )}

            {origin === "zenthi" && (
              <p className="font-mono text-xs text-muted-foreground">
                Original uploads are published under CC BY, matching the agreement at the bottom of
                this form.
              </p>
            )}
          </fieldset>

          <fieldset className="space-y-6">
            <legend className="tech-label mb-4 text-brass">02 — The part</legend>
            <div>
              <label className={labelCls} htmlFor="name">
                Part name
              </label>
              <input
                id="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Front lower control arm bushing housing"
                className={fieldCls}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="description">
                Description
              </label>
              <textarea
                id="description"
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What the part is and what it replaces."
                className={fieldCls}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="category">
                Category
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className={fieldCls}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-sm border border-amber-600/50 bg-amber-500/10 p-4">
              <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed">
                <input
                  type="checkbox"
                  checked={referenceOnly}
                  onChange={(e) => setReferenceOnly(e.target.checked)}
                  className="mt-1 size-4 shrink-0 accent-[var(--brass)]"
                />
                <span>Reference/measurement only — not verified as a functional replacement.</span>
              </label>
              <p className="mt-3 pl-7 text-xs leading-relaxed text-muted-foreground">
                {encourageReference
                  ? "Strongly encouraged for this category. Suspension, brake, engine, drivetrain and electrical files are usually shared for fitment and measurement, not for driving on."
                  : "Optional, but strongly encouraged for anything beyond simple cosmetic parts."}
              </p>
            </div>

            <div>
              <label className={labelCls} htmlFor="placement">
                Recommended placement
              </label>
              <input
                id="placement"
                required
                value={placement}
                onChange={(e) => setPlacement(e.target.value)}
                placeholder="Where on the vehicle this installs — e.g. driver-side front subframe"
                className={fieldCls}
              />
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className={labelCls} htmlFor="material">
                  Recommended material
                </label>
                <input
                  id="material"
                  required
                  list="materials"
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  placeholder="PETG"
                  className={fieldCls}
                />
                <datalist id="materials">
                  <option value="PLA" />
                  <option value="PETG" />
                  <option value="ABS" />
                  <option value="ASA" />
                  <option value="Nylon (PA)" />
                  <option value="TPU" />
                  <option value="Polycarbonate" />
                  <option value="Aluminium" />
                  <option value="Mild steel" />
                  <option value="Stainless steel" />
                </datalist>
              </div>
              <div>
                <label className={labelCls} htmlFor="thickness">
                  Recommended thickness / infill
                </label>
                <input
                  id="thickness"
                  required
                  value={thickness}
                  onChange={(e) => setThickness(e.target.value)}
                  placeholder="4 walls · 40% infill"
                  className={fieldCls}
                />
              </div>
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="tech-label mb-4 text-brass">03 — Fitment</legend>
            <p className="font-mono text-xs leading-relaxed text-muted-foreground">
              Engine and drivetrain details are optional, but they matter a lot for swapped project
              cars where make, model and year alone aren't specific enough.
            </p>
            <VehicleFitmentFields
              vehicles={vehicles}
              onChange={setVehicles}
              idPrefix="upload"
              makeHelperText="Honda/Acura and Stellantis-brand vehicles aren't currently supported — see homepage for why."
              validateMakes
            />

          </fieldset>

          <fieldset className="space-y-6">
            <legend className="tech-label mb-4 text-brass">04 — Part numbers (optional)</legend>
            <div>
              <label className={labelCls} htmlFor="oem">
                OEM part number(s)
              </label>
              <input
                id="oem"
                value={oemNumbers}
                onChange={(e) => setOemNumbers(e.target.value)}
                placeholder="12573460, 12602543"
                className={fieldCls + " font-mono"}
              />
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Separate multiple numbers with commas.
              </p>
            </div>
            <div>
              <span className={labelCls}>Aftermarket part number(s)</span>
              <AftermarketNumberFields rows={aftermarket} onChange={setAftermarket} />
            </div>
          </fieldset>

          <fieldset className="space-y-6">
            <legend className="tech-label mb-4 text-brass">05 — Files &amp; writeup</legend>
            <p className="font-mono text-xs leading-relaxed text-muted-foreground">
              STEP is the most useful format when you have it — it can be exported to STL, but not
              the other way around. Scans, cutting files and 2D drawings are welcome too. Attach at
              least one file of any supported type to submit.
            </p>
            <div className="space-y-4">
              <div>
                <label className={labelCls} htmlFor="stepFile">
                  STEP files (recommended)
                </label>
                <input
                  id="stepFile"
                  type="file"
                  multiple
                  onChange={(e) => {
                    const picked = Array.from(e.target.files ?? []);
                    const ok = picked.filter((f) =>
                      ["step", "stp"].includes(f.name.split(".").pop()?.toLowerCase() ?? ""),
                    );
                    if (ok.length < picked.length) {
                      toast.error("The STEP field only accepts .step or .stp files.");
                    }
                    setStepFiles((s) => [
                      ...s,
                      ...ok.filter((f) => !s.some((x) => x.name === f.name && x.size === f.size)),
                    ]);
                    e.target.value = "";
                  }}
                  className={fileCls}
                />
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  Editable CAD. This is what most machine shops need, and lets others modify the
                  design for their own fit. Select several at once if the part has multiple pieces.
                </p>
              </div>
              <SelectedFileList
                files={stepFiles}
                group="step"
                statuses={statuses}
                onRetry={retryFile}
                onRemove={(i) => setStepFiles((s) => s.filter((_, idx) => idx !== i))}
              />
            </div>
            <div className="space-y-4">
              <div>
                <label className={labelCls} htmlFor="stlFile">
                  STL files (optional)
                </label>
                <input
                  id="stlFile"
                  type="file"
                  multiple
                  onChange={(e) => {
                    const picked = Array.from(e.target.files ?? []);
                    const ok = picked.filter(
                      (f) => (f.name.split(".").pop()?.toLowerCase() ?? "") === "stl",
                    );
                    if (ok.length < picked.length) {
                      toast.error("The STL field only accepts .stl files.");
                    }
                    setStlFiles((s) => [
                      ...s,
                      ...ok.filter((f) => !s.some((x) => x.name === f.name && x.size === f.size)),
                    ]);
                    e.target.value = "";
                  }}
                  className={fileCls}
                />
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  Ready-to-print mesh files. They work if that's all you have, but can't be easily
                  edited like STEP can. Select several at once. If your device greys out files in the
                  picker, all file types are now selectable — the extension is checked here instead.
                </p>

              </div>
              <SelectedFileList
                files={stlFiles}
                group="stl"
                statuses={statuses}
                onRetry={retryFile}
                onRemove={(i) => setStlFiles((s) => s.filter((_, idx) => idx !== i))}
              />
            </div>

            <div className="space-y-4 rounded-sm border border-border bg-secondary/50 p-4">
              <div>
                <label className={labelCls} htmlFor="extraFiles">
                  Additional files (optional)
                </label>
                <input
                  id="extraFiles"
                  type="file"
                  multiple
                  onChange={(e) => {
                    const picked = Array.from(e.target.files ?? []);
                    setExtraFiles((s) => [
                      ...s,
                      ...picked.filter((f) => !s.some((x) => x.name === f.name && x.size === f.size)),
                    ]);
                    e.target.value = "";
                  }}
                  className={fileCls}
                />
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  Native CAD (Rhino .3dm, SolidWorks, Fusion 360), 3D scans (OBJ/PLY), cutting
                  files (DXF/SVG) or drawings (PDF/DWG) — anything else that helps with this part.
                  Select several at once.
                </p>
              </div>
              <SelectedFileList
                files={extraFiles}
                group="extra"
                statuses={statuses}
                onRetry={retryFile}
                onRemove={(i) => setExtraFiles((s) => s.filter((_, idx) => idx !== i))}
              />
            </div>

            {!hasAnyFile && (
              <p className="font-mono text-xs text-muted-foreground">
                Attach at least one file — STEP (.step/.stp) is recommended; STL and any
                additional CAD, scan, cutting or drawing files are also accepted.
              </p>
            )}

            <div>
              <label className={labelCls} htmlFor="notes">
                Notes (optional)
              </label>
              <textarea
                id="notes"
                rows={6}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="How you solved it, print settings, tips for getting it to fit — anything useful for the next person."
                className={fieldCls}
              />
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                How you solved it, print settings, tips for getting it to fit — anything useful for
                the next person.
              </p>
            </div>
            <div>
              <label className={labelCls} htmlFor="uploader">
                Your name or handle
              </label>
              <input
                id="uploader"
                required
                value={uploader}
                onChange={(e) => setUploader(e.target.value)}
                className={fieldCls}
              />
            </div>
            <div>
              <span className={labelCls} id="contributorType-label">
                You are a… (select all that apply)
                {origin !== "zenthi" && " — optional"}
              </span>
              <div
                role="group"
                aria-labelledby="contributorType-label"
                className="mt-2 flex flex-wrap gap-2"
              >
                {CONTRIBUTOR_TYPES.map((t) => {
                  const active = contributorTypes.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      aria-pressed={active}
                      onClick={() =>
                        setContributorTypes((ts) =>
                          active ? ts.filter((x) => x !== t) : [...ts, t],
                        )
                      }
                      className={
                        "rounded-sm border px-3 py-1.5 text-sm transition-colors " +
                        (active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-foreground hover:border-ring hover:bg-secondary")
                      }
                    >
                      {CONTRIBUTOR_TYPE_LABELS[t]}
                    </button>
                  );
                })}
              </div>
              {contributorTypes.length === 0 && (
                <p className="mt-2 font-mono text-xs text-muted-foreground">
                  {origin !== "zenthi"
                    ? "Optional when reuploading someone else's work."
                    : "Pick at least one tag."}
                </p>
              )}
            </div>

          </fieldset>

          <div className="rounded-sm border border-brass/50 bg-brass/10 p-5">
            <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed">
              <input
                type="checkbox"
                checked={licensed}
                onChange={(e) => setLicensed(e.target.checked)}
                className="mt-1 size-4 shrink-0 accent-[var(--brass)]"
              />
              <span>
                I created this file or have the right to share it, and I grant Zenthi a license to
                host and redistribute it under the{" "}
                <a
                  href="https://creativecommons.org/licenses/by/4.0/"
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-2"
                >
                  Creative Commons Attribution license
                </a>
                .
              </span>
            </label>
            <p className="mt-3 pl-7 font-mono text-xs text-muted-foreground">
              See our{" "}
              <Link to="/copyright-policy" className="underline underline-offset-2 hover:text-foreground">
                copyright policy
              </Link>{" "}
              for more.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="submit"
              disabled={!licensed || submitting || !hasAnyFile}
              className="inline-flex h-11 items-center rounded-sm bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? "Uploading…" : hasFailures ? "Retry & submit" : "Submit for review"}
            </button>
            {!licensed && (
              <p className="font-mono text-xs text-muted-foreground">
                Accept the license terms to submit.
              </p>
            )}
            {hasFailures && !submitting && (
              <p className="font-mono text-xs text-destructive">
                Some files didn't upload. Retry them above, or submit again — files that already
                uploaded won't be sent twice.
              </p>
            )}
          </div>

        </form>
      </div>
    </SiteShell>
  );
}
