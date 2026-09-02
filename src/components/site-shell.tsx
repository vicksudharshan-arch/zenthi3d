import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

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

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5">
          <Wordmark />
          <nav className="flex items-center gap-1 text-sm">
            <Link
              to="/library"
              className="rounded-sm px-3 py-2 font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground [&.active]:text-foreground"
            >
              Library
            </Link>
            <Link
              to="/upload"
              className="rounded-sm px-3 py-2 font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground [&.active]:text-foreground"
            >
              Upload
            </Link>
            <Link
              to="/admin"
              className="rounded-sm px-3 py-2 font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground [&.active]:text-foreground"
            >
              Review
            </Link>
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
              Files are shared by the community and are for non-safety-critical parts only. Verify
              fit and function before use. Zenthi does not guarantee fitment or safety.
            </p>
          </div>
          <p className="mt-8 font-mono text-xs text-muted-foreground">
            Uploads licensed CC BY 4.0 · No brakes, suspension, structural or fuel-system parts
          </p>
        </div>
      </footer>
    </div>
  );
}
