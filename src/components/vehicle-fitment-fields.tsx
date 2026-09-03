import {
  DRIVETRAINS,
  RESTRICTED_MAKE_MESSAGE,
  emptyVehicle,
  isRestrictedMake,
  type Vehicle,
} from "@/lib/parts";
import type { ReactNode } from "react";

const labelCls = "tech-label block";
const fieldCls =
  "mt-2 w-full rounded-sm border border-input bg-card px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-ring focus:ring-2 focus:ring-ring/25";
const errorCls = "border-destructive focus:border-destructive focus:ring-destructive/25";
const helperCls = "mt-2 text-xs leading-relaxed text-muted-foreground";
const errorTextCls = "mt-2 text-xs leading-relaxed text-destructive";

/**
 * Shared fitment editor used by the public upload form, the uploader edit
 * dialog and the admin edit dialog so all three stay in sync.
 */
export function VehicleFitmentFields({
  vehicles,
  onChange,
  idPrefix = "fitment",
  makeHelperText,
  validateMakes = false,
}: {
  vehicles: Vehicle[];
  onChange: (next: Vehicle[]) => void;
  idPrefix?: string;
  makeHelperText?: ReactNode;
  validateMakes?: boolean;
}) {

  const update = (i: number, patch: Partial<Vehicle>) =>
    onChange(vehicles.map((v, idx) => (idx === i ? { ...v, ...patch } : v)));

  return (
    <div className="space-y-4">
      {vehicles.map((v, i) => (
        <div key={i} className="space-y-3 rounded-sm border border-border bg-card p-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr]">
            <input
              aria-label="Make"
              value={v.make}
              onChange={(e) => update(i, { make: e.target.value })}
              placeholder="Make"
              className={fieldCls + " mt-0"}
            />
            <input
              aria-label="Model"
              value={v.model}
              onChange={(e) => update(i, { model: e.target.value })}
              placeholder="Model"
              className={fieldCls + " mt-0"}
            />
          </div>
          <div>
            <span className={labelCls + " mb-1 text-xs"}>Year range</span>
            <div className="grid grid-cols-2 gap-3">
              <input
                aria-label="Year from"
                value={v.yearFrom}
                onChange={(e) => update(i, { yearFrom: e.target.value })}
                placeholder="Year from"
                className={fieldCls + " mt-0 font-mono"}
              />
              <input
                aria-label="Year to"
                value={v.yearTo}
                onChange={(e) => update(i, { yearTo: e.target.value })}
                placeholder="Year to"
                className={fieldCls + " mt-0 font-mono"}
              />
            </div>
          </div>
          <div>
            <span className={labelCls + " mb-1 text-xs"}>
              Engine &amp; drivetrain (optional — matters for swapped builds)
            </span>
            <div className="grid gap-3 sm:grid-cols-3">
              <input
                aria-label="Engine manufacturer"
                value={v.engineMake ?? ""}
                onChange={(e) => update(i, { engineMake: e.target.value })}
                placeholder="Engine manufacturer"
                className={fieldCls + " mt-0"}
              />
              <input
                aria-label="Engine series or family"
                value={v.engineSeries ?? ""}
                onChange={(e) => update(i, { engineSeries: e.target.value })}
                placeholder="Engine series / family"
                className={fieldCls + " mt-0"}
              />
              <input
                aria-label="Engine size or displacement"
                value={v.displacement ?? ""}
                onChange={(e) => update(i, { displacement: e.target.value })}
                placeholder='Displacement — e.g. 5.3L'
                className={fieldCls + " mt-0"}
              />
              <input
                aria-label="Generation"
                value={v.generation ?? ""}
                onChange={(e) => update(i, { generation: e.target.value })}
                placeholder="Generation — e.g. Gen III"
                className={fieldCls + " mt-0"}
              />
              <select
                aria-label="Drivetrain"
                id={`${idPrefix}-drivetrain-${i}`}
                value={v.drivetrain ?? ""}
                onChange={(e) => update(i, { drivetrain: e.target.value })}
                className={fieldCls + " mt-0"}
              >
                <option value="">Drivetrain —</option>
                {DRIVETRAINS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {vehicles.length > 1 && (
            <button
              type="button"
              onClick={() => onChange(vehicles.filter((_, idx) => idx !== i))}
              className="rounded-sm text-sm text-muted-foreground hover:text-destructive"
            >
              Remove this vehicle
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...vehicles, emptyVehicle()])}
        className="rounded-sm border border-dashed border-border px-4 py-2 text-sm text-muted-foreground hover:border-brass hover:text-brass-foreground"
      >
        + Add another vehicle
      </button>
    </div>
  );
}

/** Shared editor for aftermarket brand + part-number rows. */
export function AftermarketNumberFields({
  rows,
  onChange,
}: {
  rows: { brand: string; number: string }[];
  onChange: (next: { brand: string; number: string }[]) => void;
}) {
  const update = (i: number, patch: Partial<{ brand: string; number: string }>) =>
    onChange(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  return (
    <div className="mt-2 space-y-3">
      {rows.map((r, i) => (
        <div key={i} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <input
            aria-label="Aftermarket brand or supplier"
            value={r.brand}
            onChange={(e) => update(i, { brand: e.target.value })}
            placeholder="Brand / supplier — e.g. Dorman"
            className={fieldCls + " mt-0"}
          />
          <input
            aria-label="Aftermarket part number"
            value={r.number}
            onChange={(e) => update(i, { number: e.target.value })}
            placeholder="Part number"
            className={fieldCls + " mt-0 font-mono"}
          />
          {rows.length > 1 && (
            <button
              type="button"
              onClick={() => onChange(rows.filter((_, idx) => idx !== i))}
              className="rounded-sm px-3 text-sm text-muted-foreground hover:text-destructive"
            >
              Remove
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...rows, { brand: "", number: "" }])}
        className="rounded-sm border border-dashed border-border px-4 py-2 text-sm text-muted-foreground hover:border-brass hover:text-brass-foreground"
      >
        + Add another part number
      </button>
    </div>
  );
}
