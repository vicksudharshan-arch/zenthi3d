import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type PartRow = {
  id: string;
  name: string;
  description: string;
  category: string;
  placement: string | null;
  material: string | null;
  thickness_infill: string | null;
  contributor_type: string[];
  vehicles: { make: string; model: string; yearFrom: string; yearTo: string }[];
  notes: string | null;
  uploader_name: string | null;
  step_file_path: string | null;
  step_file_name: string | null;
  step_file_size: number | null;
  status: string;
  created_at: string;
};


export const listAllParts = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("parts")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as PartRow[];
});

export const setPartStatus = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ id: z.string(), status: z.enum(["approved", "rejected", "pending"]) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("parts")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const vehicleSchema = z.object({
  make: z.string(),
  model: z.string(),
  yearFrom: z.string(),
  yearTo: z.string(),
});

export const updatePart = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string(),
        name: z.string().min(1),
        description: z.string(),
        category: z.string().min(1),
        placement: z.string().nullable(),
        material: z.string().nullable(),
        thickness_infill: z.string().nullable(),
        contributor_type: z.array(z.string()),
        vehicles: z.array(vehicleSchema),
        notes: z.string().nullable(),
        uploader_name: z.string().nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...patch } = data;
    const { error } = await supabaseAdmin.from("parts").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteParts = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ ids: z.array(z.string()).min(1) }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin
      .from("parts")
      .select("step_file_path")
      .in("id", data.ids);
    const paths = (rows ?? [])
      .map((r) => r.step_file_path)
      .filter((p): p is string => !!p);
    if (paths.length)
      await supabaseAdmin.storage.from("part-files").remove(Array.from(new Set(paths)));
    const { error } = await supabaseAdmin.from("parts").delete().in("id", data.ids);
    if (error) throw new Error(error.message);
    return { ok: true, deleted: data.ids.length };
  });

export const getDownloadUrl = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ id: z.string() }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: part, error } = await supabaseAdmin
      .from("parts")
      .select("step_file_path, step_file_name")
      .eq("id", data.id)
      .eq("status", "approved")
      .maybeSingle();
    if (error || !part) throw new Error(error?.message ?? "Part not found");

    const path = part.step_file_path;
    if (!path) throw new Error("No file is available for this part.");

    const { data: signed, error: signErr } = await supabaseAdmin.storage
      .from("part-files")
      .createSignedUrl(path, 300, { download: part.step_file_name ?? path });
    if (signErr || !signed) throw new Error(signErr?.message ?? "Could not create download link");
    return { url: signed.signedUrl };
  });


// ---- Public, uploader-scoped actions (no auth system: name-on-record check) ----

const nameMatches = (claim: string, onRecord: string | null | undefined) =>
  !!onRecord && claim.trim().toLowerCase() === onRecord.trim().toLowerCase();

export const verifyUploader = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ id: z.string(), uploaderName: z.string().min(1) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: part, error } = await supabaseAdmin
      .from("parts")
      .select("uploader_name")
      .eq("id", data.id)
      .maybeSingle();
    if (error || !part) throw new Error("Part not found");
    return { ok: nameMatches(data.uploaderName, part.uploader_name) };
  });

export const updatePartAsUploader = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string(),
        uploaderName: z.string().min(1),
        name: z.string().min(1),
        description: z.string(),
        category: z.string().min(1),
        placement: z.string().nullable(),
        material: z.string().nullable(),
        thickness_infill: z.string().nullable(),
        contributor_type: z.array(z.string()),
        vehicles: z.array(vehicleSchema),
        notes: z.string().nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, uploaderName, ...patch } = data;
    const { data: part, error: readErr } = await supabaseAdmin
      .from("parts")
      .select("uploader_name")
      .eq("id", id)
      .maybeSingle();
    if (readErr || !part) throw new Error("Part not found");
    if (!nameMatches(uploaderName, part.uploader_name)) return { ok: false as const };
    const { error } = await supabaseAdmin.from("parts").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const deletePartAsUploader = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ id: z.string(), uploaderName: z.string().min(1) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: part, error: readErr } = await supabaseAdmin
      .from("parts")
      .select("uploader_name, step_file_path")
      .eq("id", data.id)
      .maybeSingle();
    if (readErr || !part) throw new Error("Part not found");
    if (!nameMatches(data.uploaderName, part.uploader_name)) return { ok: false as const };
    const paths = [part.step_file_path].filter((p): p is string => !!p);
    if (paths.length) await supabaseAdmin.storage.from("part-files").remove(paths);

    const { error } = await supabaseAdmin.from("parts").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
