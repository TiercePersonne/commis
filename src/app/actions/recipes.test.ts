import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateRecipeRating } from './recipes';

// Mock de Supabase et Next.js
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve({
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'user-123' } }, error: null }))
    },
    from: vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: {}, error: null }))
        }))
      }))
    }))
  }))
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn()
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn()
}));

describe('updateRecipeRating action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait retourner une erreur si la note est invalide (> 5)', async () => {
    const result = await updateRecipeRating('recipe-1', 6);
    expect(result.error).toBe('La note doit être comprise entre 0 et 5');
  });

  it('devrait retourner une erreur si la note est invalide (< 0)', async () => {
    const result = await updateRecipeRating('recipe-1', -1);
    expect(result.error).toBe('La note doit être comprise entre 0 et 5');
  });

  it('devrait retourner un objet vide en cas de succès', async () => {
    const result = await updateRecipeRating('recipe-1', 4);
    expect(result.error).toBeUndefined();
  });
});
