import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Zenthi — Rare parts. Real fixes. Built from scratch." },
      {
        name: "description",
        content:
          "Where car part innovation happens — rare fixes, retrofits, and hard-to-find parts for any car, from high-performance builds to everyday discontinued bits.",
      },
      { property: "og:title", content: "Zenthi — Rare parts. Real fixes. Built from scratch." },
      {
        property: "og:description",
        content:
          "Where car part innovation happens — rare fixes, retrofits, and hard-to-find parts for any car, from high-performance builds to everyday discontinued bits.",
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
    body: "A cracked HVAC vent clip on an old 911. A dead sensor housing on a Diablo. A snapped washer fluid splitter on a Bronco. A better bracket for a Civic. Somebody already modelled a replacement.",
  },
  {
    no: "02",
    title: "It gets shared here",
    body: "Upload a CAD model, 3D scan, cutting profile, or 2D drawing — STEP is recommended for edits, but the library accepts multiple formats. Add fitment details and a writeup so the next person knows exactly what they're looking at.",
  },
  {
    no: "03",
    title: "It stays findable",
    body: "Reviewed, catalogued by make, model and year range, and free to download forever — not buried on page 14 of a thread. Files aren't just for printing either: they're a reference you can measure, study and reverse-engineer a part from.",

  },
];

function Index() {
  return (
    <SiteShell>
      <section className="blueprint-grid border-b border-border">
        <div className="mx-auto w-full max-w-6xl px-5 py-24 sm:py-32">
          <p className="tech-label">Open library · Rev. 01</p>
          <h1 className="mt-6 max-w-4xl font-display text-4xl leading-[1.08] font-semibold tracking-tight text-foreground sm:text-6xl">
            Rare parts. Real fixes. Built from scratch.
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Where car part innovation happens — rare fixes, retrofits, and hard-to-find parts for
            any car. The hardest, most inventive fixes usually come from high-performance and exotic
            builds pushing into territory nobody else supports — measuring the broken bracket,
            modelling it at 2am, printing five revisions until it clicks in. Zenthi is just as much
            for the small stuff: a discontinued washer fluid splitter or a clip you can't find
            anywhere is just as welcome as a Lamborghini retrofit. This is where those fixes live
            instead of disappearing into old forum threads.
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
            BMW · PORSCHE · MAZDA · TOYOTA · FERRARI · AND MORE
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
            If you can't find it, it probably belongs here.
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Pretty much anything car-related that someone else might need someday: brackets, covers,
            clips, housings, adapters, trim, and weird one-offs. Mods, retrofits, upgrades, and
            everyday fixes are all welcome — from a Bronco's broken washer splitter to a Lamborghini
            retrofit nobody else makes. The only hard rule is safety: printed polymer has no business
            holding a car together or containing fuel. Use files for fitment and reference only, and
            verify fit, material, and safety yourself before any real-world use.
          </p>
          <div className="mt-6 max-w-3xl rounded-sm border border-brass/30 bg-brass/5 p-4">
            <p className="text-xs leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground">A note on brand coverage:</span>{" "}
              Honda/Acura and Stellantis-brand vehicles (Chrysler, Dodge, Jeep, Ram, Fiat, Alfa
              Romeo, Maserati, Peugeot, Citroën, Opel, Vauxhall, Lancia) currently aren't supported.
              These manufacturers have a documented history of aggressive legal takedown action
              against community fitment files, even ones with no logo or trademark use — we'd rather
              not put contributors at risk.
            </p>
          </div>
        </div>
      </section>

    </SiteShell>
  );
}
