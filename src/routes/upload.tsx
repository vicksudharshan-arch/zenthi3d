import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
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
  EXTRA_FILE_KINDS,
  EXTRA_FILE_META,
  SAFETY_SENSITIVE_CATEGORIES,
  emptyVehicle,
  type AftermarketPartNumber,
  type Category,
  type ContributorType,
  type ExtraFileKind,
  type Vehicle,
} from "@/lib/parts";

export const Route = createFileRoute("/upload")({
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
  component: UploadPage,
});

const labelCls = "tech-label block";
const fieldCls =
  "mt-2 w-full rounded-sm border border-input bg-card px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-ring focus:ring-2 focus:ring-ring/25";
const fileCls =
  fieldCls +
  " file:mr-4 file:rounded-sm file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:text-secondary-foreground";

type Origin = "zenthi" | "external";

function UploadPage() {
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
  const [stepFile, setStepFile] = useState<File | null>(null);
  const [stlFile, setStlFile] = useState<File | null>(null);
  const [extraFiles, setExtraFiles] = useState<Partial<Record<ExtraFileKind, File | null>>>({});
  const [origin, setOrigin] = useState<Origin>("zenthi");
  const [sourceLink, setSourceLink] = useState("");
  const [licenseType, setLicenseType] = useState("");
  const [originalCreator, setOriginalCreator] = useState("");

  const [licensed, setLicensed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const chosenExtras = EXTRA_FILE_KINDS.map((k) => [k, extraFiles[k] ?? null] as const).filter(
    (e): e is readonly [ExtraFileKind, File] => !!e[1],
  );
  const hasAnyFile = !!stepFile || !!stlFile || chosenExtras.length > 0;
  const encourageReference = SAFETY_SENSITIVE_CATEGORIES.includes(category);

  async function uploadFile(f: File) {
    const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("part-files").upload(path, f, {
      contentType: f.type || "application/octet-stream",
    });
    if (error) throw error;
    return path;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!licensed) return;
    if (!hasAnyFile) {
      toast.error("Attach at least one file — STEP is recommended, but any supported type works.");
      return;
    }
    const stepExt = stepFile?.name.split(".").pop()?.toLowerCase() ?? "";
    if (stepFile && !["step", "stp"].includes(stepExt)) {
      toast.error("The STEP field only accepts .step or .stp files.");
      return;
    }
    if (stlFile && stlFile.name.split(".").pop()?.toLowerCase() !== "stl") {
      toast.error("The STL field only accepts .stl files.");
      return;
    }
    for (const [kind, file] of chosenExtras) {
      if (file.name.split(".").pop()?.toLowerCase() !== kind) {
        toast.error(`The ${kind.toUpperCase()} field only accepts .${kind} files.`);
        return;
      }
    }
    const cleanVehicles = vehicles.filter((v) => v.make.trim() || v.model.trim());
    if (cleanVehicles.length === 0) {
      toast.error("Add at least one vehicle this part fits.");
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


    setSubmitting(true);
    try {
      const stepPath = stepFile ? await uploadFile(stepFile) : null;
      const stlPath = stlFile ? await uploadFile(stlFile) : null;
      const extras = [];
      for (const [kind, file] of chosenExtras) {
        extras.push({ kind, path: await uploadFile(file), name: file.name, size: file.size });
      }

      const { error } = await supabase.from("parts").insert({
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
        step_file_path: stepPath,
        step_file_name: stepFile?.name ?? null,
        step_file_size: stepFile?.size ?? null,
        stl_file_path: stlPath,
        stl_file_name: stlFile?.name ?? null,
        stl_file_size: stlFile?.size ?? null,
        extra_files: extras,
        source_link: origin === "external" ? sourceLink.trim() : null,
        license_type: origin === "external" ? licenseType : "CC BY",
        original_creator: origin === "external" ? originalCreator.trim() : null,

        license_accepted: true,
        status: "pending",
      });
      if (error) throw error;
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
            Thanks — this is queued for a quick review before it goes live.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            We check that the fitment details make sense and that the attribution is in order. Once
            approved it appears in the public library.
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
        <p className="tech-label">Contribute</p>
        <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight">Upload a file</h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Any car part is welcome — including suspension, brakes, engine and structural components.
          Those are valuable as fitment and measurement references even when they shouldn't be
          fabricated as functional replacements.
        </p>

        <form onSubmit={handleSubmit} className="mt-12 space-y-10">
          <fieldset className="space-y-4">
            <legend className="tech-label mb-4 text-brass">01 — Where is this file from?</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  ["zenthi", "I made this / uploading directly to Zenthi"],
                  ["external", "This is from another site"],
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
            <VehicleFitmentFields vehicles={vehicles} onChange={setVehicles} idPrefix="upload" />
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
            <div>
              <label className={labelCls} htmlFor="stepFile">
                STEP file (recommended)
              </label>
              <input
                id="stepFile"
                type="file"
                accept=".step,.stp,application/step"
                onChange={(e) => setStepFile(e.target.files?.[0] ?? null)}
                className={fileCls}
              />
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Editable CAD. This is what most machine shops need, and lets others modify the
                design for their own fit.
              </p>
            </div>
            <div>
              <label className={labelCls} htmlFor="stlFile">
                STL file (optional)
              </label>
              <input
                id="stlFile"
                type="file"
                accept=".stl,model/stl"
                onChange={(e) => setStlFile(e.target.files?.[0] ?? null)}
                className={fileCls}
              />
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Ready-to-print mesh file. Works if that's all you have, but it can't be easily
                edited like STEP can.
              </p>
            </div>

            <div className="space-y-6 rounded-sm border border-border bg-secondary/50 p-4">
              <p className="tech-label">
                Scans, cutting files &amp; drawings — attach whichever you have
              </p>
              {EXTRA_FILE_KINDS.map((kind) => (
                <div key={kind}>
                  <label className={labelCls} htmlFor={`file-${kind}`}>
                    {EXTRA_FILE_META[kind].label}
                  </label>
                  <input
                    id={`file-${kind}`}
                    type="file"
                    accept={EXTRA_FILE_META[kind].accept}
                    onChange={(e) =>
                      setExtraFiles((s) => ({ ...s, [kind]: e.target.files?.[0] ?? null }))
                    }
                    className={fileCls}
                  />
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {EXTRA_FILE_META[kind].helper}
                  </p>
                </div>
              ))}
            </div>

            {!hasAnyFile && (
              <p className="font-mono text-xs text-muted-foreground">
                Attach at least one file — STEP (.step/.stp) is recommended; STL, OBJ, PLY, DXF,
                SVG, PDF and DWG are also accepted.
              </p>
            )}

            <div>
              <label className={labelCls} htmlFor="notes">
                How you solved it (optional)
              </label>
              <textarea
                id="notes"
                rows={6}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Print settings, material, tolerances, how you measured the original, what failed on revision one…"
                className={fieldCls}
              />
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
                {origin === "external" && " — optional"}
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
                  {origin === "external"
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

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={!licensed || submitting || !hasAnyFile}
              className="inline-flex h-11 items-center rounded-sm bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? "Uploading…" : "Submit for review"}
            </button>
            {!licensed && (
              <p className="font-mono text-xs text-muted-foreground">
                Accept the license terms to submit.
              </p>
            )}
          </div>
        </form>
      </div>
    </SiteShell>
  );
}
