import { describe, it, expect } from 'vitest';
import { extractFromJsonLd, extractFromHtml, normalizeImageUrl, isImageUrl, extractImageFromMarkdown } from './import-web';

const RECIPE_JSONLD_HTML = `
<html><head>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Recipe",
  "name": "Tarte aux pommes",
  "recipeIngredient": ["4 pommes", "200g de farine", "100g de beurre"],
  "recipeInstructions": [
    { "@type": "HowToStep", "text": "Éplucher les pommes" },
    { "@type": "HowToStep", "text": "Faire la pâte" }
  ],
  "image": "https://example.com/tarte.jpg",
  "keywords": "tarte, dessert",
  "recipeCategory": "Dessert"
}
</script>
</head><body></body></html>
`;

const NO_JSONLD_HTML = `<html><body><h1>Pas de recette ici</h1></body></html>`;

const SIMPLE_HTML = `
<html><body>
<h1>Soupe au potiron</h1>
<ul>
  <li>1 potiron</li>
  <li>1 oignon</li>
  <li>500ml bouillon</li>
</ul>
<ol>
  <li>Couper le potiron en cubes</li>
  <li>Faire revenir l'oignon</li>
  <li>Mixer et servir</li>
</ol>
</body></html>
`;

describe('extractFromJsonLd', () => {
  it('extrait une recette depuis un JSON-LD valide', () => {
    const result = extractFromJsonLd(RECIPE_JSONLD_HTML);
    expect(result).not.toBeNull();
    expect(result!.title).toBe('Tarte aux pommes');
    expect(result!.ingredients).toHaveLength(3);
    expect(result!.ingredients[0]).toEqual({ text: '4 pommes', order: 0 });
    expect(result!.steps).toHaveLength(2);
    expect(result!.steps[0]).toEqual({ text: 'Éplucher les pommes', order: 0 });
    expect(result!.image_url).toBe('https://example.com/tarte.jpg');
    expect(result!.suggested_tags).toContain('Dessert');
  });

  it('retourne null si pas de JSON-LD Recipe', () => {
    const result = extractFromJsonLd(NO_JSONLD_HTML);
    expect(result).toBeNull();
  });

  it('retourne null pour un HTML vide', () => {
    expect(extractFromJsonLd('')).toBeNull();
  });

  it('gère un JSON-LD malformé sans crasher', () => {
    const html = `<script type="application/ld+json">{ invalid json }</script>`;
    expect(() => extractFromJsonLd(html)).not.toThrow();
    expect(extractFromJsonLd(html)).toBeNull();
  });

  it('extrait image depuis un array', () => {
    const html = `<script type="application/ld+json">
    { "@type": "Recipe", "name": "Test", "recipeIngredient": ["a"], "recipeInstructions": ["b"],
      "image": ["https://img1.com", "https://img2.com"] }
    </script>`;
    const result = extractFromJsonLd(html);
    expect(result!.image_url).toBe('https://img1.com');
  });
});

describe('extractFromHtml', () => {
  it('extrait titre, ingrédients et étapes depuis HTML simple', () => {
    const result = extractFromHtml(SIMPLE_HTML);
    expect(result).not.toBeNull();
    expect(result!.title).toBe('Soupe au potiron');
    expect(result!.ingredients).toHaveLength(3);
    expect(result!.steps).toHaveLength(3);
    expect(result!.ingredients[0]).toEqual({ text: '1 potiron', order: 0 });
  });

  it('retourne null si pas de titre h1', () => {
    const html = `<html><body><ul><li>item</li></ul></body></html>`;
    expect(extractFromHtml(html)).toBeNull();
  });

  it('retourne null si pas de listes', () => {
    const html = `<html><body><h1>Titre seul</h1></body></html>`;
    expect(extractFromHtml(html)).toBeNull();
  });
});

describe('normalizeImageUrl', () => {
  const source = 'https://www.papillesetpupilles.fr/recette/gateau/';

  it('retourne une URL absolue valide telle quelle', () => {
    expect(normalizeImageUrl('https://cdn.example.com/img.jpg', source)).toBe('https://cdn.example.com/img.jpg');
  });

  it('résout une URL relative en URL absolue', () => {
    expect(normalizeImageUrl('/images/gateau.jpg', source)).toBe('https://www.papillesetpupilles.fr/images/gateau.jpg');
  });

  it('retourne null pour une URL null', () => {
    expect(normalizeImageUrl(null, source)).toBeNull();
  });

  it('retourne null pour un protocole non-http', () => {
    expect(normalizeImageUrl('data:image/png;base64,abc', source)).toBeNull();
  });

  it('retourne null pour un protocole ftp', () => {
    expect(normalizeImageUrl('ftp://example.com/image.jpg', source)).toBeNull();
  });
});

describe('isImageUrl', () => {
  it('reconnaît un .jpg', () => {
    expect(isImageUrl('https://cdn.example.com/photo.jpg')).toBe(true);
  });

  it('reconnaît un .jpeg avec query string', () => {
    expect(isImageUrl('https://cdn.example.com/photo.jpeg?v=2')).toBe(true);
  });

  it('reconnaît un .webp', () => {
    expect(isImageUrl('https://cdn.example.com/photo.webp')).toBe(true);
  });

  it('reconnaît un .png', () => {
    expect(isImageUrl('https://cdn.example.com/photo.png')).toBe(true);
  });

  it('rejette une URL de page web', () => {
    expect(isImageUrl('https://lacuisinedebernard.com/omelette-du-cure/')).toBe(false);
  });

  it('rejette une URL sans extension image', () => {
    expect(isImageUrl('https://example.com/api/image/123')).toBe(false);
  });

  it('retourne false pour null', () => {
    expect(isImageUrl(null)).toBe(false);
  });
});

describe('extractImageFromMarkdown', () => {
  it('extrait la première URL d\'image valide du markdown', () => {
    const md = `# Recette\n\n![Photo](https://cdn.lacuisinedebernard.com/wp-content/uploads/2026/01/IMG_7813.jpg)\n\nIngrédients...`;
    expect(extractImageFromMarkdown(md)).toBe('https://cdn.lacuisinedebernard.com/wp-content/uploads/2026/01/IMG_7813.jpg');
  });

  it('ignore les logos et icônes', () => {
    const md = `![logo](https://example.com/logo.png)\n![icon](https://example.com/icon.svg)\n![Recette](https://cdn.example.com/photo.jpg)`;
    expect(extractImageFromMarkdown(md)).toBe('https://cdn.example.com/photo.jpg');
  });

  it('ignore les images sans extension image dans le path', () => {
    const md = `![Page](https://lacuisinedebernard.com/omelette/)\n![Photo](https://cdn.example.com/recette.webp)`;
    expect(extractImageFromMarkdown(md)).toBe('https://cdn.example.com/recette.webp');
  });

  it('retourne null si aucune image valide', () => {
    const md = `# Titre\n\nPas d'image ici.`;
    expect(extractImageFromMarkdown(md)).toBeNull();
  });

  it('retourne null pour un markdown vide', () => {
    expect(extractImageFromMarkdown('')).toBeNull();
  });
});
