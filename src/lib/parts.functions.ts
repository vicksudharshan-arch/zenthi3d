import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type PartRow = {
  id: string;
  name: string;
  description: string;
  category: string;
  vehicles: { make: string; model: string; yearFrom: string; yearTo: string }[];
  notes: string | null;
  uploader_name: string | null;
  file_path: string;
  file_name: string;
  file_size: number | null;
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

export const getDownloadUrl = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ id: z.string() }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: part, error } = await supabaseAdmin
      .from("parts")
      .select("file_path, file_name")
      .eq("id", data.id)
      .maybeSingle();
    if (error || !part) throw new Error(error?.message ?? "Part not found");
    const { data: signed, error: signErr } = await supabaseAdmin.storage
      .from("part-files")
      .createSignedUrl(part.file_path, 300, { download: part.file_name });
    if (signErr || !signed) throw new Error(signErr?.message ?? "Could not create download link");
    return { url: signed.signedUrl };
  });
