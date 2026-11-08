import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TagSelector } from './tag-selector';

const mockGetUserTags = vi.fn();
const mockCreateTag = vi.fn();

vi.mock('@/app/actions/tags', () => ({
  getUserTags: () => mockGetUserTags(),
  createTag: (name: string) => mockCreateTag(name),
}));

describe('TagSelector avec suggestions IA', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUserTags.mockResolvedValue({
      tags: [
        { id: 'tag-1', user_id: 'u1', name: 'Poulet', created_at: '2026-01-01' },
        { id: 'tag-2', user_id: 'u1', name: 'Pâtes', created_at: '2026-01-01' },
      ],
    });
  });

  it('pré-sélectionne automatiquement les tags existants suggérés par l’IA (insensible aux accents/casse)', async () => {
    const onTagsChange = vi.fn();
    render(
      <TagSelector
        selectedTags={[]}
        onTagsChange={onTagsChange}
        suggestedTagNames={['poulet', 'pates', ' Plat mijoté ']}
      />
    );

    await waitFor(() => {
      expect(onTagsChange).toHaveBeenCalledWith(['tag-1', 'tag-2']);
    });

    // Le nouveau tag "Plat mijoté" doit être proposé à la création
    expect(screen.getByText('+ Plat mijoté')).toBeInTheDocument();
  });

  it('permet de créer et associer un nouveau tag suggéré en un clic', async () => {
    mockCreateTag.mockResolvedValue({
      tag: { id: 'tag-3', user_id: 'u1', name: 'Soupe', created_at: '2026-01-01' },
    });

    const onTagsChange = vi.fn();
    render(
      <TagSelector
        selectedTags={['tag-1']}
        onTagsChange={onTagsChange}
        suggestedTagNames={['Soupe']}
      />
    );

    const createSuggestedBtn = await screen.findByText('+ Soupe');
    fireEvent.click(createSuggestedBtn);

    await waitFor(() => {
      expect(mockCreateTag).toHaveBeenCalledWith('Soupe');
      expect(onTagsChange).toHaveBeenCalledWith(['tag-1', 'tag-3']);
    });
  });
});
