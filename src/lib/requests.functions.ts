import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const nameMatches = (claim: string, onRecord: string | null | undefined) =>
  !!onRecord && claim.trim().toLowerCase() === onRecord.trim().toLowerCase();

/** Soft-gated reopen: only the original requester (by name on record) may reopen. */
export const reopenRequest = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ id: z.string(), requesterName: z.string().min(1) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error: readErr } = await supabaseAdmin
      .from("requests")
      .select("requester_name")
      .eq("id", data.id)
      .maybeSingle();
    if (readErr || !row) throw new Error("Request not found");
    if (!nameMatches(data.requesterName, row.requester_name)) return { ok: false as const };

    const { error } = await supabaseAdmin
      .from("requests")
      .update({ status: "open", fulfilled_part_id: null })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

/** Public lookup used by the upload page banner when ?requestId= is present. */
export const getRequestSummary = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ id: z.string() }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("requests")
      .select("id, part_description, make, model, status")
      .eq("id", data.id)
      .maybeSingle();
    return row ?? null;
  });
