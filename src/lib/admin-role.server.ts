import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type AuthContext = { supabase: SupabaseClient<Database>; userId: string };

export async function isAdmin(context: AuthContext): Promise<boolean> {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) return false;
  return !!data;
}

export async function requireAdmin(context: AuthContext): Promise<void> {
  if (!(await isAdmin(context))) throw new Error("Admin access required.");
}
