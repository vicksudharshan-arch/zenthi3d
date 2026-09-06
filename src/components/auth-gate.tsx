import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { UsernameForm } from "@/components/username-form";


/** Current path + query, used so sign-in can return the user where they were. */
export function useReturnTo(): string {
  const location = useRouterState({ select: (s) => s.location });
  return location.pathname + (location.searchStr ? location.searchStr : "");
}

/**
 * Wraps an action that requires an account. Browsing stays open everywhere —
 * this is only used around uploading, posting requests and fulfilling them.
 */
export function AuthGate({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  const { session, loading } = useAuth();
  const returnTo = useReturnTo();

  if (loading) {
    return (
      <div className="rounded-sm border border-border bg-card p-6 text-sm text-muted-foreground">
        Checking your account…
      </div>
    );
  }

  if (!session) {
    return (
      <div className="rounded-sm border border-border bg-card p-6 sm:p-8">
        <p className="tech-label text-brass">Sign in to continue</p>
        <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight">{title}</h2>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">{description}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/auth"
            search={{ redirect: returnTo }}
            className="inline-flex h-11 items-center rounded-sm bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Sign in
          </Link>
          <Link
            to="/auth"
            search={{ redirect: returnTo, mode: "signup" }}
            className="inline-flex h-11 items-center rounded-sm border border-border px-6 text-sm font-medium hover:bg-secondary"
          >
            Create an account
          </Link>
        </div>
        <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
          Browsing and searching the library stays open to everyone — an account is only needed to
          post files, requests and fulfilments.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
