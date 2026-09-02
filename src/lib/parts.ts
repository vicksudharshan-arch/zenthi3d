export const CATEGORIES = ["bracket", "housing", "cover", "trim", "other"] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  bracket: "Bracket",
  housing: "Housing",
  cover: "Cover",
  trim: "Trim",
  other: "Other",
};

export type Vehicle = { make: string; model: string; yearFrom: string; yearTo: string };

export function vehicleLabel(v: Vehicle) {
  const years = [v.yearFrom, v.yearTo].filter(Boolean).join("–");
  return [v.make, v.model, years].filter(Boolean).join(" ");
}
