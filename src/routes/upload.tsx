import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { SiteShell } from "@/components/site-shell";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, CATEGORY_LABELS, type Category, type Vehicle } from "@/lib/parts";

export const Route = createFileRoute("/upload")({
  head: () => ({
    meta: [
      { title: "Upload a part file — Scarpa" },
      {
        name: "description",
        content:
          "Share an STL or STEP file for a rare, non-safety-critical car part, with fitment details and your writeup on how you solved it.",
      },
      { property: "og:title", content: "Upload a part file — Scarpa" },
      {
        property: "og:description",
        content: "Contribute an STL or STEP file and the story of how you solved the problem.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: UploadPage,
});

const emptyVehicle = (): Vehicle => ({ make: "", model: "", yearFrom: "", yearTo: "" });

const labelCls = "tech-label block";
const fieldCls =
  "mt-2 w-full rounded-sm border border-input bg-card px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-ring focus:ring-2 focus:ring-ring/25";

function UploadPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [uploader, setUploader] = useState("");
  const [category, setCategory] = useState<Category>("bracket");
  const [vehicles, setVehicles] = useState<Vehicle[]>([emptyVehicle()]);
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [licensed, setLicensed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const updateVehicle = (i: number, patch: Partial<Vehicle>) =>
    setVehicles((vs) => vs.map((v, idx) => (idx === i ? { ...v, ...patch } : v)));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!licensed) return;
    if (!file) {
      toast.error("Attach an STL or STEP file.");
      return;
    }
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!["stl", "step", "stp"].includes(ext)) {
      toast.error("Only STL and STEP files are accepted.");
      return;
    }
    const cleanVehicles = vehicles.filter((v) => v.make.trim() || v.model.trim());
    if (cleanVehicles.length === 0) {
      toast.error("Add at least one vehicle this part fits.");
      return;
    }

    setSubmitting(true);
    try {
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("part-files").upload(path, file, {
        contentType: file.type || "application/octet-stream",
      });
      if (upErr) throw upErr;

      const { error } = await supabase.from("parts").insert({
        name: name.trim(),
        description: description.trim(),
        category,
        vehicles: cleanVehicles,
        notes: notes.trim() || null,
        uploader_name: uploader.trim() || null,
        file_path: path,
        file_name: file.name,
        file_size: file.size,
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
            We check that the part is non-safety-critical and that the fitment details make sense.
            Once approved it appears in the public library.
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
          Brackets, housings, covers and trim only. No brakes, suspension, structural components or
          fuel-system parts.
        </p>

        <form onSubmit={handleSubmit} className="mt-12 space-y-10">
          <fieldset className="space-y-6">
            <legend className="tech-label mb-4 text-brass">01 — The part</legend>
            <div>
              <label className={labelCls} htmlFor="name">
                Part name
              </label>
              <input
                id="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="HVAC vent slider clip"
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
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="tech-label mb-4 text-brass">02 — Fitment</legend>
            {vehicles.map((v, i) => (
              <div
                key={i}
                className="grid gap-3 rounded-sm border border-border bg-card p-4 sm:grid-cols-[1fr_1fr_5rem_5rem_auto]"
              >
                <input
                  aria-label="Make"
                  value={v.make}
                  onChange={(e) => updateVehicle(i, { make: e.target.value })}
                  placeholder="Make"
                  className={fieldCls + " mt-0"}
                />
                <input
                  aria-label="Model"
                  value={v.model}
                  onChange={(e) => updateVehicle(i, { model: e.target.value })}
                  placeholder="Model"
                  className={fieldCls + " mt-0"}
                />
                <input
                  aria-label="Year from"
                  value={v.yearFrom}
                  onChange={(e) => updateVehicle(i, { yearFrom: e.target.value })}
                  placeholder="1989"
                  className={fieldCls + " mt-0 font-mono"}
                />
                <input
                  aria-label="Year to"
                  value={v.yearTo}
                  onChange={(e) => updateVehicle(i, { yearTo: e.target.value })}
                  placeholder="1994"
                  className={fieldCls + " mt-0 font-mono"}
                />
                {vehicles.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setVehicles((vs) => vs.filter((_, idx) => idx !== i))}
                    className="rounded-sm px-3 text-sm text-muted-foreground hover:text-destructive"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => setVehicles((vs) => [...vs, emptyVehicle()])}
              className="rounded-sm border border-dashed border-border px-4 py-2 text-sm text-muted-foreground hover:border-brass hover:text-brass-foreground"
            >
              + Add another vehicle
            </button>
          </fieldset>

          <fieldset className="space-y-6">
            <legend className="tech-label mb-4 text-brass">03 — File & writeup</legend>
            <div>
              <label className={labelCls} htmlFor="file">
                File (STL or STEP)
              </label>
              <input
                id="file"
                type="file"
                required
                accept=".stl,.step,.stp,model/stl,application/step"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className={
                  fieldCls +
                  " file:mr-4 file:rounded-sm file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:text-secondary-foreground"
                }
              />
            </div>
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
                Your name or handle (optional)
              </label>
              <input
                id="uploader"
                value={uploader}
                onChange={(e) => setUploader(e.target.value)}
                className={fieldCls}
              />
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
                I created this file or have the right to share it, and I grant Scarpa a license to
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
          </div>

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={!licensed || submitting}
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
