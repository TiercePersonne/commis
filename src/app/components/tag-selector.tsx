'use client';

import { useState, useEffect, useRef } from 'react';
import { Sparkles, Plus } from 'lucide-react';
import { getUserTags, createTag } from '@/app/actions/tags';
import { normalizeTagName } from '@/lib/utils/tag-prompt';
import type { Tag } from '@/lib/schemas/tag';

interface TagSelectorProps {
  selectedTags: string[];
  onTagsChange: (tagIds: string[]) => void;
  suggestedTagNames?: string[];
}

export function TagSelector({
  selectedTags,
  onTagsChange,
  suggestedTagNames = [],
}: TagSelectorProps) {
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [creatingSuggested, setCreatingSuggested] = useState<string | null>(null);
  const [newTagName, setNewTagName] = useState('');
  const [error, setError] = useState('');
  const appliedSuggestionsRef = useRef<string>('');

  useEffect(() => {
    const loadTags = async () => {
      const { tags } = await getUserTags();
      if (tags) {
        setAvailableTags(tags);
      }
    };
    loadTags();
  }, []);

  useEffect(() => {
    if (!availableTags.length || !suggestedTagNames.length) return;
    const signature = suggestedTagNames.map(normalizeTagName).sort().join('|');
    if (appliedSuggestionsRef.current === signature) return;
    appliedSuggestionsRef.current = signature;

    const suggestedNormalized = new Set(suggestedTagNames.map(normalizeTagName));
    const matchingExistingIds = availableTags
      .filter((t) => suggestedNormalized.has(normalizeTagName(t.name)))
      .map((t) => t.id);

    if (matchingExistingIds.length > 0) {
      const merged = Array.from(new Set([...selectedTags, ...matchingExistingIds]));
      if (merged.length !== selectedTags.length) {
        onTagsChange(merged);
      }
    }
  }, [availableTags, suggestedTagNames, selectedTags, onTagsChange]);

  const suggestedNormalizedSet = new Set(suggestedTagNames.map(normalizeTagName));

  const existingNormalizedSet = new Set(availableTags.map((t) => normalizeTagName(t.name)));
  const newSuggestedTags = Array.from(
    new Map(
      suggestedTagNames
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !existingNormalizedSet.has(normalizeTagName(s)))
        .map((s) => [normalizeTagName(s), s.charAt(0).toUpperCase() + s.slice(1)])
    ).values()
  );

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

  const handleCreateSuggestedTag = async (name: string) => {
    setCreatingSuggested(name);
    setError('');
    const { tag, error } = await createTag(name);
    setCreatingSuggested(null);

    if (error) {
      setError(error);
      return;
    }

    if (tag) {
      setAvailableTags((prev) => [...prev, tag]);
      if (!selectedTags.includes(tag.id)) {
        onTagsChange([...selectedTags, tag.id]);
      }
    }
  };

  const handleCreateAllSuggestedTags = async () => {
    if (!newSuggestedTags.length) return;
    setCreatingSuggested('__ALL__');
    setError('');

    const createdTags: Tag[] = [];
    for (const name of newSuggestedTags) {
      const { tag } = await createTag(name);
      if (tag) {
        createdTags.push(tag);
      }
    }

    setCreatingSuggested(null);
    if (createdTags.length > 0) {
      setAvailableTags((prev) => [...prev, ...createdTags]);
      const newIds = createdTags.map((t) => t.id);
      onTagsChange(Array.from(new Set([...selectedTags, ...newIds])));
    }
  };

  const toggleTag = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      onTagsChange(selectedTags.filter((id) => id !== tagId));
    } else {
      onTagsChange([...selectedTags, tagId]);
    }
  };

  return (
    <div className="space-y-3">
      {/* Encart des nouveaux tags suggérés par l'IA */}
      {newSuggestedTags.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/30 space-y-2.5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="text-xs font-semibold text-[var(--color-accent)] flex items-center gap-1.5">
              <Sparkles size={13} strokeWidth={1.7} />
              <span>Nouveaux tags suggérés par l&apos;IA (cliquer pour créer et associer)</span>
            </p>
            {newSuggestedTags.length > 1 && (
              <button
                type="button"
                onClick={handleCreateAllSuggestedTags}
                disabled={creatingSuggested !== null}
                className="text-xs font-semibold text-[var(--color-accent)] underline hover:opacity-80 disabled:opacity-50"
              >
                {creatingSuggested === '__ALL__' ? 'Création…' : '+ Tout créer et associer'}
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {newSuggestedTags.map((tagName) => (
              <button
                key={tagName}
                type="button"
                disabled={creatingSuggested !== null}
                onClick={() => handleCreateSuggestedTag(tagName)}
                className="px-3 py-1 rounded-full text-xs font-medium border border-dashed border-[var(--color-accent)] bg-white/5 text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-white transition-colors disabled:opacity-50"
              >
                {creatingSuggested === tagName ? 'Création…' : `+ ${tagName}`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Liste des tags existants */}
      <div className="flex flex-wrap gap-2">
        {availableTags.map((tag) => {
          const isSelected = selectedTags.includes(tag.id);
          const isAiSuggested = suggestedNormalizedSet.has(normalizeTagName(tag.name));
          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggleTag(tag.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all border inline-flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]'
                  : 'glass-pill text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]'
              }`}
            >
              {isAiSuggested && (
                <Sparkles size={12} strokeWidth={1.8} className="shrink-0" />
              )}
              <span>{tag.name}</span>
            </button>
          );
        })}
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
            className="flex-1 px-4 py-2.5 rounded-xl glass-panel text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)]"
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
            className="px-4 py-2.5 glass-pill text-[var(--color-text-primary)] rounded-xl hover:bg-white/10 text-sm font-medium transition-colors"
          >
            Annuler
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsCreating(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 glass-pill text-[var(--color-text-primary)] rounded-xl hover:border-[var(--color-accent)] text-xs sm:text-sm font-medium transition-colors"
        >
          <Plus size={14} strokeWidth={1.8} />
          <span>Nouveau tag</span>
        </button>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
