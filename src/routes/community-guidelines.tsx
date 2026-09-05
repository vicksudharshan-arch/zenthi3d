import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";

export const Route = createFileRoute("/community-guidelines")({
  head: () => ({
    meta: [
      { title: "Community guidelines — Zenthi" },
      {
        name: "description",
        content:
          "What can be uploaded to Zenthi, what admins check before approving a part file, admin conduct expectations, and how to become an admin.",
      },
      { property: "og:title", content: "Community guidelines — Zenthi" },
      {
        property: "og:description",
        content: "Upload scope, review standards, and admin conduct on Zenthi.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GuidelinesPage,
});

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mt-12 border-t border-border pt-10">
      <h2 className="font-display text-2xl font-semibold tracking-tight">{title}</h2>
      <div className="mt-4 space-y-4 text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}

const SECTIONS = [
  { id: "what-can-be-uploaded", label: "What can be uploaded" },
  { id: "what-admins-check", label: "What admins check before approving" },
  { id: "admin-conduct", label: "Admin conduct expectations" },
  { id: "how-to-become-an-admin", label: "How to become an admin" },
];

function AnchorLink({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <a
      href={`#${id}`}
      onClick={(e) => {
        e.preventDefault();
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }}
      className="underline underline-offset-4 hover:text-foreground"
    >
      {children}
    </a>
  );
}

function GuidelinesPage() {
  return (
    <SiteShell>
      <div className="mx-auto w-full max-w-3xl px-5 py-16">
        <p className="tech-label text-brass">Community</p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
          Community guidelines
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Zenthi is community-run. These are the standards uploaders and admins work to.
        </p>

        <section className="mt-10">
          <h2 className="font-display text-xl font-semibold tracking-tight">What's here</h2>
          <nav aria-label="Community guidelines sections">
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {SECTIONS.map((item) => (
                <li key={item.id}>
                  <AnchorLink id={item.id}>{item.label}</AnchorLink>
                </li>
              ))}
            </ul>
          </nav>
        </section>

        <Section id="what-can-be-uploaded" title="What can be uploaded">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              Any car-related part file — 3D print models, scans, cutting profiles, and 2D
              drawings. STEP is preferred where you have it.
            </li>
            <li>
              Zenthi is not for trinkets or purely aesthetic/decorative items — we're looking for
              real functionality. The goal is to cut through the noise of the broader 3D-printing
              community (which is dominated by novelty items) and build something genuinely useful.
              Examples of what wouldn't be accepted: a rose-shaped cup holder insert, keychains,
              phone holders, decorative shift knobs, novelty coasters, or anything whose primary
              purpose is looks rather than solving a real fitment, repair, or fabrication problem.
            </li>
            <li>
              Safety-critical items (brakes, suspension, structural, fuel-carrying) are welcome as
              reference and fitment data only. Printed polymer has no business holding a car
              together or containing fuel.
            </li>
            <li>
              Parts for Honda, Acura and Stellantis brands (Chrysler, Dodge, Jeep, Ram, Fiat, Alfa
              Romeo, Maserati, Peugeot, Citroën, DS, Opel, Vauxhall, Lancia, Abarth) cannot be
              listed here, for legal-risk reasons.
            </li>
            <li>
              Reuploads need a source link, the original creator's name, and the correct license.
              Modified files need the original's license, and ND-licensed originals (CC BY-ND, CC
              BY-NC-ND) cannot be reshared as modifications.
            </li>
            <li>Multiple STEP, STL, and additional files per submission are fine and encouraged.</li>
          </ul>
        </Section>

        <Section id="what-admins-check" title="What admins check before approving">
          <ul className="list-disc space-y-2 pl-5">
            <li>The category matches what the part actually is.</li>
            <li>Fitment data is present and plausible — make, model, year range, engine details.</li>
            <li>Licensing is valid: source link, creator credit, and the ND / modification rules.</li>
            <li>No restricted-brand fitment.</li>
            <li>No obvious copyright problems — scraped commercial files, paid models, or ripped OEM CAD.</li>
            <li>Safety-critical parts are flagged reference-only.</li>
          </ul>
        </Section>

        <Section id="admin-conduct" title="Admin conduct expectations">
          <ul className="list-disc space-y-2 pl-5">
            <li>Don't approve your own submissions — leave them for another admin.</li>
            <li>Act in good faith; approve on the merits, not on who uploaded it.</li>
            <li>
              Repeated bad-faith approvals, or approving around these rules, can result in the
              admin role being removed at the discretion of other admins or the site owner.
            </li>
          </ul>
        </Section>

        <Section id="how-to-become-an-admin" title="How to become an admin">
          <p>
            Create an account, then submit a short request explaining why you'd be a good reviewer —
            your background with car parts, CAD, scanning, or moderating communities. An existing
            admin reviews the request and either grants the admin role or declines it. You'll see
            the status on your account page.
          </p>
          <p>
            You don't need an account to browse the library or use the search engine — accounts are
            only needed for uploading, posting or fulfilling requests, and admin actions.
          </p>
          <p>
            <Link
              to="/account"
              className="font-medium text-foreground underline underline-offset-4"
            >
              Sign in and request admin access
            </Link>
          </p>
        </Section>
      </div>
    </SiteShell>
  );
}
