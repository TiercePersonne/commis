/**
 * Construit les consignes de suggestion de tags pour les prompts Gemini,
 * en tenant compte des tags déjà existants chez l'utilisateur.
 */
export function buildTagPromptInstructions(existingTags: string[] = []): string {
  const cleanTags = existingTags.map((t) => t.trim()).filter(Boolean);

  const existingSection =
    cleanTags.length > 0
      ? `\nTags déjà existants dans la bibliothèque de l'utilisateur : [${cleanTags.map((t) => `"${t}"`).join(', ')}].
- PRIORITÉ ABSOLUE : Si un ou plusieurs tags existants correspondent à la recette, utilise-les avec EXACTEMENT la même orthographe.
- Ne propose un NOUVEAU tag que s'il manque une caractéristique essentielle (ex: la protéine principale ou le type de plat n'existe pas encore dans la liste).`
      : `\nL'utilisateur n'a pas encore de tags enregistrés. Propose des tags courts, génériques et réutilisables (première lettre en majuscule).`;

  return `Règles pour "suggested_tags" (2 à 5 tags maximum, en français) :
- Couvre en priorité :
  1. Le type de protéine ou régime (ex: "Poulet", "Bœuf", "Porc", "Poisson", "Fruits de mer", "Œufs", "Végétarien", "Tofu")
  2. Le type de plat (ex: "Soupe", "Tarte", "Pâtes", "Salade", "Plat mijoté", "Gratin", "Bowl", "Sandwich", "Dessert", "Apéro")
  3. Éventuellement une caractéristique forte (ex: "Rapide", "Asiatique", "Italien", "Comfort food")${existingSection}`;
}

/**
 * Normalise un nom de tag pour comparer sans tenir compte de la casse ou des accents.
 */
export function normalizeTagName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}
