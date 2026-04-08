'use client';

import { useState, useTransition } from 'react';

type SelectedSource = 'web' | 'text' | 'reel' | null;

interface ImportSourceSelectorProps {
  onImportStart?: (jobId: string, url: string) => void;
  onTextImport?: (text: string) => void;
  onReelImport?: (url: string) => void;
  onBulkImport?: () => void;
}

function isValidUrl(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://');
}

export function ImportSourceSelector({ onImportStart, onTextImport, onReelImport, onBulkImport }: ImportSourceSelectorProps) {
  const [selectedSource, setSelectedSource] = useState<SelectedSource>(null);
  const [url, setUrl] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);
  const [reelUrl, setReelUrl] = useState('');
  const [reelUrlError, setReelUrlError] = useState<string | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleCardClick = (source: 'web' | 'text' | 'reel') => {
    setSelectedSource(source === selectedSource ? null : source);
    setUrlError(null);
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUrlError(null);

    if (!isValidUrl(url.trim())) {
      setUrlError("URL invalide. Veuillez coller une adresse web commençant par http:// ou https://");
      return;
    }

    startTransition(async () => {
      if (onImportStart) {
        await onImportStart('', url.trim());
      }
    });
  };

  const handleReelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setReelUrlError(null);

    const trimmed = reelUrl.trim();
    if (!isValidUrl(trimmed)) {
      setReelUrlError("URL invalide. Collez un lien Instagram commençant par https://");
      return;
    }
    if (!trimmed.includes('instagram.com')) {
      setReelUrlError("Ce lien ne semble pas être un lien Instagram.");
      return;
    }

    startTransition(async () => {
      if (onReelImport) {
        await onReelImport(trimmed);
      }
    });
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pastedText.trim()) return;

    startTransition(async () => {
      if (onTextImport) {
        await onTextImport(pastedText.trim());
      }
    });
  };

  const cardBase = 'rounded-[var(--radius-lg)] border-2 bg-[var(--color-bg-card)] p-6 cursor-pointer transition-all select-none focus-visible:outline-none';
  const cardActive = 'border-[var(--color-accent)]';
  const cardInactive = 'border-[var(--color-border)] hover:border-[var(--color-accent)]/50';

  return (
    <div className="mt-6 space-y-4">
      <p className="text-[14px] text-[var(--color-text-secondary)]">
        Choisissez une source pour importer votre recette
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-3xl">

        {/* Carte Site web */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => handleCardClick('web')}
          onKeyDown={(e) => e.key === 'Enter' && handleCardClick('web')}
          aria-pressed={selectedSource === 'web'}
          className={`${cardBase} ${selectedSource === 'web' ? cardActive : cardInactive}`}
          style={selectedSource === 'web' ? { boxShadow: '0 0 0 1px var(--color-accent)' } : {}}
        >
          <div className="text-4xl mb-3">🌐</div>
          <h3 className="font-semibold text-[var(--color-text-primary)] mb-1">Site web</h3>
          <p className="text-[13px] text-[var(--color-text-muted)]">
            Collez l&apos;URL d&apos;une page de recette
          </p>

          {selectedSource === 'web' && (
            <form onSubmit={handleUrlSubmit} className="mt-4" onClick={(e) => e.stopPropagation()}>
              <input
                type="url"
                value={url}
                onChange={(e) => { setUrl(e.target.value); if (urlError) setUrlError(null); }}
                placeholder="https://exemple.com/ma-recette"
                disabled={isPending}
                autoFocus
                className={`w-full px-3 py-2.5 text-[14px] border rounded-[var(--radius-sm)] bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] transition-colors disabled:opacity-50 ${
                  urlError ? 'border-red-400' : 'border-[var(--color-border)] focus:border-[var(--color-accent)]'
                }`}
              />
              {urlError && <p className="mt-1.5 text-[12px] text-red-600">{urlError}</p>}
              <button
                type="submit"
                disabled={isPending || !url.trim()}
                className="mt-3 w-full px-4 py-2.5 bg-[var(--color-accent)] text-white text-[14px] font-medium rounded-[var(--radius-sm)] hover:bg-[var(--accent-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isPending ? 'Import en cours…' : 'Importer'}
              </button>
            </form>
          )}
        </div>

        {/* Carte Coller le texte */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => handleCardClick('text')}
          onKeyDown={(e) => e.key === 'Enter' && handleCardClick('text')}
          aria-pressed={selectedSource === 'text'}
          className={`${cardBase} ${selectedSource === 'text' ? cardActive : cardInactive}`}
          style={selectedSource === 'text' ? { boxShadow: '0 0 0 1px var(--color-accent)' } : {}}
        >
          <div className="text-4xl mb-3">📋</div>
          <h3 className="font-semibold text-[var(--color-text-primary)] mb-1">Coller le texte</h3>
          <p className="text-[13px] text-[var(--color-text-muted)]">
            Copiez le contenu de la page et collez-le ici
          </p>

          {selectedSource === 'text' && (
            <form onSubmit={handleTextSubmit} className="mt-4" onClick={(e) => e.stopPropagation()}>
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Collez ici le texte de la recette (titre, ingrédients, étapes)…"
                disabled={isPending}
                autoFocus
                rows={6}
                className="w-full px-3 py-2.5 text-[13px] border border-[var(--color-border)] rounded-[var(--radius-sm)] bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] resize-y transition-colors disabled:opacity-50 focus:border-[var(--color-accent)]"
              />
              <button
                type="submit"
                disabled={isPending || !pastedText.trim()}
                className="mt-3 w-full px-4 py-2.5 bg-[var(--color-accent)] text-white text-[14px] font-medium rounded-[var(--radius-sm)] hover:bg-[var(--accent-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isPending ? 'Extraction en cours…' : 'Extraire la recette'}
              </button>
            </form>
          )}
        </div>

        {/* Carte Reel Instagram */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => handleCardClick('reel')}
          onKeyDown={(e) => e.key === 'Enter' && handleCardClick('reel')}
          aria-pressed={selectedSource === 'reel'}
          className={`${cardBase} ${selectedSource === 'reel' ? cardActive : cardInactive}`}
          style={selectedSource === 'reel' ? { boxShadow: '0 0 0 1px var(--color-accent)' } : {}}
        >
          <div className="text-4xl mb-3">🎬</div>
          <h3 className="font-semibold text-[var(--color-text-primary)] mb-1">Reel Instagram</h3>
          <p className="text-[13px] text-[var(--color-text-muted)]">
            Collez un lien de Reel pour transcrire la recette
          </p>

          {selectedSource === 'reel' && (
            <form onSubmit={handleReelSubmit} className="mt-4" onClick={(e) => e.stopPropagation()}>
              <input
                type="url"
                value={reelUrl}
                onChange={(e) => { setReelUrl(e.target.value); if (reelUrlError) setReelUrlError(null); }}
                placeholder="https://www.instagram.com/reel/..."
                disabled={isPending}
                autoFocus
                className={`w-full px-3 py-2.5 text-[14px] border rounded-[var(--radius-sm)] bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] transition-colors disabled:opacity-50 ${
                  reelUrlError ? 'border-red-400' : 'border-[var(--color-border)] focus:border-[var(--color-accent)]'
                }`}
              />
              {reelUrlError && <p className="mt-1.5 text-[12px] text-red-600">{reelUrlError}</p>}
              <button
                type="submit"
                disabled={isPending || !reelUrl.trim()}
                className="mt-3 w-full px-4 py-2.5 bg-[var(--color-accent)] text-white text-[14px] font-medium rounded-[var(--radius-sm)] hover:bg-[var(--accent-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isPending ? 'Transcription en cours…' : 'Importer le Reel'}
              </button>
            </form>
          )}
        </div>

        {/* Carte Import en masse */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onBulkImport?.()}
          onKeyDown={(e) => e.key === 'Enter' && onBulkImport?.()}
          className={`${cardBase} ${cardInactive}`}
        >
          <div className="text-4xl mb-3">📦</div>
          <h3 className="font-semibold text-[var(--color-text-primary)] mb-1">Import en masse</h3>
          <p className="text-[13px] text-[var(--color-text-muted)]">
            Collez plusieurs URLs d&apos;un coup (sites web et Reels)
          </p>
        </div>

      </div>
    </div>
  );
}
