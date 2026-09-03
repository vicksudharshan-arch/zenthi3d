export const CATEGORIES = [
  "suspension",
  "brakes",
  "engine",
  "drivetrain",
  "body_trim",
  "electrical",
  "bracket_mount",
  "interior",
  "housing",
  "cover",
  "other",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  suspension: "Suspension",
  brakes: "Brakes",
  engine: "Engine",
  drivetrain: "Drivetrain",
  body_trim: "Body / Trim",
  electrical: "Electrical",
  bracket_mount: "Bracket / Mount",
  interior: "Interior",
  housing: "Housing",
  cover: "Cover",
  other: "Other",
};

/** Categories that generally warrant the "reference only" nudge. */
export const SAFETY_SENSITIVE_CATEGORIES: string[] = [
  "suspension",
  "brakes",
  "engine",
  "drivetrain",
  "electrical",
];

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

export const DRIVETRAINS = ["RWD", "FWD", "AWD", "4x4"] as const;

/** Makes currently blocked from submissions due to documented aggressive
 *  brand takedown action against community fitment files. */
export const RESTRICTED_MAKES = [
  "Honda",
  "Acura",
  "Chrysler",
  "Dodge",
  "Jeep",
  "Ram",
  "Fiat",
  "Alfa Romeo",
  "Maserati",
  "Peugeot",
  "Citroën",
  "Citroen",
  "DS",
  "DS Automobiles",
  "Opel",
  "Vauxhall",
  "Lancia",
  "Abarth",
] as const;

export const RESTRICTED_MAKE_MESSAGE =
  "Honda/Acura and Stellantis-brand vehicles (Chrysler, Dodge, Jeep, Ram, Fiat, Alfa Romeo, Maserati, Peugeot, Citroën, Opel, Vauxhall, Lancia, Abarth) aren't currently supported due to aggressive brand enforcement against community fitment files.";

export function normalizeMake(make: string) {
  return make
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function isRestrictedMake(make: string): boolean {
  const normalized = normalizeMake(make);
  if (!normalized) return false;
  return RESTRICTED_MAKES.some((m) => normalizeMake(m) === normalized);
}


export type Vehicle = {
  make: string;
  model: string;
  yearFrom: string;
  yearTo: string;
  engineMake?: string;
  engineSeries?: string;
  displacement?: string;
  generation?: string;
  drivetrain?: string;
};

export const emptyVehicle = (): Vehicle => ({
  make: "",
  model: "",
  yearFrom: "",
  yearTo: "",
  engineMake: "",
  engineSeries: "",
  displacement: "",
  generation: "",
  drivetrain: "",
});

export function vehicleLabel(v: Vehicle) {
  const years = [v.yearFrom, v.yearTo].filter(Boolean).join("–");
  return [v.make, v.model, years].filter(Boolean).join(" ");
}

export function vehicleDetailLabel(v: Vehicle) {
  return [v.generation, v.engineMake, v.engineSeries, v.displacement, v.drivetrain]
    .filter(Boolean)
    .join(" · ");
}

export type AftermarketPartNumber = { brand: string; number: string };

/** Extra (non STEP/STL) file kinds a part can carry. */
export const EXTRA_FILE_KINDS = ["obj", "ply", "dxf", "svg", "pdf", "dwg"] as const;
export type ExtraFileKind = (typeof EXTRA_FILE_KINDS)[number];

export const EXTRA_FILE_META: Record<
  ExtraFileKind,
  { label: string; badge: string; accept: string; helper: string }
> = {
  obj: {
    label: "OBJ file (optional)",
    badge: "OBJ · 3D scan",
    accept: ".obj",
    helper: "3D scan mesh. Useful for capturing an original part's real-world geometry.",
  },
  ply: {
    label: "PLY file (optional)",
    badge: "PLY · 3D scan",
    accept: ".ply",
    helper: "Point-cloud / scan mesh, often straight out of a 3D scanner.",
  },
  dxf: {
    label: "DXF file (optional)",
    badge: "DXF · cut / 2D CAD",
    accept: ".dxf",
    helper: "Flat profile for CNC, laser or plasma cutting — also readable as a 2D CAD drawing.",
  },
  svg: {
    label: "SVG file (optional)",
    badge: "SVG · cut profile",
    accept: ".svg",
    helper: "Vector cut profile for laser cutters and plotters.",
  },
  pdf: {
    label: "PDF drawing (optional)",
    badge: "PDF · drawing",
    accept: ".pdf",
    helper: "Dimensioned 2D drawing for manual fabrication at the bench.",
  },
  dwg: {
    label: "DWG drawing (optional)",
    badge: "DWG · 2D CAD",
    accept: ".dwg",
    helper: "AutoCAD 2D drawing for manual fabrication or shop reference.",
  },
};

export type ExtraFile = { kind: string; path: string; name: string; size: number };

export function extraFileBadge(kind: string) {
  return EXTRA_FILE_META[kind as ExtraFileKind]?.badge ?? kind.toUpperCase();
}

export function parseAftermarket(value: unknown): AftermarketPartNumber[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((r): r is AftermarketPartNumber => !!r && typeof r === "object")
    .map((r) => ({ brand: String(r.brand ?? ""), number: String(r.number ?? "") }))
    .filter((r) => r.brand || r.number);
}

export function parseExtraFiles(value: unknown): ExtraFile[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((f): f is ExtraFile => !!f && typeof f === "object")
    .map((f) => ({
      kind: String(f.kind ?? ""),
      path: String(f.path ?? ""),
      name: String(f.name ?? ""),
      size: Number(f.size ?? 0),
    }))
    .filter((f) => f.path && f.name);
}
