'use client';

import { useState, useEffect } from 'react';
import { getUserTags, createTag } from '@/app/actions/tags';
import type { Tag } from '@/lib/schemas/tag';

interface TagSelectorProps {
  selectedTags: string[];
  onTagsChange: (tagIds: string[]) => void;
}

export function TagSelector({ selectedTags, onTagsChange }: TagSelectorProps) {
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [error, setError] = useState('');

  const loadTags = async () => {
    const { tags } = await getUserTags();
    if (tags) {
      setAvailableTags(tags);
    }
  };

  useEffect(() => {
    loadTags();
  }, []);

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    const { tag, error } = await createTag(newTagName.trim());
    if (error) {
      setError(error);
      return;
    }

    if (tag) {
      setAvailableTags([...availableTags, tag]);
      onTagsChange([...selectedTags, tag.id]);
      setNewTagName('');
      setIsCreating(false);
      setError('');
    }
  };

  const toggleTag = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      onTagsChange(selectedTags.filter(id => id !== tagId));
    } else {
      onTagsChange([...selectedTags, tagId]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {availableTags.map((tag) => (
          <button
            key={tag.id}
            type="button"
            onClick={() => toggleTag(tag.id)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
              selectedTags.includes(tag.id)
                ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]'
                : 'bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]'
            }`}
          >
            {tag.name}
          </button>
        ))}
      </div>

      {isCreating ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleCreateTag();
              }
              if (e.key === 'Escape') {
                setIsCreating(false);
                setNewTagName('');
                setError('');
              }
            }}
            placeholder="Nom du tag..."
            className="flex-1 px-4 py-2.5 border border-[var(--color-border)] rounded-xl bg-[var(--color-bg-card)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-4 focus:ring-[rgba(196,112,75,0.12)]"
            autoFocus
          />
          <button
            type="button"
            onClick={handleCreateTag}
            className="px-4 py-2.5 bg-[var(--color-accent)] text-white rounded-xl hover:bg-[var(--accent-primary-hover)] text-sm font-medium transition-colors"
          >
            Créer
          </button>
          <button
            type="button"
            onClick={() => {
              setIsCreating(false);
              setNewTagName('');
              setError('');
            }}
            className="px-4 py-2.5 border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-xl hover:bg-[var(--color-bg-secondary)] text-sm font-medium transition-colors"
          >
            Annuler
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsCreating(true)}
          className="px-4 py-2.5 border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-xl hover:bg-[var(--color-bg-secondary)] text-sm font-medium transition-colors"
        >
          + Nouveau tag
        </button>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
