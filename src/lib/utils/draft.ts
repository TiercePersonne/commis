import type { ExtractedRecipe } from '@/lib/schemas/import-job';

const DRAFT_KEY = 'commis_import_draft';

export function saveDraft(draft: Partial<ExtractedRecipe>): void {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // localStorage peut être indisponible (mode privé strict)
  }
}

export function loadDraft(): Partial<ExtractedRecipe> | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<ExtractedRecipe>;
  } catch {
    return null;
  }
}

export function clearDraft(): void {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // silencieux
  }
}
