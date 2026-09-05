import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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

/**
 * Called right after a request-fulfilling submission is inserted with a
 * non-review status (private or publish-immediately). Verified against the
 * part row itself so it can't be used to mark arbitrary requests fulfilled.
 */
export const finalizeRequestFulfillment = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ requestId: z.string(), partId: z.string() }).parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: part } = await supabaseAdmin
      .from("parts")
      .select("id, request_id, status")
      .eq("id", data.partId)
      .maybeSingle();
    if (!part || part.request_id !== data.requestId) throw new Error("Part is not linked to that request");
    if (part.status !== "approved" && part.status !== "private_fulfillment") {
      return { ok: false as const };
    }
    const { error } = await supabaseAdmin
      .from("requests")
      .update({ status: "fulfilled", fulfilled_part_id: part.id })
      .eq("id", data.requestId);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

/**
 * Name-gated reveal of a private fulfillment's files for the original requester.
 */
export const revealPrivateFulfillment = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ requestId: z.string(), requesterName: z.string().min(1) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: request } = await supabaseAdmin
      .from("requests")
      .select("requester_name, fulfilled_part_id")
      .eq("id", data.requestId)
      .maybeSingle();
    if (!request) throw new Error("Request not found");
    if (!nameMatches(data.requesterName, request.requester_name)) return { ok: false as const };
    if (!request.fulfilled_part_id) throw new Error("Nothing has been submitted for this request yet.");

    const { data: part } = await supabaseAdmin
      .from("parts")
      .select("id, name, status, step_files, stl_files, extra_files, step_file_path, step_file_name, stl_file_path, stl_file_name")
      .eq("id", request.fulfilled_part_id)
      .maybeSingle();
    if (!part) throw new Error("That file is no longer available.");

    const list = (v: unknown) => (Array.isArray(v) ? (v as { path?: string; name?: string }[]) : []);
    const entries: { path?: string; name?: string }[] = [
      ...list(part.step_files),
      ...list(part.stl_files),
      ...list(part.extra_files),
    ];
    if (!entries.length && part.step_file_path)
      entries.push({ path: part.step_file_path, ...(part.step_file_name ? { name: part.step_file_name } : {}) });
    if (!entries.length && part.stl_file_path)
      entries.push({ path: part.stl_file_path, ...(part.stl_file_name ? { name: part.stl_file_name } : {}) });

    const files: { name: string; url: string }[] = [];
    for (const entry of entries) {
      if (!entry?.path) continue;
      const { data: signed } = await supabaseAdmin.storage
        .from("part-files")
        .createSignedUrl(entry.path, 900, { download: entry.name ?? entry.path });
      if (signed) files.push({ name: entry.name ?? entry.path, url: signed.signedUrl });
    }
    return { ok: true as const, partName: part.name, isPrivate: part.status === "private_fulfillment", files };
  });

/**
 * Contact details are not readable through the public API (column-level grant
 * revoked). Only the original poster (name-match soft gate) can read them here.
 */
export const revealRequestContact = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ requestId: z.string(), requesterName: z.string().min(1) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("requests")
      .select("requester_name, requester_contact")
      .eq("id", data.requestId)
      .maybeSingle();
    if (!row) throw new Error("Request not found");
    if (!nameMatches(data.requesterName, row.requester_name)) return { ok: false as const };
    return { ok: true as const, contact: row.requester_contact };
  });

/** Admins can read contact details for any request. */
export const adminGetRequestContact = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ requestId: z.string() }).parse(input))
  .handler(async ({ data, context }) => {
    const { requireAdmin } = await import("./admin-role.server");
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("requests")
      .select("requester_contact")
      .eq("id", data.requestId)
      .maybeSingle();
    if (!row) throw new Error("Request not found");
    return { ok: true as const, contact: row.requester_contact };
  });
