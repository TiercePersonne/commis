/**
 * Met la première lettre en majuscule et le reste en minuscule.
 * Exemple : "POULET RÔTI AU CITRON" → "Poulet rôti au citron"
 */
export function toSentenceCase(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Normalise une chaîne pour la recherche : minuscule, ligature remplacée, sans accents, sans espaces superflus.
 * Exemple : "Crêpe à la pâte d'amande" → "crepe a la pate d'amande"
 */
export function normalizeSearch(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}
