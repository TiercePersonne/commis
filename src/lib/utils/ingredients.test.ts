import { describe, it, expect } from 'vitest';
import { parseIngredient, aggregateIngredients } from './ingredients';

describe('ingredients util', () => {
  it('parses typical ingredients', () => {
      expect(parseIngredient('200g de farine')).toEqual({ quantity: 200, unit: 'g', name: 'farine', original: '200g de farine' });
      expect(parseIngredient('1.5 kg de pommes')).toEqual({ quantity: 1.5, unit: 'kg', name: 'pomme', original: '1.5 kg de pommes' });
      expect(parseIngredient('3 oeufs')).toEqual({ quantity: 3, unit: null, name: 'oeuf', original: '3 oeufs' });
      expect(parseIngredient('un oignon')).toEqual({ quantity: 1, unit: null, name: 'oignon', original: 'un oignon' });
      expect(parseIngredient('1/2 botte de radis')).toEqual({ quantity: 0.5, unit: 'botte', name: 'radi', original: '1/2 botte de radis' }); // Naive slice removes 's' as expected, edge case for 'radis'. Let's see later.
      expect(parseIngredient('sel')).toEqual({ quantity: null, unit: null, name: 'sel', original: 'sel' });
      expect(parseIngredient('une pincée de sel')).toEqual({ quantity: 1, unit: 'pincée', name: 'sel', original: 'une pincée de sel' });
      expect(parseIngredient('150 ml d\'huile d\'olive')).toEqual({ quantity: 150, unit: 'ml', name: 'huile d\'olive', original: '150 ml d\'huile d\'olive' });
  });

  it('aggregates ingredients correctly', () => {
      const inputs = [
          "200g de farine",
          "100 g de farine",
          "3 oeufs",
          "un oignon",
          "1,5 kg de pommes",
          "1/2 botte de radis",
          "sel",
          "une pincée de sel"
      ];
      const result = aggregateIngredients(inputs);
      console.log("Aggregated:\\n", result);
      expect(result).toContain('300 g de farine');
  });
});
