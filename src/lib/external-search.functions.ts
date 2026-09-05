import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { CATEGORY_LABELS, type Category } from "@/lib/parts";

/**
 * Metadata-only discovery across other model sites. Zenthi never downloads,
 * stores or rehosts a file — only the title, thumbnail, licence text and a
 * link back to the original listing.
 */

const filterSchema = z.object({
  make: z.string().optional(),
  model: z.string().optional(),
  yearFrom: z.string().optional(),
  yearTo: z.string().optional(),
  engineMake: z.string().optional(),
  engineSeries: z.string().optional(),
  displacement: z.string().optional(),
  generation: z.string().optional(),
  drivetrain: z.string().optional(),
  category: z.string().optional(),
  keyword: z.string().optional(),
});

export type ExternalFilters = z.infer<typeof filterSchema>;

export type ExternalResult = {
  id: string;
  title: string;
  thumbnail: string | null;
  source: string;
  sourceUrl: string;
  license: string | null;
  author: string | null;
};

export type ExternalSearchResponse = {
  results: ExternalResult[];
  notices: string[];
  query: string;
};

function clean(v?: string): string {
  return (v ?? "").trim();
}

/** Structured fields become an explicitly automotive query, which is what stops
 *  "Golf Mk2" from returning golf clubs. */
function buildQuery(f: ExternalFilters): { query: string; required: string[] } {
  const category = clean(f.category);
  const categoryLabel =
    category && category in CATEGORY_LABELS ? CATEGORY_LABELS[category as Category] : "";
  const parts = [
    clean(f.make),
    clean(f.model),
    clean(f.generation),
    clean(f.engineMake),
    clean(f.engineSeries),
    clean(f.displacement),
    clean(f.drivetrain),
    categoryLabel,
    clean(f.keyword),
  ].filter(Boolean);

  const required = [clean(f.make), clean(f.model)].filter(Boolean).map((s) => s.toLowerCase());
  return { query: [...parts, "car part"].join(" "), required };
}

function matchesFitment(text: string, required: string[]): boolean {
  if (required.length === 0) return true;
  const haystack = text.toLowerCase();
  return required.every((token) => haystack.includes(token));
}

async function searchSketchfab(
  query: string,
  required: string[],
): Promise<{ results: ExternalResult[]; notice?: string }> {
  const url = new URL("https://api.sketchfab.com/v3/search");
  url.searchParams.set("type", "models");
  url.searchParams.set("q", query);
  url.searchParams.set("count", "24");
  try {
    const res = await fetch(url.toString(), { headers: { Accept: "application/json" } });
    if (!res.ok) {
      return { results: [], notice: `Sketchfab did not respond (status ${res.status}).` };
    }
    const json = (await res.json()) as {
      results?: Array<{
        uid: string;
        name?: string;
        description?: string;
        viewerUrl?: string;
        thumbnails?: { images?: Array<{ url: string; width: number }> };
        license?: { label?: string } | null;
        user?: { displayName?: string } | null;
      }>;
    };
    const results = (json.results ?? [])
      .filter((m) => matchesFitment(`${m.name ?? ""} ${m.description ?? ""}`, required))
      .map((m) => {
        const images = [...(m.thumbnails?.images ?? [])].sort((a, b) => a.width - b.width);
        const thumb = images.find((i) => i.width >= 400) ?? images[images.length - 1];
        return {
          id: `sketchfab:${m.uid}`,
          title: m.name ?? "Untitled model",
          thumbnail: thumb?.url ?? null,
          source: "Sketchfab",
          sourceUrl: m.viewerUrl ?? `https://sketchfab.com/3d-models/${m.uid}`,
          license: m.license?.label ?? null,
          author: m.user?.displayName ?? null,
        } satisfies ExternalResult;
      });
    return { results };
  } catch {
    return { results: [], notice: "Sketchfab could not be reached." };
  }
}

async function searchThingiverse(
  query: string,
  required: string[],
): Promise<{ results: ExternalResult[]; notice?: string }> {
  const token = process.env['THINGIVERSE_APP_TOKEN'];
  if (!token) {
    return {
      results: [],
      notice:
        "Thingiverse is not connected yet — it needs a free developer app token before its results can appear.",
    };
  }
  const url = new URL(`https://api.thingiverse.com/search/${encodeURIComponent(query)}`);
  url.searchParams.set("type", "things");
  url.searchParams.set("per_page", "24");
  try {
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    if (!res.ok) {
      return { results: [], notice: `Thingiverse did not respond (status ${res.status}).` };
    }
    const json = (await res.json()) as {
      hits?: Array<{
        id: number;
        name?: string;
        description?: string;
        public_url?: string;
        thumbnail?: string;
        preview_image?: string;
        license?: string;
        creator?: { name?: string } | null;
      }>;
    };
    const results = (json.hits ?? [])
      .filter((h) => matchesFitment(`${h.name ?? ""} ${h.description ?? ""}`, required))
      .map(
        (h) =>
          ({
            id: `thingiverse:${h.id}`,
            title: h.name ?? "Untitled thing",
            thumbnail: h.preview_image ?? h.thumbnail ?? null,
            source: "Thingiverse",
            sourceUrl: h.public_url ?? `https://www.thingiverse.com/thing:${h.id}`,
            license: h.license ?? null,
            author: h.creator?.name ?? null,
          }) satisfies ExternalResult,
      );
    return { results };
  } catch {
    return { results: [], notice: "Thingiverse could not be reached." };
  }
}

export const searchExternalSources = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => filterSchema.parse(data))
  .handler(async ({ data }): Promise<ExternalSearchResponse> => {
    const { query, required } = buildQuery(data);
    if (query.trim() === "car part") {
      return { results: [], notices: ["Pick at least one filter to search."], query: "" };
    }

    const [sketchfab, thingiverse] = await Promise.all([
      searchSketchfab(query, required),
      searchThingiverse(query, required),
    ]);

    const notices = [sketchfab.notice, thingiverse.notice].filter(Boolean) as string[];
    return {
      results: [...sketchfab.results, ...thingiverse.results],
      notices,
      query,
    };
  });
