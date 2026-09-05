import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { SiteShell } from "@/components/site-shell";
import { AuthGate } from "@/components/auth-gate";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { DRIVETRAINS, RESTRICTED_MAKE_MESSAGE, isRestrictedMake } from "@/lib/parts";
import { reopenRequest, revealPrivateFulfillment } from "@/lib/requests.functions";

export const Route = createFileRoute("/requests")({
  head: () => ({
    meta: [
      { title: "Part requests — Zenthi" },
      {
        name: "description",
        content:
          "Post a request for a car part that needs scanning or modelling, or browse open requests from the community and fulfil one with your own file.",
      },
      { property: "og:title", content: "Part requests — Zenthi" },
      {
        property: "og:description",
        content: "An open board for car parts people need scanned or modelled.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RequestsPage,
});

const labelCls = "tech-label block";
const fieldCls =
  "mt-2 w-full rounded-sm border border-input bg-card px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-ring focus:ring-2 focus:ring-ring/25";

const FILE_TYPES = ["3D scan", "CAD file (STEP or similar)", "Either"] as const;

export const MONEY_DISCLAIMER =
  "Zenthi doesn't currently support financial transactions. If you and another user reach a financial agreement to fulfill a request, that needs to be handled privately, outside of Zenthi. We're not involved in and don't guarantee any such arrangements.";

type RequestRow = {
  id: string;
  requester_name: string;
  
  part_description: string;
  file_type_needed: string;
  make: string | null;
  model: string | null;
  year_from: string | null;
  year_to: string | null;
  engine_manufacturer: string | null;
  engine_series: string | null;
  engine_displacement: string | null;
  generation: string | null;
  drivetrain: string | null;
  bounty_amount: number | null;
  status: string;
  fulfilled_part_id: string | null;
  created_at: string;
};

const REQUEST_COLUMNS =
  "id,requester_name,part_description,file_type_needed,make,model,year_from,year_to,engine_manufacturer,engine_series,engine_displacement,generation,drivetrain,bounty_amount,status,fulfilled_part_id,created_at";

function fitmentLine(r: RequestRow) {
  const years = [r.year_from, r.year_to].filter(Boolean).join("–");
  return [r.make, r.model, years].filter(Boolean).join(" ");
}
function detailLine(r: RequestRow) {
  return [r.generation, r.engine_manufacturer, r.engine_series, r.engine_displacement, r.drivetrain]
    .filter(Boolean)
    .join(" · ");
}

function RequestsPage() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [description, setDescription] = useState("");
  const [fileType, setFileType] = useState<string>("Either");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const [engineMake, setEngineMake] = useState("");
  const [engineSeries, setEngineSeries] = useState("");
  const [displacement, setDisplacement] = useState("");
  const [generation, setGeneration] = useState("");
  const [drivetrain, setDrivetrain] = useState("");
  const [bounty, setBounty] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [statusFilter, setStatusFilter] = useState("all");
  const [makeFilter, setMakeFilter] = useState("all");
  const [modelFilter, setModelFilter] = useState("all");
  const [reopening, setReopening] = useState<RequestRow | null>(null);
  const [revealing, setRevealing] = useState<RequestRow | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("requests")
        .select(REQUEST_COLUMNS)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as RequestRow[];
    },
  });

  const requests = data ?? [];

  const fulfilledIds = requests
    .map((r) => r.fulfilled_part_id)
    .filter((id): id is string => !!id);

  // Only approved parts are readable publicly, so anything missing here is a
  // private fulfillment and must not be linked from the board.
  const { data: publicPartIds } = useQuery({
    queryKey: ["requests", "public-parts", fulfilledIds.join(",")],
    enabled: fulfilledIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parts")
        .select("id")
        .eq("status", "approved")
        .in("id", fulfilledIds);
      if (error) throw error;
      return (data ?? []).map((p) => p.id as string);
    },
  });
  const publicIds = new Set(publicPartIds ?? []);

  const makes = useMemo(
    () => Array.from(new Set(requests.map((r) => r.make?.trim()).filter(Boolean) as string[])).sort(),
    [requests],
  );
  const models = useMemo(
    () =>
      Array.from(
        new Set(
          requests
            .filter((r) => makeFilter === "all" || r.make === makeFilter)
            .map((r) => r.model?.trim())
            .filter(Boolean) as string[],
        ),
      ).sort(),
    [requests, makeFilter],
  );

  const visible = requests.filter(
    (r) =>
      (statusFilter === "all" || r.status === statusFilter) &&
      (makeFilter === "all" || r.make === makeFilter) &&
      (modelFilter === "all" || r.model === modelFilter),
  );

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!name.trim()) { toast.error("Add your name or handle."); return; }
    if (!description.trim()) { toast.error("Describe the part you need."); return; }
    if (isRestrictedMake(make)) { toast.error(RESTRICTED_MAKE_MESSAGE); return; }
    const bountyValue = bounty.trim() ? Number(bounty.trim()) : null;
    if (bountyValue !== null && (Number.isNaN(bountyValue) || bountyValue < 0))
      { toast.error("Bounty must be a positive number."); return; }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("requests").insert({
        requester_name: name.trim(),
        requester_contact: contact.trim() || null,
        part_description: description.trim(),
        file_type_needed: fileType,
        make: make.trim() || null,
        model: model.trim() || null,
        year_from: yearFrom.trim() || null,
        year_to: yearTo.trim() || null,
        engine_manufacturer: engineMake.trim() || null,
        engine_series: engineSeries.trim() || null,
        engine_displacement: displacement.trim() || null,
        generation: generation.trim() || null,
        drivetrain: drivetrain || null,
        bounty_amount: bountyValue,
        status: "open",
      });
      if (error) throw error;
      toast.success("Request posted.");
      setDescription("");
      setContact("");
      setBounty("");
      setMake("");
      setModel("");
      setYearFrom("");
      setYearTo("");
      setEngineMake("");
      setEngineSeries("");
      setDisplacement("");
      setGeneration("");
      setDrivetrain("");
      qc.invalidateQueries({ queryKey: ["requests"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SiteShell>
      <div className="mx-auto w-full max-w-4xl px-5 py-16">
        <p className="tech-label">Request board</p>
        <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight">
          Parts people need scanned or modelled
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Can't find a part anywhere and don't have the tools to make it? Post it here. Anyone with a
          scanner or CAD skills can pick it up and upload the file against your request.
        </p>

        <p className="mt-6 rounded-sm border border-border bg-secondary/50 p-4 text-xs leading-relaxed text-muted-foreground">
          {MONEY_DISCLAIMER}
        </p>

        <section className="mt-12 rounded-sm border border-border bg-card p-6 sm:p-8">
          <h2 className="font-display text-2xl font-semibold tracking-tight">Post a request</h2>
          <AuthGate
            title="Sign in to post a request"
            description="Requests are tied to an account so people fulfilling them know who asked, and so the board stays clean."
          >
          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="req-name" className={labelCls}>
                  Your name or handle
                </label>
                <input
                  id="req-name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={fieldCls}
                  placeholder="e.g. tunnelrat_87"
                />
              </div>
              <div>
                <label htmlFor="req-contact" className={labelCls}>
                  Contact (optional)
                </label>
                <input
                  id="req-contact"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className={fieldCls}
                  placeholder="Email or handle, so people can reach you"
                />
              </div>
            </div>

            <div>
              <label htmlFor="req-desc" className={labelCls}>
                What do you need?
              </label>
              <textarea
                id="req-desc"
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={fieldCls}
                placeholder="Describe the part, where it sits on the car, and anything you already know about it."
              />
            </div>

            <div>
              <label htmlFor="req-filetype" className={labelCls}>
                File type needed
              </label>
              <select
                id="req-filetype"
                value={fileType}
                onChange={(e) => setFileType(e.target.value)}
                className={fieldCls}
              >
                {FILE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-3 rounded-sm border border-border p-4">
              <span className={labelCls}>Vehicle fitment</span>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <input
                    aria-label="Make"
                    value={make}
                    onChange={(e) => setMake(e.target.value)}
                    placeholder="Make"
                    aria-invalid={isRestrictedMake(make) ? "true" : "false"}
                    className={
                      fieldCls +
                      " mt-0 " +
                      (isRestrictedMake(make)
                        ? "border-destructive focus:border-destructive focus:ring-destructive/25"
                        : "")
                    }
                  />
                  {isRestrictedMake(make) && (
                    <p className="mt-2 text-xs leading-relaxed text-destructive">
                      {RESTRICTED_MAKE_MESSAGE}
                    </p>
                  )}
                </div>
                <input
                  aria-label="Model"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="Model"
                  className={fieldCls + " mt-0"}
                />
              </div>
              <div>
                <span className={labelCls + " mb-1 text-xs"}>Year range</span>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    aria-label="Year from"
                    value={yearFrom}
                    onChange={(e) => setYearFrom(e.target.value)}
                    placeholder="Year from"
                    className={fieldCls + " mt-0 font-mono"}
                  />
                  <input
                    aria-label="Year to"
                    value={yearTo}
                    onChange={(e) => setYearTo(e.target.value)}
                    placeholder="Year to"
                    className={fieldCls + " mt-0 font-mono"}
                  />
                </div>
              </div>
              <div>
                <span className={labelCls + " mb-1 text-xs"}>
                  Engine &amp; drivetrain (optional)
                </span>
                <div className="grid gap-3 sm:grid-cols-3">
                  <input
                    aria-label="Engine manufacturer"
                    value={engineMake}
                    onChange={(e) => setEngineMake(e.target.value)}
                    placeholder="Engine manufacturer"
                    className={fieldCls + " mt-0"}
                  />
                  <input
                    aria-label="Engine series or family"
                    value={engineSeries}
                    onChange={(e) => setEngineSeries(e.target.value)}
                    placeholder="Engine series / family"
                    className={fieldCls + " mt-0"}
                  />
                  <input
                    aria-label="Engine size or displacement"
                    value={displacement}
                    onChange={(e) => setDisplacement(e.target.value)}
                    placeholder="Displacement — e.g. 5.3L"
                    className={fieldCls + " mt-0"}
                  />
                  <input
                    aria-label="Generation"
                    value={generation}
                    onChange={(e) => setGeneration(e.target.value)}
                    placeholder="Generation — e.g. Gen III"
                    className={fieldCls + " mt-0"}
                  />
                  <select
                    aria-label="Drivetrain"
                    value={drivetrain}
                    onChange={(e) => setDrivetrain(e.target.value)}
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
            </div>

            <div>
              <label htmlFor="req-bounty" className={labelCls}>
                Bounty (optional)
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-muted-foreground">
                  $
                </span>
                <input
                  id="req-bounty"
                  inputMode="decimal"
                  value={bounty}
                  onChange={(e) => setBounty(e.target.value)}
                  placeholder="0"
                  className={fieldCls + " pl-7 font-mono"}
                />
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Displayed as a number only — Zenthi never handles the money.
              </p>
            </div>

            <p className="rounded-sm border border-border bg-secondary/50 p-4 text-xs leading-relaxed text-muted-foreground">
              {MONEY_DISCLAIMER}
            </p>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-11 items-center rounded-sm bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              {submitting ? "Posting…" : "Post request"}
            </button>
          </form>
          </AuthGate>
        </section>

        <section className="mt-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-display text-2xl font-semibold tracking-tight">All requests</h2>
            <div className="flex flex-wrap gap-3">
              <select
                aria-label="Filter by status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={fieldCls + " mt-0 w-auto"}
              >
                <option value="all">All statuses</option>
                <option value="open">Open</option>
                <option value="fulfilled">Fulfilled</option>
              </select>
              <select
                aria-label="Filter by make"
                value={makeFilter}
                onChange={(e) => {
                  setMakeFilter(e.target.value);
                  setModelFilter("all");
                }}
                className={fieldCls + " mt-0 w-auto"}
              >
                <option value="all">All makes</option>
                {makes.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <select
                aria-label="Filter by model"
                value={modelFilter}
                onChange={(e) => setModelFilter(e.target.value)}
                className={fieldCls + " mt-0 w-auto"}
              >
                <option value="all">All models</option>
                {models.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isLoading ? (
            <p className="mt-8 text-sm text-muted-foreground">Loading requests…</p>
          ) : visible.length === 0 ? (
            <p className="mt-8 text-sm text-muted-foreground">No requests match those filters yet.</p>
          ) : (
            <ul className="mt-8 space-y-4">
              {visible.map((r) => (
                <li key={r.id} className="rounded-sm border border-border bg-card p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={
                        "tech-label rounded-sm px-2 py-1 text-xs " +
                        (r.status === "open"
                          ? "bg-secondary text-secondary-foreground"
                          : "bg-primary/10 text-foreground")
                      }
                    >
                      {r.status === "open" ? "Open" : "Fulfilled"}
                    </span>
                    <span className="tech-label rounded-sm bg-secondary px-2 py-1 text-xs text-secondary-foreground">
                      {r.file_type_needed}
                    </span>
                    {r.bounty_amount != null && (
                      <span className="tech-label rounded-sm bg-secondary px-2 py-1 font-mono text-xs text-secondary-foreground">
                        Bounty ${r.bounty_amount}
                      </span>
                    )}
                  </div>

                  <p className="mt-3 text-sm leading-relaxed text-foreground">
                    {r.part_description}
                  </p>

                  {(fitmentLine(r) || detailLine(r)) && (
                    <p className="mt-2 font-mono text-xs text-muted-foreground">
                      {[fitmentLine(r), detailLine(r)].filter(Boolean).join(" — ")}
                    </p>
                  )}

                  <p className="mt-2 text-xs text-muted-foreground">
                    Requested by {r.requester_name}
                  </p>

                  <ContactLine requestId={r.id} isAdmin={isAdmin} />


                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    {r.status === "open" ? (
                      <FulfillLink requestId={r.id} />
                    ) : (
                      <>
                        {r.fulfilled_part_id && publicIds.has(r.fulfilled_part_id) && (
                          <Link
                            to="/library/$partId"
                            params={{ partId: r.fulfilled_part_id }}
                            className="inline-flex h-9 items-center rounded-sm border border-border px-4 text-sm hover:bg-secondary"
                          >
                            View the part
                          </Link>
                        )}
                        {r.fulfilled_part_id && !publicIds.has(r.fulfilled_part_id) && (
                          <button
                            type="button"
                            onClick={() => setRevealing(r)}
                            className="inline-flex h-9 items-center rounded-sm border border-border px-4 text-sm hover:bg-secondary"
                          >
                            Private file — reveal download
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setReopening(r)}
                          className="inline-flex h-9 items-center rounded-sm border border-border px-4 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
                        >
                          Reopen request
                        </button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {reopening && (
        <ReopenDialog
          request={reopening}
          onClose={() => setReopening(null)}
          onDone={() => {
            setReopening(null);
            qc.invalidateQueries({ queryKey: ["requests"] });
          }}
        />
      )}
    </SiteShell>
  );
}

function FulfillLink({ requestId }: { requestId: string }) {
  const { session, loading } = useAuth();
  if (loading) return null;
  return session ? (
    <Link
      to="/upload"
      search={{ requestId }}
      className="inline-flex h-9 items-center rounded-sm bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
    >
      Fulfill this request
    </Link>
  ) : (
    <Link
      to="/auth"
      search={{ redirect: `/upload?requestId=${requestId}` }}
      className="inline-flex h-9 items-center rounded-sm bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
    >
      Sign in to fulfill this
    </Link>
  );
}

function ReopenDialog({
  request,
  onClose,
  onDone,
}: {
  request: RequestRow;
  onClose: () => void;
  onDone: () => void;
}) {
  const [claim, setClaim] = useState("");
  const [busy, setBusy] = useState(false);

  async function confirm(): Promise<void> {
    if (!claim.trim()) { toast.error("Enter the name you posted this request with."); return; }
    setBusy(true);
    try {
      const res = await reopenRequest({ data: { id: request.id, requesterName: claim } });
      if (!res.ok) {
        toast.error("That name doesn't match the one on this request.");
        return;
      }
      toast.success("Request reopened. The submitted part is untouched.");
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not reopen the request.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-5">
      <div className="w-full max-w-md rounded-sm border border-border bg-card p-6">
        <h3 className="font-display text-xl font-semibold tracking-tight">Reopen this request</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Only the person who posted it can reopen it. Enter the name you used. The part that was
          already submitted stays in the library.
        </p>
        <input
          value={claim}
          onChange={(e) => setClaim(e.target.value)}
          placeholder="Your name or handle"
          className={fieldCls}
        />
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center rounded-sm border border-border px-4 text-sm hover:bg-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={confirm}
            className="inline-flex h-10 items-center rounded-sm bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {busy ? "Reopening…" : "Reopen"}
          </button>
        </div>
      </div>
    </div>
  );
}
