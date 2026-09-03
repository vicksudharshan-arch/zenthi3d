import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { SiteShell } from "@/components/site-shell";
import {
  AftermarketNumberFields,
  VehicleFitmentFields,
} from "@/components/vehicle-fitment-fields";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  CONTRIBUTOR_TYPES,
  CONTRIBUTOR_TYPE_LABELS,
  emptyVehicle,
  parseAftermarket,
  vehicleDetailLabel,
  vehicleLabel,
  type Category,
  type Vehicle,
} from "@/lib/parts";
import {
  deleteParts,
  listAllParts,
  setPartStatus,
  updatePart,
  type PartRow,
} from "@/lib/parts.functions";
import { getAdminGateState, lockAdmin, unlockAdmin } from "@/lib/admin-gate.functions";
import { listCopyrightReports, setCopyrightReportStatus } from "@/lib/copyright.functions";


export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Review queue — Zenthi" },
      {
        name: "description",
        content: "Internal review queue for approving or rejecting submitted Zenthi part files.",
      },
      { property: "og:title", content: "Review queue — Zenthi" },
      { property: "og:description", content: "Approve or reject submitted part files." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminGate,
});

function AdminGate() {
  const qc = useQueryClient();
  const [passcode, setPasscode] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "gate"],
    queryFn: () => getAdminGateState(),
  });

  const unlock = useMutation({
    mutationFn: () => unlockAdmin({ data: { passcode } }),
    onSuccess: (res) => {
      if (res.ok) {
        setPasscode("");
        qc.invalidateQueries({ queryKey: ["admin", "gate"] });
      } else if (!res.configured) {
        toast.error("No admin passcode is configured yet.");
      } else {
        toast.error("Incorrect passcode.");
      }
    },
    onError: () => toast.error("Could not verify the passcode."),
  });

  if (isLoading) {
    return (
      <SiteShell>
        <div className="mx-auto max-w-md px-6 py-24 font-mono text-sm text-muted-foreground">
          Checking access…
        </div>
      </SiteShell>
    );
  }

  if (!data?.unlocked) {
    return (
      <SiteShell>
        <div className="mx-auto max-w-md px-6 py-24">
          <p className="tech-label text-brass">Restricted</p>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight">Review queue</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Enter the shared admin passcode to view and manage submissions.
          </p>
          {data && !data.configured && (
            <p className="mt-4 rounded-sm border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              No admin passcode is configured in the database yet.
            </p>
          )}
          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (passcode) unlock.mutate();
            }}
          >
            <div>
              <label className={labelCls} htmlFor="passcode">
                Admin passcode
              </label>
              <input
                id="passcode"
                type="password"
                autoComplete="current-password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className={fieldCls}
              />
            </div>
            <button
              type="submit"
              disabled={!passcode || unlock.isPending}
              className="inline-flex h-11 items-center rounded-sm bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
            >
              {unlock.isPending ? "Checking…" : "Unlock"}
            </button>
          </form>
        </div>
      </SiteShell>
    );
  }

  return <AdminPage />;
}

const TABS = ["pending", "approved", "rejected"] as const;

const labelCls = "tech-label block";
const fieldCls =
  "mt-2 w-full rounded-sm border border-input bg-card px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-ring focus:ring-2 focus:ring-ring/25";

function AdminPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("pending");
  const [selected, setSelected] = useState<string[]>([]);
  const [editing, setEditing] = useState<PartRow | null>(null);
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

  const removal = useMutation({
    mutationFn: (ids: string[]) => deleteParts({ data: { ids } }),
    onSuccess: (_d, ids) => {
      toast.success(`Deleted ${ids.length} submission${ids.length === 1 ? "" : "s"}.`);
      setSelected((s) => s.filter((id) => !ids.includes(id)));
      qc.invalidateQueries({ queryKey: ["parts"] });
    },
    onError: () => toast.error("Delete failed."),
  });

  const parts = (data ?? []).filter((p) => p.status === tab);
  const selectedHere = parts.filter((p) => selected.includes(p.id));
  const allSelected = parts.length > 0 && selectedHere.length === parts.length;

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const toggleAll = () =>
    setSelected((s) =>
      allSelected
        ? s.filter((id) => !parts.some((p) => p.id === id))
        : Array.from(new Set([...s, ...parts.map((p) => p.id)])),
    );

  function confirmDelete(ids: string[]) {
    const msg =
      ids.length === 1
        ? "Delete this submission and its file? This cannot be undone."
        : `Delete ${ids.length} submissions and their files? This cannot be undone.`;
    if (window.confirm(msg)) removal.mutate(ids);
  }

  return (
    <SiteShell>
      <div className="mx-auto w-full max-w-5xl px-5 py-16">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="tech-label">Internal</p>
            <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight">
              Review queue
            </h1>
          </div>
          <button
            onClick={async () => {
              await lockAdmin();
              qc.invalidateQueries({ queryKey: ["admin", "gate"] });
            }}
            className="h-9 rounded-sm border border-border px-4 text-sm font-medium hover:bg-secondary"
          >
            Lock
          </button>
        </div>


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

        {parts.length > 0 && (
          <div className="mt-6 flex flex-wrap items-center gap-4 rounded-sm border border-border bg-card px-4 py-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                className="size-4 accent-[var(--primary)]"
              />
              Select all
            </label>
            <span className="font-mono text-xs text-muted-foreground">
              {selectedHere.length} selected
            </span>
            <button
              disabled={selectedHere.length === 0 || removal.isPending}
              onClick={() => confirmDelete(selectedHere.map((p) => p.id))}
              className="ml-auto h-9 rounded-sm border border-destructive/40 px-4 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Delete selected
            </button>
          </div>
        )}

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
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      aria-label={`Select ${p.name}`}
                      checked={selected.includes(p.id)}
                      onChange={() => toggle(p.id)}
                      className="mt-1.5 size-4 accent-[var(--primary)]"
                    />
                    <div>
                      <h2 className="flex flex-wrap items-center gap-2 font-display text-xl font-semibold">
                        {p.name}
                        {p.reference_only && <ReferenceOnlyBadge />}
                      </h2>
                      <p className="mt-1 font-mono text-xs text-muted-foreground">
                        {CATEGORY_LABELS[p.category as Category] ?? p.category} ·{" "}
                        {[
                          p.step_file_name,
                          p.stl_file_name,
                          ...parseExtraFiles(p.extra_files).map((f) => f.name),
                        ]
                          .filter(Boolean)
                          .join(" · ")}{" "}
                        · {new Date(p.created_at).toLocaleDateString()}
                        {p.uploader_name ? ` · ${p.uploader_name}` : ""}
                      </p>
                      <div className="mt-2">
                        <FormatBadges part={p} />
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
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
                    <button
                      onClick={() => setEditing(p)}
                      className="h-9 rounded-sm border border-brass px-4 text-sm font-medium text-brass-foreground hover:bg-brass/15"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => confirmDelete([p.id])}
                      className="h-9 rounded-sm border border-destructive/40 px-4 text-sm font-medium text-destructive hover:bg-destructive/10"
                    >
                      Delete
                    </button>
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

        <CopyrightReports />
      </div>


      {editing && (
        <EditDialog
          part={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            qc.invalidateQueries({ queryKey: ["parts"] });
          }}
        />
      )}
    </SiteShell>
  );
}

function CopyrightReports() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["copyright-reports"],
    queryFn: () => listCopyrightReports(),
  });

  const resolve = useMutation({
    mutationFn: (vars: { id: string; status: "open" | "resolved" }) =>
      setCopyrightReportStatus({ data: vars }),
    onSuccess: () => {
      toast.success("Report updated.");
      qc.invalidateQueries({ queryKey: ["copyright-reports"] });
    },
    onError: () => toast.error("Update failed."),
  });

  const reports = data ?? [];

  return (
    <section className="mt-20 border-t border-border pt-10">
      <p className="tech-label">Legal</p>
      <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight">
        Copyright reports ({reports.length})
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Reports submitted through the public copyright policy page. Use the review queue above to
        delete a submission if a report is warranted.
      </p>

      {isLoading ? (
        <p className="mt-8 font-mono text-sm text-muted-foreground">Loading…</p>
      ) : reports.length === 0 ? (
        <p className="mt-8 font-mono text-sm text-muted-foreground">No reports submitted.</p>
      ) : (
        <div className="mt-6 space-y-4">
          {reports.map((r) => (
            <article key={r.id} className="rounded-sm border border-border bg-card p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-lg font-semibold">{r.part_reference}</h3>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    {r.reporter_name} · {r.reporter_email} ·{" "}
                    {new Date(r.created_at).toLocaleDateString()} · {r.status}
                  </p>
                </div>
                <button
                  onClick={() =>
                    resolve.mutate({
                      id: r.id,
                      status: r.status === "resolved" ? "open" : "resolved",
                    })
                  }
                  className="h-9 rounded-sm border border-border px-4 text-sm font-medium hover:bg-secondary"
                >
                  {r.status === "resolved" ? "Reopen" : "Mark resolved"}
                </button>
              </div>
              <p className="mt-4 text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                {r.concern}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function EditDialog({

  part,
  onClose,
  onSaved,
}: {
  part: PartRow;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(part.name);
  const [description, setDescription] = useState(part.description ?? "");
  const [category, setCategory] = useState(part.category);
  const [referenceOnly, setReferenceOnly] = useState(!!part.reference_only);
  const [placement, setPlacement] = useState(part.placement ?? "");
  const [material, setMaterial] = useState(part.material ?? "");
  const [thickness, setThickness] = useState(part.thickness_infill ?? "");
  const [oemNumbers, setOemNumbers] = useState(part.oem_part_numbers ?? "");
  const [aftermarket, setAftermarket] = useState(
    parseAftermarket(part.aftermarket_part_numbers).length
      ? parseAftermarket(part.aftermarket_part_numbers)
      : [{ brand: "", number: "" }],
  );
  const [uploader, setUploader] = useState(part.uploader_name ?? "");
  const [notes, setNotes] = useState(part.notes ?? "");
  const [types, setTypes] = useState<string[]>(
    Array.isArray(part.contributor_type) ? part.contributor_type : [],
  );
  const [vehicles, setVehicles] = useState<Vehicle[]>(
    part.vehicles.length ? part.vehicles : [emptyVehicle()],
  );

  const save = useMutation({
    mutationFn: () =>
      updatePart({
        data: {
          id: part.id,
          name: name.trim(),
          description: description.trim(),
          category,
          reference_only: referenceOnly,
          placement: placement.trim() || null,
          material: material.trim() || null,
          thickness_infill: thickness.trim() || null,
          contributor_type: types,
          vehicles: vehicles.filter((v) => v.make.trim() || v.model.trim()),
          oem_part_numbers: oemNumbers.trim() || null,
          aftermarket_part_numbers: aftermarket.filter((r) => r.brand.trim() || r.number.trim()),
          notes: notes.trim() || null,
          uploader_name: uploader.trim() || null,
        },
      }),
    onSuccess: () => {
      toast.success("Submission updated.");
      onSaved();
    },
    onError: () => toast.error("Could not save changes."),
  });


  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-foreground/50 p-4 py-10"
      role="dialog"
      aria-modal="true"
      aria-label={`Edit ${part.name}`}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-sm border border-border bg-background p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="tech-label">Edit submission</p>
            <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight">{part.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-sm px-3 py-1 text-sm text-muted-foreground hover:text-foreground"
          >
            Close
          </button>
        </div>

        <form
          className="mt-6 space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
        >
          <div>
            <label className={labelCls} htmlFor="edit-name">
              Part name
            </label>
            <input
              id="edit-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={fieldCls}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="edit-description">
              Description
            </label>
            <textarea
              id="edit-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={fieldCls}
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className={labelCls} htmlFor="edit-category">
                Category
              </label>
              <select
                id="edit-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={fieldCls}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls} htmlFor="edit-placement">
                Recommended placement
              </label>
              <input
                id="edit-placement"
                value={placement}
                onChange={(e) => setPlacement(e.target.value)}
                className={fieldCls}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="edit-material">
                Recommended material
              </label>
              <input
                id="edit-material"
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                className={fieldCls}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="edit-thickness">
                Recommended thickness / infill
              </label>
              <input
                id="edit-thickness"
                value={thickness}
                onChange={(e) => setThickness(e.target.value)}
                className={fieldCls}
              />
            </div>
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
          </div>

          <div>
            <span className={labelCls}>Fitment</span>
            <div className="mt-2">
              <VehicleFitmentFields vehicles={vehicles} onChange={setVehicles} idPrefix="admin" />
            </div>
          </div>

          <div>
            <label className={labelCls} htmlFor="edit-oem">
              OEM part number(s)
            </label>
            <input
              id="edit-oem"
              value={oemNumbers}
              onChange={(e) => setOemNumbers(e.target.value)}
              placeholder="Comma-separated"
              className={fieldCls + " font-mono"}
            />
          </div>

          <div>
            <span className={labelCls}>Aftermarket part number(s)</span>
            <AftermarketNumberFields rows={aftermarket} onChange={setAftermarket} />
          </div>


          <div>
            <span className={labelCls}>Contributor tags</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {CONTRIBUTOR_TYPES.map((t) => {
                const active = types.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={active}
                    onClick={() =>
                      setTypes((ts) => (active ? ts.filter((x) => x !== t) : [...ts, t]))
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
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className={labelCls} htmlFor="edit-uploader">
                Uploader name or handle
              </label>
              <input
                id="edit-uploader"
                value={uploader}
                onChange={(e) => setUploader(e.target.value)}
                className={fieldCls}
              />
            </div>
          </div>

          <div>
            <label className={labelCls} htmlFor="edit-notes">
              Uploader's writeup
            </label>
            <textarea
              id="edit-notes"
              rows={5}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={fieldCls}
            />
          </div>

          <div className="flex items-center gap-3 border-t border-border pt-5">
            <button
              type="submit"
              disabled={save.isPending}
              className="inline-flex h-11 items-center rounded-sm bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {save.isPending ? "Saving…" : "Save changes"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 items-center rounded-sm border border-border px-6 text-sm font-medium hover:bg-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
