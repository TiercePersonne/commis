import { parseIngredient, aggregateIngredients } from '@/lib/utils/ingredients';

const ingredients = [
  "200g de farine",
  "100 g de farine",
  "3 oeufs",
  "un oignon",
  "1,5 kg de pommes",
  "1/2 botte de radis",
  "sel",
  "une pincée de sel"
];

console.log(ingredients.map(parseIngredient));
