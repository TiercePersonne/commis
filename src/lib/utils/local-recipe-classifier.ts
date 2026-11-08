import { normalizeTagName } from './tag-prompt';

export type RecipeInputForClassification = {
  id: string;
  title: string;
  ingredients: Array<{ text?: string } | string>;
};

type RuleDefinition = {
  name: string;
  category: 'Protéines & Régimes' | 'Types de plats' | 'Styles & Inspirations';
  titleKeywords: RegExp[];
  ingredientKeywords?: RegExp[];
  savoryOnly?: boolean;
};

function normText(s: string): string {
  return s
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

const DESSERT_TITLE_REGEX =
  /\b(dessert|gateau|gateaux|cookie|cookies|brownie|muffin|muffins|cupcake|tiramisu|mousse au chocolat|crepe|crepes|pancake|pancakes|gaufre|gaufres|brioche|flan|clafoutis|compote|glace|sorbet|financier|madeleine|fondant|moelleux|biscuit|biscuits|sable|sables|meringue|macaron|pavlova|cheesecake|banoffee|tarte aux (pommes|poires|fraises|framboises|myrtilles|citron|prunes|abricots|noix|peches)|tarte au (chocolat|citron|sucre))\b/i;

const SAVORY_TARTE_REGEX =
  /\b(quiche|tourte|tarte salee|tarte (aux|a la|au) (poireaux|courgettes|tomates|oignons|chevre|saumon|thon|lardons|fromage|legumes|epinards|potiron|courge|butternut|moutarde|ricotta|feta|brocoli|champignons))\b/i;

const MEAT_SEAFOOD_REGEX =
  /\b(poulet|dinde|volaille|canard|magret|boeuf|veau|porc|agneau|mouton|lardon|lardons|jambon|bacon|saucisse|saucisses|chorizo|pancetta|guanciale|merguez|steak|viande|chair a saucisse|filet mignon|cote de porc|cotes de porc|saumon|cabillaud|thon|colin|merlu|dorade|daurade|truite|maquereau|sardine|sardines|lieu|poisson|crevette|crevettes|gambas|saint-jacques|moule|moules|calamar|calamars|encornet|poulpe|palourde|anchois|surimi|fruits de mer)\b/i;

const RULES: RuleDefinition[] = [
  // --- Protéines & Régimes ---
  {
    name: 'Poulet',
    category: 'Protéines & Régimes',
    savoryOnly: true,
    titleKeywords: [/\b(poulet|dinde|volaille|canard|magret|aiguillettes)\b/i],
    ingredientKeywords: [/\b(poulet|dinde|volaille|canard|magret|blancs? de poulet|cuisses? de poulet|filets? de poulet)\b/i],
  },
  {
    name: 'Bœuf',
    category: 'Protéines & Régimes',
    savoryOnly: true,
    titleKeywords: [/\b(boeuf|steak|bavette|entrecote|bourguignon|bolognaise|kefta|boulettes de viande|hachis parmentier)\b/i],
    ingredientKeywords: [/\b(boeuf|steak hache|viande hachee|bavette|paleron)\b/i],
  },
  {
    name: 'Porc & Lardons',
    category: 'Protéines & Régimes',
    savoryOnly: true,
    titleKeywords: [/\b(porc|lardons?|jambon|bacon|saucisses?|chorizo|filet mignon|pancetta|guanciale|carbonara|rougail)\b/i],
    ingredientKeywords: [/\b(porc|lardons?|jambon|bacon|saucisses?|chorizo|filet mignon|pancetta|guanciale|chair a saucisse)\b/i],
  },
  {
    name: 'Poisson',
    category: 'Protéines & Régimes',
    savoryOnly: true,
    titleKeywords: [/\b(saumon|cabillaud|thon|colin|merlu|dorade|daurade|truite|maquereau|sardines?|lieu|poisson)\b/i],
    ingredientKeywords: [/\b(saumon|cabillaud|thon|colin|merlu|dorade|daurade|truite|maquereau|sardines?|pave de saumon|filet de poisson)\b/i],
  },
  {
    name: 'Fruits de mer',
    category: 'Protéines & Régimes',
    savoryOnly: true,
    titleKeywords: [/\b(crevettes?|gambas|saint-jacques|moules?|calamars?|encornets?|poulpe|fruits de mer|scampi)\b/i],
    ingredientKeywords: [/\b(crevettes?|gambas|saint-jacques|moules?|calamars?|encornets?|poulpe|palourdes?)\b/i],
  },
  {
    name: 'Œufs',
    category: 'Protéines & Régimes',
    savoryOnly: true,
    titleKeywords: [/\b(oeufs?|omelette|brouilles|cocotte|poches?|mollets?|shakshuka|chakchouka|frittata|tortilla)\b/i],
  },
  {
    name: 'Tofu & Soja',
    category: 'Protéines & Régimes',
    savoryOnly: true,
    titleKeywords: [/\b(tofu|tempeh|seitan|edamame)\b/i],
    ingredientKeywords: [/\b(tofu|tempeh|seitan|proteines de soja)\b/i],
  },
  {
    name: 'Légumineuses',
    category: 'Protéines & Régimes',
    savoryOnly: true,
    titleKeywords: [/\b(lentilles|pois chiches|haricots rouges|haricots blancs|dahl|dal|falafels?|houmous)\b/i],
    ingredientKeywords: [/\b(lentilles|pois chiches|haricots rouges|haricots blancs|flageolets)\b/i],
  },

  // --- Types de plats ---
  {
    name: 'Soupe',
    category: 'Types de plats',
    savoryOnly: true,
    titleKeywords: [/\b(soupe|veloute|bouillon|potage|gaspacho|minestrone|ramen|pho|chorba)\b/i],
  },
  {
    name: 'Pâtes',
    category: 'Types de plats',
    savoryOnly: true,
    titleKeywords: [
      /\b(pates|pasta|spaghettis?|penne|tagliatelles?|linguine|rigatoni|fusilli|macaronis?|lasagnes?|gnocchis?|raviolis?|tortellinis?|orzo|coquillettes|farfalle|nouilles|udon|soba|ramen|mac and cheese|cannellonis?)\b/i,
    ],
    ingredientKeywords: [
      /\b(spaghettis?|penne|tagliatelles?|linguine|rigatoni|fusilli|macaronis?|lasagnes?|gnocchis?|raviolis?|tortellinis?|orzo|coquillettes|farfalle|nouilles|udon|soba)\b/i,
    ],
  },
  {
    name: 'Tarte & Quiche',
    category: 'Types de plats',
    savoryOnly: true,
    titleKeywords: [
      SAVORY_TARTE_REGEX,
      /\b(quiche|tourte|galette de sarrasin|feuillete|chausson|empanadas?|samoussas?|bricks?|tarte)\b/i,
    ],
  },
  {
    name: 'Salade',
    category: 'Types de plats',
    savoryOnly: true,
    titleKeywords: [/\b(salade|taboule|cesar|coleslaw|carpaccio)\b/i],
  },
  {
    name: 'Bowl & Riz',
    category: 'Types de plats',
    savoryOnly: true,
    titleKeywords: [/\b(bowl|poke|bibimbap|riz|risotto|paella|pilaf|chirashi|onigiri|bo bun|bobun)\b/i],
  },
  {
    name: 'Gratin & Four',
    category: 'Types de plats',
    savoryOnly: true,
    titleKeywords: [/\b(gratin|dauphinois|parmentier|moussaka|lasagnes?|cannellonis?|tian|tartiflette|croziflette|roti|au four|farcis?)\b/i],
  },
  {
    name: 'Plat cuisiné',
    category: 'Types de plats',
    savoryOnly: true,
    titleKeywords: [
      /\b(curry|dahl|dal|tajine|couscous|blanquette|bourguignon|chili|ragout|mijote|tikka|butter chicken|korma|basquaise|marengo|stroganoff|rougail|colombo|yassa|mafe|chakchouka|shakshuka|poelee)\b/i,
    ],
  },
  {
    name: 'Sandwich & Street-food',
    category: 'Types de plats',
    savoryOnly: true,
    titleKeywords: [
      /\b(sandwich|burger|wrap|bagel|croque|bruschetta|tartine|toast|quesadilla|fajitas?|tacos?|burrito|pita|kebab|bao|panini|focaccia|pizza|naan|galette)\b/i,
    ],
  },
  {
    name: 'Apéro & Entrée',
    category: 'Types de plats',
    savoryOnly: true,
    titleKeywords: [
      /\b(apero|aperitif|houmous|guacamole|tapenade|tzatziki|dip|tartinade|cake sale|gougeres|verrine|accras|nems?|gyozas?|rouleaux de printemps)\b/i,
    ],
  },
  {
    name: 'Dessert',
    category: 'Types de plats',
    titleKeywords: [DESSERT_TITLE_REGEX],
  },

  // --- Styles & Inspirations ---
  {
    name: 'Asiatique',
    category: 'Styles & Inspirations',
    savoryOnly: true,
    titleKeywords: [
      /\b(asiatique|wok|teriyaki|ramen|udon|pad thai|gyozas?|bao|nems?|bo bun|bobun|bibimbap|miso|satay|sesame|coreen|japonais|chinois|thai|vietnamien)\b/i,
    ],
    ingredientKeywords: [
      /\b(sauce soja|huile de sesame|nuoc[- ]mam|mirin|miso|pate de curry|vinaigre de riz|gingembre frais)\b/i,
    ],
  },
  {
    name: 'Italien',
    category: 'Styles & Inspirations',
    savoryOnly: true,
    titleKeywords: [
      /\b(italien|risotto|pesto|gnocchis?|lasagnes?|carbonara|bolognaise|bruschetta|focaccia|orzo|milanais|parmigiana|arrabbiata|cacio e pepe|puttanesca)\b/i,
    ],
    ingredientKeywords: [/\b(parmesan|parmigiano|burrata|mascarpone|guanciale|pecorino|gorgonzola|pesto)\b/i],
  },
  {
    name: 'Méditerranéen & Oriental',
    category: 'Styles & Inspirations',
    savoryOnly: true,
    titleKeywords: [
      /\b(couscous|tajine|chakchouka|shakshuka|falafels?|houmous|tzatziki|halloumi|feta|grec|libanais|marocain|oriental|mediterraneen|kefta|zaatar)\b/i,
    ],
    ingredientKeywords: [/\b(feta|halloumi|tahini|ras el hanout|harissa|zaatar|eau de fleur d'oranger)\b/i],
  },
  {
    name: 'Fromager',
    category: 'Styles & Inspirations',
    savoryOnly: true,
    titleKeywords: [
      /\b(fromage|reblochon|raclette|tartiflette|croziflette|chevre|comte|cheddar|camembert|mozzarella|burrata|feta|halloumi|roquefort|gorgonzola|mac and cheese)\b/i,
    ],
  },
];

export function classifyRecipeLocally(
  recipe: RecipeInputForClassification,
  allowedTagNames?: string[]
): string[] {
  const title = normText(recipe.title || '');
  const ingText = normText(
    (recipe.ingredients || [])
      .map((i) => (typeof i === 'string' ? i : i.text || ''))
      .join(' ')
  );
  const combined = `${title} ${ingText}`;

  const isDessert = DESSERT_TITLE_REGEX.test(title) && !SAVORY_TARTE_REGEX.test(title);
  const hasMeatOrFish = MEAT_SEAFOOD_REGEX.test(combined);

  const matched = new Set<string>();

  for (const rule of RULES) {
    if (rule.savoryOnly && isDessert) continue;
    const titleHit = rule.titleKeywords.some((rx) => rx.test(title));
    const ingHit = rule.ingredientKeywords ? rule.ingredientKeywords.some((rx) => rx.test(ingText)) : false;
    if (titleHit || ingHit) {
      matched.add(rule.name);
    }
  }

  // Détection Végétarien automatique pour les plats salés sans viande ni poisson
  if (!isDessert && !hasMeatOrFish) {
    matched.add('Végétarien');
  }

  // Si un plat salé n'a aucun type de plat détecté, le classer en "Plat cuisiné"
  const dishTypeNames = RULES.filter((r) => r.category === 'Types de plats').map((r) => r.name);
  if (!isDessert && !dishTypeNames.some((d) => matched.has(d))) {
    matched.add('Plat cuisiné');
  }

  if (allowedTagNames && allowedTagNames.length > 0) {
    const allowedByNorm = new Map(allowedTagNames.map((n) => [normalizeTagName(n), n]));
    const result: string[] = [];

    for (const m of matched) {
      const exactAllowed = allowedByNorm.get(normalizeTagName(m));
      if (exactAllowed) {
        result.push(exactAllowed);
      }
    }

    // Aussi vérifier si un tag personnalisé de l'utilisateur apparaît directement dans le titre ou les ingrédients
    for (const userTag of allowedTagNames) {
      if (result.includes(userTag)) continue;
      const norm = normText(userTag.trim());
      if (norm.length >= 3 && combined.includes(norm)) {
        result.push(userTag);
      }
    }

    return result.slice(0, 5);
  }

  return Array.from(matched).slice(0, 5);
}

export function analyzeCollectionLocally(
  recipes: RecipeInputForClassification[],
  existingTagNames: string[]
): Array<{
  category: string;
  tags: Array<{ name: string; isExisting: boolean; estimatedCount: number }>;
}> {
  const existingNormMap = new Map(existingTagNames.map((n) => [normalizeTagName(n), n]));
  const countsByNorm = new Map<string, { name: string; category: string; count: number }>();

  const ruleCategoryMap = new Map<string, string>();
  for (const r of RULES) {
    ruleCategoryMap.set(normalizeTagName(r.name), r.category);
  }
  ruleCategoryMap.set(normalizeTagName('Végétarien'), 'Protéines & Régimes');

  for (const recipe of recipes) {
    const tags = classifyRecipeLocally(recipe, [...RULES.map((r) => r.name), 'Végétarien', ...existingTagNames]);
    for (const t of tags) {
      const norm = normalizeTagName(t);
      const displayName = existingNormMap.get(norm) ?? t;
      const category = ruleCategoryMap.get(norm) ?? 'Vos tags existants';
      const prev = countsByNorm.get(norm);
      if (prev) {
        prev.count += 1;
      } else {
        countsByNorm.set(norm, { name: displayName, category, count: 1 });
      }
    }
  }

  for (const existing of existingTagNames) {
    const norm = normalizeTagName(existing);
    if (!countsByNorm.has(norm)) {
      countsByNorm.set(norm, {
        name: existing,
        category: ruleCategoryMap.get(norm) ?? 'Vos tags existants',
        count: 1,
      });
    }
  }

  const categoryOrder = [
    'Protéines & Régimes',
    'Types de plats',
    'Styles & Inspirations',
    'Vos tags existants',
  ];

  return categoryOrder
    .map((catName) => {
      const items = Array.from(countsByNorm.values())
        .filter((item) => item.category === catName && item.count > 0)
        .sort((a, b) => b.count - a.count)
        .map((item) => ({
          name: item.name,
          isExisting: existingNormMap.has(normalizeTagName(item.name)),
          estimatedCount: item.count,
        }));
      return { category: catName, tags: items };
    })
    .filter((c) => c.tags.length > 0);
}
