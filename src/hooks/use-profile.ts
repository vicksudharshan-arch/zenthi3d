import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const USERNAME_RULES =
  "3–24 characters, letters, numbers, underscores or hyphens only.";

const USERNAME_RE = /^[A-Za-z0-9_-]{3,24}$/;

export function validateUsername(value: string): string | null {
  const v = value.trim();
  if (!v) return "Pick a username.";
  if (!USERNAME_RE.test(v)) return USERNAME_RULES;
  return null;
}

/** The signed-in user's public username, or null when they haven't picked one. */
export function useProfile() {
  const { session, loading: authLoading } = useAuth();
  const userId = session?.user?.id ?? null;

  const query = useQuery({
    queryKey: ["profile", userId ?? "anon"],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, username, created_at")
        .eq("user_id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data ?? null;
    },
  });

  return {
    userId,
    username: query.data?.username ?? null,
    profile: query.data ?? null,
    loading: authLoading || (!!userId && query.isLoading),
    refetch: query.refetch,
  };
}

export function useSaveUsername() {
  const qc = useQueryClient();
  return async (userId: string, username: string): Promise<{ ok: boolean; error?: string }> => {
    const problem = validateUsername(username);
    if (problem) return { ok: false, error: problem };
    const { error } = await supabase
      .from("profiles")
      .upsert({ user_id: userId, username: username.trim() }, { onConflict: "user_id" });
    if (error) {
      const taken = error.code === "23505" || /duplicate|unique/i.test(error.message);
      return { ok: false, error: taken ? "That username is already taken." : error.message };
    }
    await qc.invalidateQueries({ queryKey: ["profile", userId] });
    return { ok: true };
  };
}
