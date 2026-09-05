import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { CATEGORY_LABELS, type Category } from "@/lib/parts";

/**
 * Metadata-only discovery through the Brave Search API. Zenthi never
 * downloads, stores or rehosts a file — only the title, snippet, source
 * domain and a link back to the original page.
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
  snippet: string | null;
  thumbnail: string | null;
  source: string;
  sourceUrl: string;
};

export type ExternalSearchResponse = {
  results: ExternalResult[];
  notices: string[];
  query: string;
  configured: boolean;
};

function clean(v?: string): string {
  return (v ?? "").trim();
}

/** Structured fields become an explicitly automotive query, which is what stops
 *  "Golf Mk2" from returning golf clubs. */
function buildQuery(f: ExternalFilters): string {
  const category = clean(f.category);
  const categoryLabel =
    category && category in CATEGORY_LABELS ? CATEGORY_LABELS[category as Category] : "";

  const yearFrom = clean(f.yearFrom);
  const yearTo = clean(f.yearTo);
  const years = yearFrom && yearTo && yearTo !== yearFrom ? `${yearFrom}-${yearTo}` : yearFrom || yearTo;

  const engine = [clean(f.engineMake), clean(f.engineSeries), clean(f.displacement)]
    .filter(Boolean)
    .join(" ");

  const parts = [
    clean(f.make),
    clean(f.model),
    clean(f.generation),
    years,
    engine,
    clean(f.drivetrain),
    categoryLabel,
    clean(f.keyword),
  ].filter(Boolean);

  if (parts.length === 0) return "";
  return `${parts.join(" ")} car part 3D model STL STEP CAD`;
}

function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "unknown source";
  }
}

function stripTags(html?: string): string | null {
  if (!html) return null;
  const text = html.replace(/<[^>]*>/g, "").trim();
  return text.length > 0 ? text : null;
}

export const searchExternalSources = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => filterSchema.parse(data))
  .handler(async ({ data }): Promise<ExternalSearchResponse> => {
    const query = buildQuery(data);
    if (!query) {
      return {
        results: [],
        notices: ["Pick at least one filter to search."],
        query: "",
        configured: true,
      };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("app_secrets")
      .select("key_value")
      .eq("key_name", "brave_search_api_key")
      .maybeSingle();

    const apiKey = (row?.key_value ?? "").trim();
    if (!apiKey) {
      return { results: [], notices: [], query, configured: false };
    }

    const url = new URL("https://api.search.brave.com/res/v1/web/search");
    url.searchParams.set("q", query);
    url.searchParams.set("count", "20");
    url.searchParams.set("safesearch", "moderate");

    try {
      const res = await fetch(url.toString(), {
        headers: {
          Accept: "application/json",
          "Accept-Encoding": "gzip",
          "X-Subscription-Token": apiKey,
        },
      });

      if (res.status === 401 || res.status === 403) {
        return {
          results: [],
          notices: ["The saved search key was rejected. It may need to be updated."],
          query,
          configured: true,
        };
      }
      if (res.status === 429) {
        return {
          results: [],
          notices: ["Too many searches right now — wait a moment and try again."],
          query,
          configured: true,
        };
      }
      if (!res.ok) {
        return {
          results: [],
          notices: [`Search did not respond (status ${res.status}).`],
          query,
          configured: true,
        };
      }

      const json = (await res.json()) as {
        web?: {
          results?: Array<{
            title?: string;
            url?: string;
            description?: string;
            thumbnail?: { src?: string } | null;
            meta_url?: { hostname?: string } | null;
          }>;
        };
      };

      const results = (json.web?.results ?? [])
        .filter((r) => typeof r.url === "string" && r.url.length > 0)
        .map((r, i) => {
          const sourceUrl = r.url as string;
          return {
            id: `brave:${i}:${sourceUrl}`,
            title: stripTags(r.title) ?? sourceUrl,
            snippet: stripTags(r.description),
            thumbnail: r.thumbnail?.src ?? null,
            source: r.meta_url?.hostname?.replace(/^www\./, "") ?? domainOf(sourceUrl),
            sourceUrl,
          } satisfies ExternalResult;
        });

      return { results, notices: [], query, configured: true };
    } catch {
      return {
        results: [],
        notices: ["The search service could not be reached. Try again shortly."],
        query,
        configured: true,
      };
    }
  });
