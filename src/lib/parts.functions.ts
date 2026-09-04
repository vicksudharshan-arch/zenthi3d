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
  vehicles: {
    make: string;
    model: string;
    yearFrom: string;
    yearTo: string;
    engineMake?: string;
    engineSeries?: string;
    displacement?: string;
    generation?: string;
    drivetrain?: string;
  }[];
  notes: string | null;
  uploader_name: string | null;
  reference_only: boolean;
  oem_part_numbers: string | null;
  aftermarket_part_numbers: { brand: string; number: string }[];
  extra_files: { kind: string; path: string; name: string; size: number }[];
  step_files: { path: string; name: string; size: number }[];
  stl_files: { path: string; name: string; size: number }[];
  step_file_path: string | null;
  step_file_name: string | null;
  step_file_size: number | null;
  stl_file_path: string | null;
  stl_file_name: string | null;
  stl_file_size: number | null;
  source_link: string | null;
  license_type: string | null;
  status: string;
  created_at: string;
};

export const listAllParts = createServerFn({ method: "GET" }).handler(async () => {
  const { requireAdminUnlocked } = await import("./admin-gate.server");
  await requireAdminUnlocked();
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
    const { requireAdminUnlocked } = await import("./admin-gate.server");
    await requireAdminUnlocked();
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
  engineMake: z.string().optional(),
  engineSeries: z.string().optional(),
  displacement: z.string().optional(),
  generation: z.string().optional(),
  drivetrain: z.string().optional(),
});

const aftermarketSchema = z.object({ brand: z.string(), number: z.string() });

const editableFields = {
  name: z.string().min(1),
  description: z.string(),
  category: z.string().min(1),
  placement: z.string().nullable(),
  material: z.string().nullable(),
  thickness_infill: z.string().nullable(),
  contributor_type: z.array(z.string()),
  vehicles: z.array(vehicleSchema),
  notes: z.string().nullable(),
  reference_only: z.boolean(),
  oem_part_numbers: z.string().nullable(),
  aftermarket_part_numbers: z.array(aftermarketSchema),
};

export const updatePart = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string(),
        uploader_name: z.string().nullable(),
        ...editableFields,
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { requireAdminUnlocked } = await import("./admin-gate.server");
    await requireAdminUnlocked();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...patch } = data;
    const { error } = await supabaseAdmin.from("parts").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

async function pathsForParts(ids: string[]) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: rows } = await supabaseAdmin
    .from("parts")
    .select("step_file_path, stl_file_path, extra_files, step_files, stl_files")
    .in("id", ids);
  return Array.from(
    new Set(
      (rows ?? []).flatMap((r) => {
        const lists = [r.extra_files, r.step_files, r.stl_files].flatMap((v) =>
          Array.isArray(v) ? (v as { path?: string }[]) : [],
        );
        return [r.step_file_path, r.stl_file_path, ...lists.map((f) => f?.path)];
      }),
    ),
  ).filter((p): p is string => !!p);
}

export const deleteParts = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ ids: z.array(z.string()).min(1) }).parse(input))
  .handler(async ({ data }) => {
    const { requireAdminUnlocked } = await import("./admin-gate.server");
    await requireAdminUnlocked();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const paths = await pathsForParts(data.ids);
    if (paths.length) await supabaseAdmin.storage.from("part-files").remove(paths);
    const { error } = await supabaseAdmin.from("parts").delete().in("id", data.ids);
    if (error) throw new Error(error.message);
    return { ok: true, deleted: data.ids.length };
  });

export const getDownloadUrl = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string(),
        format: z.enum(["step", "stl", "extra"]).optional(),
        index: z.number().int().optional(),
        extraIndex: z.number().int().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: part, error } = await supabaseAdmin
      .from("parts")
      .select(
        "step_file_path, step_file_name, stl_file_path, stl_file_name, extra_files, step_files, stl_files",
      )
      .eq("id", data.id)
      .eq("status", "approved")
      .maybeSingle();
    if (error || !part) throw new Error(error?.message ?? "Part not found");

    const list = (v: unknown) =>
      Array.isArray(v) ? (v as { path?: string; name?: string }[]) : [];
    const index = data.index ?? data.extraIndex ?? 0;

    let path: string | null = null;
    let fileName: string | null = null;

    if (data.format === "extra") {
      const f = list(part.extra_files)[index];
      path = f?.path ?? null;
      fileName = f?.name ?? null;
    } else if (data.format === "stl") {
      const f = list(part.stl_files)[index];
      path = f?.path ?? part.stl_file_path;
      fileName = f?.name ?? part.stl_file_name;
    } else {
      const f = list(part.step_files)[index];
      path = f?.path ?? part.step_file_path;
      fileName = f?.name ?? part.step_file_name;
    }
    if (!path) throw new Error("That file isn't available for this part.");

    const { data: signed, error: signErr } = await supabaseAdmin.storage
      .from("part-files")
      .createSignedUrl(path, 300, { download: fileName ?? path });
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
        ...editableFields,
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
      .select("uploader_name")
      .eq("id", data.id)
      .maybeSingle();
    if (readErr || !part) throw new Error("Part not found");
    if (!nameMatches(data.uploaderName, part.uploader_name)) return { ok: false as const };
    const paths = await pathsForParts([data.id]);
    if (paths.length) await supabaseAdmin.storage.from("part-files").remove(paths);

    const { error } = await supabaseAdmin.from("parts").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
