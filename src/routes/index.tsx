import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Zenthi — Can't find it anywhere? Someone already fixed it." },
      {
        name: "description",
        content:
          "Community-shared car-part files for the stuff nobody else bothers making. Mods, retrofits, upgrades, and everyday fixes — from a Bronco to a Lamborghini.",
      },
      { property: "og:title", content: "Zenthi — Can't find it anywhere? Someone already fixed it." },
      {
        property: "og:description",
        content:
          "Community-shared car-part files for the stuff nobody else bothers making. Mods, retrofits, upgrades, and everyday fixes — from a Bronco to a Lamborghini.",
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
    body: "A cracked HVAC vent clip on an old 911. A dead sensor housing on a Diablo. A better bracket for a Civic. Somebody already modelled a replacement.",
  },
  {
    no: "02",
    title: "It gets shared here",
    body: "Upload a CAD model, 3D scan, cutting profile, or 2D drawing — STEP is recommended for edits, but the archive accepts multiple formats. Add fitment details and a writeup so the next person knows exactly what they're looking at.",
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
          <p className="tech-label">Open library · Rev. 01</p>
          <h1 className="mt-6 max-w-4xl font-display text-4xl leading-[1.08] font-semibold tracking-tight text-foreground sm:text-6xl">
            Can't find it anywhere? Someone already fixed it.
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Somebody's already fixed this. Your washer fluid splitter is broken, the bracket
            snapped, or a part just doesn't exist anymore — and buying new from the dealer isn't an
            option. Chances are someone's already solved it: measured it, modeled it, printed a few
            revisions until it fit. Mods, upgrades, retrofits, and everyday fixes are all welcome
            here, whether it's for a Bronco or a Lamborghini. Zenthi is where those fixes live instead
            of disappearing into old forum threads.
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
            HONDA · BMW · PORSCHE · MAZDA · TOYOTA · FERRARI · AND MORE
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
            Shared for reference, not for safety-critical use.
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Zenthi is an innovation archive for car-part files — brackets, housings, covers, trim,
            and more. The hardest, most inventive work often starts with high-performance and exotic
            builds, but that spirit extends to any vehicle: mainstream daily drivers, retrofits, and
            performance mods are welcome here. Printed polymer has no business holding a car together
            or containing fuel, so use of the files is recommended for fitment purposes only. All files
            are provided for reference only; verify fit, material suitability, and safety independently
            before any real-world use.
          </p>
        </div>
      </section>
    </SiteShell>
  );
}
