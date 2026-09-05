import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type CopyrightReportRow = {
  id: string;
  reporter_name: string;
  reporter_email: string;
  part_reference: string;
  concern: string;
  good_faith: boolean;
  status: string;
  created_at: string;
};

export const listCopyrightReports = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { requireAdmin } = await import("./admin-role.server");
  await requireAdmin(context);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("copyright_reports")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as CopyrightReportRow[];
});

export const setCopyrightReportStatus = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid(), status: z.enum(["open", "resolved"]) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { requireAdmin } = await import("./admin-role.server");
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("copyright_reports")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
