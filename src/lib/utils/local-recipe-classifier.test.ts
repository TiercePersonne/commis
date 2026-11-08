import { describe, it, expect } from 'vitest';
import { classifyRecipeLocally, analyzeCollectionLocally } from './local-recipe-classifier';

describe('classifyRecipeLocally', () => {
  it('identifie une recette de pâtes au poulet', () => {
    const tags = classifyRecipeLocally({
      id: '1',
      title: 'Tagliatelles crémeuses au poulet et champignons',
      ingredients: ['300g de tagliatelles', '2 blancs de poulet', '200g de champignons'],
    });
    expect(tags).toContain('Poulet');
    expect(tags).toContain('Pâtes');
  });

  it('identifie une soupe végétarienne sans viande', () => {
    const tags = classifyRecipeLocally({
      id: '2',
      title: 'Velouté de potimarron et lentilles corail',
      ingredients: ['1 potimarron', '150g de lentilles corail', '1 oignon', 'lait de coco'],
    });
    expect(tags).toContain('Soupe');
    expect(tags).toContain('Légumineuses');
    expect(tags).toContain('Végétarien');
  });

  it('ne classe pas un gâteau contenant des œufs comme Végétarien ou Œufs', () => {
    const tags = classifyRecipeLocally({
      id: '3',
      title: 'Gâteau moelleux au chocolat',
      ingredients: ['200g de chocolat noir', '3 œufs', '100g de sucre', '100g de beurre'],
    });
    expect(tags).toContain('Dessert');
    expect(tags).not.toContain('Végétarien');
    expect(tags).not.toContain('Œufs');
  });

  it('analyse une collection complète et regroupe par catégorie', () => {
    const categories = analyzeCollectionLocally(
      [
        { id: '1', title: 'Quiche lorraine', ingredients: ['200g de lardons', '3 œufs'] },
        { id: '2', title: 'Salade César au poulet', ingredients: ['poulet', 'salade romaine', 'parmesan'] },
      ],
      ['Rapide']
    );

    const allTagNames = categories.flatMap((c) => c.tags.map((t) => t.name));
    expect(allTagNames).toContain('Porc & Lardons');
    expect(allTagNames).toContain('Tarte & Quiche');
    expect(allTagNames).toContain('Poulet');
    expect(allTagNames).toContain('Salade');
    expect(allTagNames).toContain('Rapide');
  });
});
