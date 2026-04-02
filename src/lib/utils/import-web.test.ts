import { describe, it, expect } from 'vitest';
import { extractFromJsonLd, extractFromHtml } from './import-web';

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
