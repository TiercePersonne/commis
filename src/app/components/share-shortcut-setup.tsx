'use client';

import { useState, useEffect } from 'react';
import { getMyInboxToken } from '@/app/actions/inbox';

export function ShareShortcutSetup() {
  const [token, setToken] = useState<string | null>(null);
  const [origin, setOrigin] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
    getMyInboxToken().then((res) => {
      if (res.token) setToken(res.token);
    });
  }, []);

  const endpointUrl =
    origin && token ? `${origin}/api/inbox?token=${token}&url=` : '';

  const handleCopy = () => {
    if (!endpointUrl) return;
    navigator.clipboard.writeText(endpointUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-light)] rounded-2xl p-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
          <span>📲</span>
          <span>Partager depuis Instagram en 1 geste</span>
        </h2>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          Envoie directement les Reels Instagram, TikTok ou pages web vers ta file d&apos;attente Commis depuis le bouton <strong>Partager</strong> de ton téléphone, sans quitter ton scroll.
        </p>
      </div>

      {endpointUrl ? (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              readOnly
              value={endpointUrl}
              className="flex-1 px-3.5 py-2.5 text-xs font-mono border border-[var(--color-border)] rounded-xl bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] select-all focus:outline-none"
            />
            <button
              type="button"
              onClick={handleCopy}
              className="px-4 py-2.5 bg-[var(--color-accent)] text-white rounded-xl hover:bg-[var(--accent-primary-hover)] font-medium text-xs transition-colors shrink-0"
            >
              {copied ? '✓ Lien copié !' : 'Copier mon lien de partage'}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowGuide((v) => !v)}
            className="text-xs font-semibold text-[var(--color-accent)] hover:underline inline-flex items-center gap-1"
          >
            <span>{showGuide ? '▼' : '▶'}</span>
            <span>Comment l&apos;ajouter au menu Partager de mon iPhone (30 sec) ?</span>
          </button>

          {showGuide && (
            <div className="p-4 rounded-xl bg-[var(--color-bg-primary)] border border-[var(--color-border)] text-xs text-[var(--color-text-primary)] space-y-2.5 leading-relaxed">
              <p className="font-semibold text-[var(--color-accent)]">
                Configuration unique dans l&apos;app « Raccourcis » de l&apos;iPhone :
              </p>
              <ol className="list-decimal pl-4 space-y-1.5">
                <li>
                  Copie ton lien personnel ci-dessus, puis ouvre l&apos;application <strong>Raccourcis</strong> sur ton iPhone et appuie sur <strong>+</strong> (en haut à droite).
                </li>
                <li>
                  Appuie sur l&apos;icône <strong>(i)</strong> en bas de l&apos;écran → active <strong>« Afficher dans la feuille de partage »</strong> → appuie sur <strong>OK</strong>.
                </li>
                <li>
                  Ajoute l&apos;action <strong>« Obtenir le contenu de l&apos;URL »</strong> : dans le champ URL, colle ton lien copié ci-dessus, puis juste après le <code>url=</code> final, sélectionne la variable <strong>« Entrée du raccourci »</strong>.
                </li>
                <li>
                  Renomme le raccourci <strong>« Envoyer à Commis »</strong> et appuie sur <strong>OK</strong>.
                </li>
              </ol>
              <p className="text-[var(--color-text-secondary)] pt-1">
                ✨ <strong>C&apos;est prêt :</strong> dans Instagram, touche <strong>Partager → Partager sur… → Envoyer à Commis</strong>. Le Reel s&apos;ajoute instantanément dans ta file d&apos;attente sur la page <strong>Import</strong> !
              </p>
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs text-[var(--color-text-muted)]">
          Chargement de ton lien personnel…
        </p>
      )}
    </div>
  );
}
