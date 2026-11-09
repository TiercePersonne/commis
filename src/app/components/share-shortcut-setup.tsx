'use client';

import { useState, useEffect } from 'react';
import { Share2, Check, Copy, ChevronDown, ChevronRight, Sparkles } from 'lucide-react';
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
    <div className="glass-panel rounded-3xl p-6 space-y-4">
      <div>
        <h2 className="text-base sm:text-lg font-serif font-medium text-[var(--color-text-primary)] flex items-center gap-2">
          <Share2 size={18} strokeWidth={1.6} className="text-[var(--color-accent)]" />
          <span>Partager depuis Instagram en 1 geste</span>
        </h2>
        <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-1">
          Envoyez directement les Reels Instagram, TikTok ou pages web vers votre file d&apos;attente Commis depuis le bouton <strong>Partager</strong> de votre téléphone.
        </p>
      </div>

      {endpointUrl ? (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              readOnly
              value={endpointUrl}
              className="flex-1 px-3.5 py-2.5 text-xs font-mono border border-[var(--color-border)] rounded-xl bg-white/5 text-[var(--color-text-secondary)] select-all focus:outline-none"
            />
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[var(--color-accent)] text-white rounded-xl hover:bg-[var(--accent-primary-hover)] font-medium text-xs transition-colors shrink-0"
            >
              {copied ? (
                <>
                  <Check size={14} strokeWidth={2} />
                  <span>Lien copié</span>
                </>
              ) : (
                <>
                  <Copy size={14} strokeWidth={1.6} />
                  <span>Copier mon lien de partage</span>
                </>
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowGuide((v) => !v)}
            className="text-xs font-semibold text-[var(--color-accent)] hover:underline inline-flex items-center gap-1"
          >
            {showGuide ? (
              <ChevronDown size={14} strokeWidth={1.8} />
            ) : (
              <ChevronRight size={14} strokeWidth={1.8} />
            )}
            <span>Comment l&apos;ajouter au menu Partager de mon iPhone (30 sec) ?</span>
          </button>

          {showGuide && (
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 text-xs text-[var(--color-text-primary)] space-y-2.5 leading-relaxed">
              <p className="font-semibold text-[var(--color-accent)]">
                Configuration unique dans l&apos;app « Raccourcis » de l&apos;iPhone :
              </p>
              <ol className="list-decimal pl-4 space-y-1.5 text-[var(--color-text-secondary)]">
                <li>
                  Copiez votre lien personnel ci-dessus, puis ouvrez l&apos;application <strong>Raccourcis</strong> sur votre iPhone et appuyez sur <strong>+</strong>.
                </li>
                <li>
                  Appuyez sur l&apos;icône <strong>(i)</strong> en bas de l&apos;écran → activez <strong>« Afficher dans la feuille de partage »</strong> → appuyez sur <strong>OK</strong>.
                </li>
                <li>
                  Ajoutez l&apos;action <strong>« Obtenir le contenu de l&apos;URL »</strong> : dans le champ URL, collez votre lien copié ci-dessus, puis juste après le <code>url=</code> final, sélectionnez la variable <strong>« Entrée du raccourci »</strong>.
                </li>
                <li>
                  Renommez le raccourci <strong>« Envoyer à Commis »</strong> et appuyez sur <strong>OK</strong>.
                </li>
              </ol>
              <p className="text-[var(--color-text-secondary)] pt-1 flex items-start gap-1.5">
                <Sparkles size={14} strokeWidth={1.7} className="text-[var(--color-accent)] shrink-0 mt-0.5" />
                <span>
                  <strong>C&apos;est prêt :</strong> dans Instagram, touchez <strong>Partager → Partager sur… → Envoyer à Commis</strong>. Le Reel s&apos;ajoute instantanément dans votre file d&apos;attente sur la page <strong>Import</strong>.
                </span>
              </p>
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs text-[var(--color-text-muted)]">
          Chargement de votre lien personnel…
        </p>
      )}
    </div>
  );
}
