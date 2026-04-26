export interface ParsedIngredient {
  quantity: number | null;
  unit: string | null;
  name: string;
  original: string;
}

const FRACTIONS: Record<string, number> = {
  '1/2': 0.5,
  '1/4': 0.25,
  '3/4': 0.75,
  // B5 — Valeurs précises pour éviter 3×1/3 = 0.99
  '1/3': 0.3333,
  '2/3': 0.6667,
};

const NUMBER_WORDS: Record<string, number> = {
  'un': 1,
  'une': 1,
  'deux': 2,
  'trois': 3,
  'quatre': 4,
  'cinq': 5,
  'six': 6,
  'sept': 7,
  'huit': 8,
  'neuf': 9,
  'dix': 10,
  'demi': 0.5,
  'demie': 0.5,
};

export function parseQuantity(qStatus: string | undefined): number | null {
  if (!qStatus) return null;
  const qLower = qStatus.toLowerCase().trim();
  if (FRACTIONS[qLower]) return FRACTIONS[qLower];
  if (NUMBER_WORDS[qLower]) return NUMBER_WORDS[qLower];
  
  const parsed = parseFloat(qLower.replace(',', '.'));
  if (!isNaN(parsed)) return parsed;
  return null;
}

export function normalizeUnit(unit: string | null): string | null {
  if (!unit) return null;
  const u = unit.toLowerCase().trim();
  if (['g', 'gramme', 'grammes'].includes(u)) return 'g';
  if (['kg', 'kilo', 'kilos', 'kilogramme', 'kilogrammes'].includes(u)) return 'kg';
  if (['ml', 'millilitre', 'millilitres'].includes(u)) return 'ml';
  if (['cl', 'centilitre', 'centilitres'].includes(u)) return 'cl';
  if (['l', 'litre', 'litres'].includes(u)) return 'l';
  if (['cas', 'càs', 'c.à.s', 'c.a.s', 'cuillère à soupe', 'cuillères à soupe'].includes(u)) return 'càs';
  if (['cac', 'càc', 'c.à.c', 'c.a.c', 'cuillère à café', 'cuillères à café'].includes(u)) return 'càc';
  // Keep original for the rest but singularized (naive)
  if (u.endsWith('s') && !['cas', 'càs', 'cac', 'càc'].includes(u)) return u.slice(0, -1);
  return u;
}

export function parseIngredient(text: string): ParsedIngredient {
  const original = text.trim();
  
  // Notice we place longer matches first ('une' before 'un', '1/2' before '\\d', plurals before singular)
  // \\b ensures we don't match 'un' inside 'une' or 'l' inside 'lait'.
  const regex = /^(?:(\d+\/\d+|[\d.,]+|\b(?:une|un|deux|trois|quatre|cinq|demie|demi)\b)\s*)?(?:(kilogrammes|kilogramme|grammes|gramme|millilitres|millilitre|centilitres|centilitre|litres|litre|cuillères à soupe|cuillère à soupe|cuillères à café|cuillère à café|pincées|pincée|gousses|gousse|boîtes|boîte|boites|boite|brins|brin|tasses|tasse|verres|verre|sachets|sachet|bouquets|bouquet|bottes|botte|feuilles|feuille|tranches|tranche|filets|filet|briques|brique|kg|ml|cl|cas|càs|c\.à\.s|c\.a\.s|cac|càc|c\.à\.c|c\.a\.c|g|l)(?:\s+|(?=d'|de |d’))?)?(?:(?:d'|de |d’)\s*)?(.+)$/i;
  
  const match = original.match(regex);
  if (!match) {
    return { quantity: null, unit: null, name: original, original };
  }

  const [, rawQuantity, rawUnit, rawName] = match;

  const quantity = parseQuantity(rawQuantity);
  const unit = normalizeUnit(rawUnit);
  let name = rawName ? rawName.trim().toLowerCase() : original.toLowerCase();

  // B6 — Mots invariables en français (ne pas singulariser)
  const INVARIABLE_WORDS = new Set(['ananas', 'noix', 'maïs', 'bois', 'fois', 'riz', 'pois', 'os', 'fois', 'bas', 'gras', 'gros', 'faux', 'vieux', 'roux', 'doux']);

  // Basic normalization for name (singularize naively)
  if (name.endsWith('s') && !name.endsWith('ss') && !name.endsWith('is') && !name.endsWith('os') && !name.endsWith('us') && !INVARIABLE_WORDS.has(name)) {
      name = name.slice(0, -1);
  }

  return { quantity, unit, name, original };
}

export function aggregateIngredientsList(ingredientsStr: string[]): string[] {
  const parsed = ingredientsStr.map(parseIngredient);

  const aggregated = new Map<string, ParsedIngredient>();

  for (const item of parsed) {
    // Generate a unique key based on name and unit
    const key = `${item.name}|${item.unit || 'none'}`;
    
    if (aggregated.has(key)) {
      const existing = aggregated.get(key)!;
      if (existing.quantity !== null && item.quantity !== null) {
        existing.quantity += item.quantity;
      } else if (existing.quantity === null && item.quantity !== null) {
        existing.quantity = item.quantity;
      }
    } else {
      aggregated.set(key, { ...item }); // clone
    }
  }

  // Format back into string
  const result: string[] = [];
  for (const item of aggregated.values()) {
    // Capitalize properly without accidentally modifying units if no unit
    if (item.quantity !== null || item.unit) {
      let qtyStr = '';
      if (item.quantity !== null) {
        qtyStr = item.quantity.toString().replace('.', ',');
      }
      
      const unitStr = item.unit ? ` ${item.unit}` : '';
      let separator = '';
      if (item.unit) {
          separator = item.name.match(/^[aeiouy]/i) ? " d'" : " de ";
          result.push(`${qtyStr}${unitStr}${separator}${item.name}`);
      } else {
          result.push(`${qtyStr} ${item.name}`.trim());
      }
    } else {
      // Just the name
      result.push(item.name.charAt(0).toUpperCase() + item.name.slice(1));
    }
  }

  return result;
}

export function aggregateIngredients(ingredientsStr: string[]): string {
  return aggregateIngredientsList(ingredientsStr).join('\n');
}
