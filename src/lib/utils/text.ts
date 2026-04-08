/**
 * Met la première lettre en majuscule et le reste en minuscule.
 * Exemple : "POULET RÔTI AU CITRON" → "Poulet rôti au citron"
 */
export function toSentenceCase(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
