import { useState } from "react";
import { toast } from "sonner";
import { USERNAME_RULES, useProfile, useSaveUsername } from "@/hooks/use-profile";

const fieldCls =
  "mt-2 w-full rounded-sm border border-input bg-card px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-ring focus:ring-2 focus:ring-ring/25";

/**
 * Username picker. Used both as the blocking step before contributing and as
 * the editable field on the account page.
 */
export function UsernameForm({
  initial = "",
  submitLabel,
  onSaved,
}: {
  initial?: string;
  submitLabel: string;
  onSaved?: (username: string) => void;
}) {
  const { userId } = useProfile();
  const save = useSaveUsername();
  const [value, setValue] = useState(initial);
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="mt-6 max-w-sm"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!userId) return;
        setBusy(true);
        const res = await save(userId, value);
        setBusy(false);
        if (!res.ok) {
          toast.error(res.error ?? "Couldn't save that username.");
          return;
        }
        toast.success("Username saved.");
        onSaved?.(value.trim());
      }}
    >
      <label className="tech-label block" htmlFor="username">
        Username
      </label>
      <input
        id="username"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="e.g. tunnelrat_87"
        className={fieldCls}
        autoComplete="username"
      />
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{USERNAME_RULES}</p>
      <button
        type="submit"
        disabled={busy}
        className="mt-4 inline-flex h-11 items-center rounded-sm bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
      >
        {busy ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
