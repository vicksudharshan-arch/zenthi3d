import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AdminRequestRow = {
  id: string;
  user_id: string;
  email: string;
  reason: string;
  status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
};

/** Role + own-request status for the signed-in user. */
export const getMyAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { isAdmin } = await import("./admin-role.server");
    const admin = await isAdmin(context);
    const { data } = await context.supabase
      .from("admin_requests")
      .select("id, status, reason, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return { isAdmin: admin, request: data ?? null };
  });

export const submitAdminRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ reason: z.string().trim().min(20).max(2000) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const email = (context.claims["email"] as string | undefined) ?? "";
    const { error } = await context.supabase.from("admin_requests").insert({
      user_id: context.userId,
      email,
      reason: data.reason,
    });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const listAdminRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { requireAdmin } = await import("./admin-role.server");
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("admin_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as AdminRequestRow[];
  });

export const reviewAdminRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({ id: z.string().uuid(), decision: z.enum(["approved", "denied"]) })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { requireAdmin } = await import("./admin-role.server");
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: req, error: readErr } = await supabaseAdmin
      .from("admin_requests")
      .select("id, user_id, status")
      .eq("id", data.id)
      .maybeSingle();
    if (readErr || !req) throw new Error("Request not found.");
    if (req.status !== "pending") return { ok: false as const, reason: "already-reviewed" };

    if (data.decision === "approved") {
      const { error: roleErr } = await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: req.user_id, role: "admin" }, { onConflict: "user_id,role" });
      if (roleErr) throw new Error(roleErr.message);
    }

    const { error } = await supabaseAdmin
      .from("admin_requests")
      .update({
        status: data.decision,
        reviewed_by: context.userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
