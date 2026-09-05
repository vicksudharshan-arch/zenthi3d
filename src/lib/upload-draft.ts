import type { AftermarketPartNumber, ContributorType, Vehicle } from "@/lib/parts";

const DRAFT_KEY = "zenthi-upload-draft-v1";

export type UploadDraft = {
  name: string;
  description: string;
  uploader: string;
  contributorTypes: ContributorType[];
  category: string;
  referenceOnly: boolean;
  placement: string;
  material: string;
  thickness: string;
  vehicles: Vehicle[];
  oemNumbers: string;
  aftermarket: AftermarketPartNumber[];
  notes: string;
  origin: "zenthi" | "external" | "modified";
  visibility: "private" | "public_reviewed" | "public_auto";
  sourceLink: string;
  licenseType: string;
  originalCreator: string;
  originalLicense: string;
  modificationNotes: string;
};

export function loadUploadDraft(): UploadDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<UploadDraft>;
    if (!parsed || typeof parsed !== "object" || typeof parsed.name !== "string") return null;
    return parsed as UploadDraft;
  } catch {
    return null;
  }
}

export function saveUploadDraft(draft: UploadDraft) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    /* storage full/blocked — draft is best-effort */
  }
}

export function clearUploadDraft() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DRAFT_KEY);
}
