import { useState } from "react";
import { toast } from "sonner";
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
  isRestrictedMake,
  RESTRICTED_MAKE_MESSAGE,
  type AftermarketPartNumber,
  type Vehicle,

} from "@/lib/parts";
import {
  deletePartAsUploader,
  updatePartAsUploader,
  verifyUploader,
} from "@/lib/parts.functions";

export type EditablePart = {
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
  notes: string | null;
  uploader_name: string | null;
};

const labelCls = "tech-label block";
const fieldCls =
  "mt-2 w-full rounded-sm border border-input bg-card px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-ring focus:ring-2 focus:ring-ring/25";
const MISMATCH = "This doesn't match the uploader on record for this part.";

function Shell({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-foreground/50 p-4 py-10"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-sm border border-border bg-background p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="tech-label">{subtitle}</p>
            <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-sm px-3 py-1 text-sm text-muted-foreground hover:text-foreground"
          >
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function UploaderEditDialog({
  part,
  onClose,
  onSaved,
}: {
  part: EditablePart;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [claim, setClaim] = useState("");
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [name, setName] = useState(part.name);
  const [description, setDescription] = useState(part.description ?? "");
  const [category, setCategory] = useState(part.category);
  const [referenceOnly, setReferenceOnly] = useState(!!part.reference_only);
  const [placement, setPlacement] = useState(part.placement ?? "");
  const [material, setMaterial] = useState(part.material ?? "");
  const [thickness, setThickness] = useState(part.thickness_infill ?? "");
  const [oemNumbers, setOemNumbers] = useState(part.oem_part_numbers ?? "");
  const [aftermarket, setAftermarket] = useState<AftermarketPartNumber[]>(
    part.aftermarket_part_numbers?.length
      ? part.aftermarket_part_numbers
      : [{ brand: "", number: "" }],
  );
  const [notes, setNotes] = useState(part.notes ?? "");
  const [types, setTypes] = useState<string[]>(
    Array.isArray(part.contributor_type) ? part.contributor_type : [],
  );
  const [vehicles, setVehicles] = useState<Vehicle[]>(
    part.vehicles.length ? part.vehicles : [emptyVehicle()],
  );


  async function check(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await verifyUploader({ data: { id: part.id, uploaderName: claim } });
      if (res.ok) setVerified(true);
      else setError(MISMATCH);
    } catch {
      setError("Could not verify right now. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const cleanVehicles = vehicles.filter((v) => v.make.trim() || v.model.trim());
    if (cleanVehicles.some((v) => isRestrictedMake(v.make))) {
      toast.error(RESTRICTED_MAKE_MESSAGE);
      return;
    }
    if (cleanVehicles.some((v) => !v.make.trim() || !v.model.trim())) {
      toast.error("Every vehicle needs at least a make and a model.");
      return;
    }
    setBusy(true);
    setError(null);
    try {

      const res = await updatePartAsUploader({
        data: {
          id: part.id,
          uploaderName: claim,
          name: name.trim(),
          description: description.trim(),
          category,
          reference_only: referenceOnly,
          placement: placement.trim() || null,
          material: material.trim() || null,
          thickness_infill: thickness.trim() || null,
          contributor_type: types,
          vehicles: cleanVehicles,
          oem_part_numbers: oemNumbers.trim() || null,
          aftermarket_part_numbers: aftermarket.filter((r) => r.brand.trim() || r.number.trim()),
          notes: notes.trim() || null,
        },
      });
      if (!res.ok) {
        setError(MISMATCH);
        setVerified(false);
        return;
      }
      toast.success("Part updated.");
      onSaved();
    } catch {
      setError("Could not save changes.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell title={part.name} subtitle="Edit your part" onClose={onClose}>
      {!verified ? (
        <form className="mt-6 space-y-5" onSubmit={check}>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Only the uploader can edit this part. Enter the exact name or handle you submitted it
            with.
          </p>
          <div>
            <label className={labelCls} htmlFor="owner-edit-claim">
              Uploader name or handle
            </label>
            <input
              id="owner-edit-claim"
              required
              value={claim}
              onChange={(e) => setClaim(e.target.value)}
              className={fieldCls}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex items-center gap-3 border-t border-border pt-5">
            <button
              type="submit"
              disabled={busy}
              className="inline-flex h-11 items-center rounded-sm bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {busy ? "Checking…" : "Continue"}
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
      ) : (
        <form className="mt-6 space-y-5" onSubmit={save}>
          <div>
            <label className={labelCls} htmlFor="owner-name">
              Part name
            </label>
            <input
              id="owner-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={fieldCls}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="owner-description">
              Description
            </label>
            <textarea
              id="owner-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={fieldCls}
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className={labelCls} htmlFor="owner-category">
                Category
              </label>
              <select
                id="owner-category"
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
              <label className={labelCls} htmlFor="owner-placement">
                Recommended placement
              </label>
              <input
                id="owner-placement"
                value={placement}
                onChange={(e) => setPlacement(e.target.value)}
                className={fieldCls}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="owner-material">
                Recommended material
              </label>
              <input
                id="owner-material"
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                className={fieldCls}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="owner-thickness">
                Recommended thickness / infill
              </label>
              <input
                id="owner-thickness"
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
              <VehicleFitmentFields
                vehicles={vehicles}
                onChange={setVehicles}
                idPrefix="owner"
                validateMakes

              />
            </div>
          </div>

          <div>
            <label className={labelCls} htmlFor="owner-oem">
              OEM part number(s)
            </label>
            <input
              id="owner-oem"
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

          <div>
            <label className={labelCls} htmlFor="owner-notes">
              Uploader's writeup
            </label>
            <textarea
              id="owner-notes"
              rows={5}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={fieldCls}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex items-center gap-3 border-t border-border pt-5">
            <button
              type="submit"
              disabled={busy}
              className="inline-flex h-11 items-center rounded-sm bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {busy ? "Saving…" : "Save changes"}
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
      )}
    </Shell>
  );
}

export function UploaderDeleteDialog({
  part,
  onClose,
  onDeleted,
}: {
  part: { id: string; name: string };
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [claim, setClaim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function remove() {
    setBusy(true);
    setError(null);
    try {
      const res = await deletePartAsUploader({ data: { id: part.id, uploaderName: claim } });
      if (!res.ok) {
        setError(MISMATCH);
        setConfirming(false);
        return;
      }
      toast.success("Part deleted.");
      onDeleted();
    } catch {
      setError("Could not delete this part. Try again.");
      setConfirming(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell title={part.name} subtitle="Delete your part" onClose={onClose}>
      <form
        className="mt-6 space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          setConfirming(true);
        }}
      >
        <p className="text-sm leading-relaxed text-muted-foreground">
          Only the uploader can delete this part. Enter the exact name or handle you submitted it
          with.
        </p>
        <div>
          <label className={labelCls} htmlFor="owner-delete-claim">
            Uploader name or handle
          </label>
          <input
            id="owner-delete-claim"
            required
            value={claim}
            onChange={(e) => setClaim(e.target.value)}
            className={fieldCls}
            disabled={confirming}
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}

        {confirming ? (
          <div className="space-y-4 rounded-sm border border-destructive/40 bg-destructive/5 p-4">
            <p className="text-sm text-foreground">
              Are you sure you want to delete this file? This can't be undone.
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={busy}
                className="inline-flex h-11 items-center rounded-sm border border-border px-6 text-sm font-medium hover:bg-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={remove}
                disabled={busy}
                className="inline-flex h-11 items-center rounded-sm border border-destructive/40 px-6 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
              >
                {busy ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 border-t border-border pt-5">
            <button
              type="submit"
              className="inline-flex h-11 items-center rounded-sm border border-destructive/40 px-6 text-sm font-medium text-destructive hover:bg-destructive/10"
            >
              Continue
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 items-center rounded-sm border border-border px-6 text-sm font-medium hover:bg-secondary"
            >
              Cancel
            </button>
          </div>
        )}
      </form>
    </Shell>
  );
}
