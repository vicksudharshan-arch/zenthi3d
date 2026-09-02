import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Zenthi — 3D-printable parts for cars nobody else supports" },
      {
        name: "description",
        content:
          "A free community library of 3D-printable brackets, housings, covers and trim for exotic and high-performance cars. Share the fix instead of losing it in a forum thread.",
      },
      { property: "og:title", content: "Zenthi — a shared library of 3D-printable car parts" },
      {
        property: "og:description",
        content:
          "Community-shared STEP files for rare, non-safety-critical car parts. Browse the library or upload your own fix.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const STEPS = [
  {
    no: "01",
    title: "Someone solves it",
    body: "A cracked HVAC vent clip on a 964. A dead sensor housing on a Diablo. Somebody already modelled a replacement.",
  },
  {
    no: "02",
    title: "It gets shared here",
    body: "STEP only — an editable CAD file goes straight to a machine shop or gets modified for a different fit. Add fitment details and the writeup.",
  },
  {
    no: "03",
    title: "It stays findable",
    body: "Reviewed, catalogued by make, model and year range, and free to download forever — not buried on page 14 of a thread.",
  },
];

function Index() {
  return (
    <SiteShell>
      <section className="blueprint-grid border-b border-border">
        <div className="mx-auto w-full max-w-6xl px-5 py-24 sm:py-32">
          <p className="tech-label">Open archive · Rev. 01</p>
          <h1 className="mt-6 max-w-4xl font-display text-4xl leading-[1.08] font-semibold tracking-tight text-foreground sm:text-6xl">
            A shared library of 3D-printable parts for cars nobody else supports.
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Enthusiasts already figure out how to adapt and fabricate rare parts for exotic and
            high-performance cars — measuring the broken bracket, modelling it at 2am, printing five
            revisions until it clicks in. Zenthi is a place to share those solved problems, instead
            of losing them in old forum threads.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link
              to="/library"
              className="inline-flex h-11 items-center rounded-sm bg-primary px-6 text-sm font-medium tracking-wide text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Browse the library
            </Link>
            <Link
              to="/upload"
              className="inline-flex h-11 items-center rounded-sm border border-brass bg-brass/10 px-6 text-sm font-medium tracking-wide text-brass-foreground transition-colors hover:bg-brass/20"
            >
              Upload a file
            </Link>
          </div>
          <p className="mt-8 font-mono text-xs text-muted-foreground">
            PORSCHE · LAMBORGHINI · FERRARI · MASERATI · ALFA ROMEO · LOTUS · DE TOMASO AND MORE
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 py-20">
        <h2 className="font-display text-2xl font-semibold tracking-tight">How it works</h2>
        <div className="mt-10 grid gap-px overflow-hidden rounded-sm border border-border bg-border sm:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.no} className="bg-card p-7">
              <span className="font-mono text-xs tracking-widest text-brass">{s.no}</span>
              <h3 className="mt-3 font-display text-xl font-semibold">{s.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 pb-4">
        <div className="rounded-sm border border-border bg-card p-8">
          <p className="tech-label">Scope</p>
          <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight">
            Cosmetic and functional, never structural.
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Zenthi accepts brackets, housings, covers and trim. It does not accept brakes,
            suspension, structural components or fuel-system parts — printed polymer has no business
            holding a car together or containing fuel. Submissions in those categories are rejected
            in review.
          </p>
        </div>
      </section>
    </SiteShell>
  );
}
