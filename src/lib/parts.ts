export const CATEGORIES = ["bracket", "housing", "cover", "trim", "other"] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  bracket: "Bracket",
  housing: "Housing",
  cover: "Cover",
  trim: "Trim",
  other: "Other",
};

export const CONTRIBUTOR_TYPES = [
  "restorer",
  "enthusiast",
  "professional_shop",
  "fabricator",
  "cad_designer",
  "printing_maker",
  "parts_supplier",
  "other",
] as const;
export type ContributorType = (typeof CONTRIBUTOR_TYPES)[number];

export const CONTRIBUTOR_TYPE_LABELS: Record<ContributorType, string> = {
  restorer: "Restorer",
  enthusiast: "Enthusiast / DIY builder",
  professional_shop: "Professional shop owner / technician",
  fabricator: "Fabricator / machinist",
  cad_designer: "CAD / mechanical designer",
  printing_maker: "3D printing hobbyist / maker",
  parts_supplier: "Parts supplier / dealer",
  other: "Other",
};

export type Vehicle = { make: string; model: string; yearFrom: string; yearTo: string };

export function vehicleLabel(v: Vehicle) {
  const years = [v.yearFrom, v.yearTo].filter(Boolean).join("–");
  return [v.make, v.model, years].filter(Boolean).join(" ");
}
