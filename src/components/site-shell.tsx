import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { getMyAccess } from "@/lib/admin-access.functions";

function Wordmark() {
  return (
      <Link to="/" className="group flex items-baseline gap-2">
      <span className="font-display text-2xl font-semibold tracking-tight text-foreground">
        Zenthi
      </span>
      <span className="tech-label hidden sm:inline">Open parts library</span>
    </Link>
  );
}

function AdminLink() {
  const { session, loading } = useAuth();
  const access = useQuery({
    queryKey: ["access", "me"],
    queryFn: () => getMyAccess(),
    enabled: !!session && !loading,
  });

  if (loading || !session || !access.data?.isAdmin) return null;

  return (
    <Link
      to="/admin"
      className="rounded-sm px-3 py-2 font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground [&.active]:text-foreground"
    >
      Admin
    </Link>
  );
}

function AccountNav() {
  const { email, loading } = useAuth();
  if (loading) return null;
  if (!email) {
    return (
      <Link
        to="/auth"
        className="rounded-sm px-3 py-2 font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground [&.active]:text-foreground"
      >
        Sign in
      </Link>
    );
  }
  return (
    <Link
      to="/account"
      className="max-w-[10rem] truncate rounded-sm border border-border px-3 py-2 font-mono text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground [&.active]:text-foreground"
      title={email}
    >
      {email}
    </Link>
  );
}


export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5">
          <Wordmark />
          <nav className="flex items-center gap-1 text-sm">
            <Link
              to="/"
              className="rounded-sm px-3 py-2 font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground [&.active]:text-foreground"
            >
              Home
            </Link>
            <Link
              to="/library"
              className="rounded-sm px-3 py-2 font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground [&.active]:text-foreground"
            >
              Library
            </Link>
            <Link
              to="/search-web"
              className="rounded-sm px-3 py-2 font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground [&.active]:text-foreground"
            >
              Search the web
            </Link>
            <Link
              to="/requests"
              className="rounded-sm px-3 py-2 font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground [&.active]:text-foreground"
            >
              Requests
            </Link>
            <Link
              to="/upload"
              className="rounded-sm px-3 py-2 font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground [&.active]:text-foreground"
            >
              Upload
            </Link>
            <AdminLink />
            <AccountNav />
          </nav>

        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="mt-24 border-t border-border bg-secondary/50">
        <div className="mx-auto w-full max-w-6xl px-5 py-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-display text-lg font-semibold">Zenthi</p>
              <p className="tech-label mt-1">Community parts archive</p>
            </div>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
              Zenthi does not restrict which car parts can be shared. Files are provided by the
              community for fitment, measurement, and fabrication reference. Safety-critical parts
              featured on this site (such as brakes, suspension, or structural components) are
              recommended for fitment reference only — using a community-sourced or self-fabricated
              part in place of an OEM safety-critical component for actual driving use is not
              advised. Always verify fit, material suitability, and safety independently. Zenthi
              does not guarantee fitment, safety, or performance of any file.
            </p>
          </div>
          <p className="mt-8 font-mono text-xs text-muted-foreground">
            Uploads licensed CC BY 4.0 ·{" "}
            <Link to="/community-guidelines" className="underline underline-offset-2 hover:text-foreground">
              Community guidelines
            </Link>{" "}
            ·{" "}
            <Link to="/copyright-policy" className="underline underline-offset-2 hover:text-foreground">
              Report a copyright concern

            </Link>
          </p>
          <p className="mt-4 max-w-3xl text-xs leading-relaxed text-muted-foreground">
            Zenthi is not affiliated with, sponsored by, or endorsed by any vehicle manufacturer.
            Brand and model names are used solely to describe vehicle compatibility. No file on this
            site is an official or licensed product of the referenced manufacturer.
          </p>
        </div>
      </footer>
    </div>
  );
}
