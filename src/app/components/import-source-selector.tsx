'use client';

import { useState, useTransition, useEffect } from 'react';
import {
  Globe,
  Film,
  Camera,
  FileText,
  Layers,
  Inbox,
  Zap,
  Plus,
  X,
  ClipboardPaste,
} from 'lucide-react';
import { BulkImportView } from './bulk-import-view';
import type { QueuedLinkItem } from '@/app/actions/inbox';

type SelectedSource = 'web' | 'text' | 'reel' | 'image' | 'bulk';

function FakeProgressButton({ source }: { source: 'web' | 'reel' | 'image' | 'text' }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const max = 95;
    const speedFactor = source === 'reel' ? 0.04 : source === 'image' ? 0.08 : 0.2;

    const timer = setInterval(() => {
      setProgress((p) => {
        if (p < max) {
          const increment = (max - p) * speedFactor;
          return Math.min(p + increment, max);
        }
        return p;
      });
    }, 200);

    return () => clearInterval(timer);
  }, [source]);

  const steps = {
    web: [
      'Visite du site web...',
      'Lecture de la recette...',
      "L'IA prépare les ingrédients...",
      'Dressage presque terminé...',
    ],
    reel: [
      'Visionnage de la vidéo...',
      "L'IA prend des notes...",
      'Organisation des étapes...',
      "On dresse l'assiette...",
    ],
    image: [
      "L'IA étudie votre image...",
      'Déchiffrage du menu...',
      'Mise au propre...',
      'Dernières retouches...',
    ],
    text: [
      'Lecture de vos notes...',
      'Tri des informations...',
      'Mise dans le bon ordre...',
      "C'est presque prêt !",
    ],
  }[source];

  const stepIndex = progress < 25 ? 0 : progress < 55 ? 1 : progress < 85 ? 2 : 3;
  const currentText = steps[stepIndex];

  return (
    <div className="w-full mt-4">
      <div className="flex justify-between items-center mb-2 px-1">
        <span className="text-[13px] font-medium text-[var(--color-accent)] animate-pulse">
          {currentText}
        </span>
        <span className="text-[12px] font-bold text-[var(--color-text-muted)]">
          {Math.round(progress)}%
        </span>
      </div>
      <div className="h-2.5 w-full bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-[var(--color-accent)] transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(
                new File([blob], file.name.replace(/\.[^/.]+$/, '') + '.jpeg', {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                })
              );
            } else {
              reject(new Error('Canvas to Blob failed'));
            }
          },
          'image/jpeg',
          0.75
        );
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
}

interface ImportSourceSelectorProps {
  onImportStart?: (jobId: string, url: string) => void;
  onTextImport?: (text: string) => void;
  onReelImport?: (url: string) => void;
  onImageImport?: (formData: FormData) => void;
  onBulkDone?: () => void;
  queuedLinks?: QueuedLinkItem[];
  onRemoveQueuedLink?: (url: string) => void;
  onClearQueuedLinks?: () => void;
  initialTab?: SelectedSource;
}

function isValidUrl(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://');
}

function isShortVideoUrl(url: string): boolean {
  return (
    url.includes('instagram.com') ||
    url.includes('tiktok.com') ||
    url.includes('youtube.com/shorts') ||
    url.includes('youtu.be')
  );
}

export function ImportSourceSelector({
  onImportStart,
  onTextImport,
  onReelImport,
  onImageImport,
  onBulkDone,
  queuedLinks = [],
  onRemoveQueuedLink,
  onClearQueuedLinks,
  initialTab = 'web',
}: ImportSourceSelectorProps) {
  const [selectedSource, setSelectedSource] = useState<SelectedSource>(initialTab);
  const [url, setUrl] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);
  const [reelUrl, setReelUrl] = useState('');
  const [reelUrlError, setReelUrlError] = useState<string | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [autoStartSignal, setAutoStartSignal] = useState(0);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (initialTab !== 'web') {
      setSelectedSource(initialTab);
    }
  }, [initialTab]);

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUrlError(null);
    const trimmed = url.trim();

    if (!isValidUrl(trimmed)) {
      setUrlError('URL invalide. Veuillez coller une adresse web commençant par http:// ou https://');
      return;
    }

    startTransition(async () => {
      if (isShortVideoUrl(trimmed) && onReelImport) {
        await onReelImport(trimmed);
      } else if (onImportStart) {
        await onImportStart('', trimmed);
      }
    });
  };

  const handleReelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setReelUrlError(null);

    const trimmed = reelUrl.trim();
    if (!isValidUrl(trimmed)) {
      setReelUrlError('URL invalide. Collez un lien Instagram, TikTok ou YouTube commençant par https://');
      return;
    }
    if (
      !trimmed.includes('instagram.com') &&
      !trimmed.includes('tiktok.com') &&
      !trimmed.includes('youtube.com') &&
      !trimmed.includes('youtu.be')
    ) {
      setReelUrlError('Ce lien ne semble pas être un lien Instagram, TikTok ou YouTube valide.');
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

  const handlePasteFromClipboard = async (target: 'web' | 'reel') => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) return;
      if (target === 'web') {
        setUrl(text.trim());
        setUrlError(null);
      } else {
        setReelUrl(text.trim());
        setReelUrlError(null);
      }
    } catch {
      // Clipboard API permission refused or unavailable
    }
  };

  const tabButtonClass = (isActive: boolean) =>
    `flex-1 min-w-[96px] sm:min-w-[112px] py-3.5 px-3 text-[12.5px] font-semibold rounded-2xl flex flex-col items-center justify-center gap-2 transition-all relative border ${
      isActive
        ? 'bg-[var(--color-accent)]/15 text-[var(--color-accent)] border-[var(--color-accent)] shadow-[0_8px_24px_rgba(217,130,91,0.18)]'
        : 'glass-panel text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-white/25'
    }`;

  const activeTab = selectedSource;

  const handleTabClick = (source: SelectedSource) => {
    setSelectedSource(source);
    setUrlError(null);
    setReelUrlError(null);
  };

  const handleImportAllQueued = () => {
    setSelectedSource('bulk');
    setAutoStartSignal((s) => s + 1);
  };

  const queuedUrls = queuedLinks.map((q) => q.source_url);

  return (
    <div className="mt-4 md:mt-8 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-medium text-[var(--color-text-primary)]">
            Importer une recette
          </h1>
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-1">
            Extraction intelligente depuis un site, une vidéo, une photo ou vos notes.
          </p>
        </div>
      </div>

      {/* Encart Boîte de réception des liens partagés (Instagram / TikTok / Web) */}
      {queuedLinks.length > 0 && (
        <div className="p-5 glass-panel border-[var(--color-accent)]/50 rounded-3xl space-y-3">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h3 className="text-[14px] font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                <Inbox size={16} strokeWidth={1.6} className="text-[var(--color-accent)]" />
                <span>
                  {queuedLinks.length} recette{queuedLinks.length > 1 ? 's' : ''} mise
                  {queuedLinks.length > 1 ? 's' : ''} de côté depuis vos partages
                </span>
              </h3>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                Prêtes à être importées et étiquetées automatiquement en un clic.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleImportAllQueued}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--color-accent)] text-white rounded-xl text-xs font-semibold hover:bg-[var(--accent-primary-hover)] transition-colors shadow-sm"
              >
                <Zap size={13} strokeWidth={1.8} />
                <span>Tout importer ({queuedLinks.length})</span>
              </button>
              {onClearQueuedLinks && (
                <button
                  type="button"
                  onClick={onClearQueuedLinks}
                  className="px-3 py-2 glass-pill text-[var(--color-text-muted)] hover:text-red-400 rounded-xl text-xs font-medium transition-colors"
                >
                  Vider
                </button>
              )}
            </div>
          </div>

          <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
            {queuedLinks.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {item.source_type === 'reel' ? (
                    <Film size={14} strokeWidth={1.6} className="text-[var(--color-accent)] shrink-0" />
                  ) : (
                    <Globe size={14} strokeWidth={1.6} className="text-[var(--color-text-secondary)] shrink-0" />
                  )}
                  <span className="truncate text-[var(--color-text-secondary)] font-mono">
                    {item.source_url}
                  </span>
                </div>
                {onRemoveQueuedLink && (
                  <button
                    type="button"
                    onClick={() => onRemoveQueuedLink(item.source_url)}
                    aria-label="Retirer ce lien"
                    className="text-[var(--color-text-muted)] hover:text-red-400 p-1"
                  >
                    <X size={14} strokeWidth={1.8} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-5">
        {/* Barre d'onglets (placée en haut pour une hiérarchie naturelle) */}
        <div className="flex flex-wrap gap-2 md:gap-2.5">
          <button
            type="button"
            onClick={() => handleTabClick('web')}
            className={tabButtonClass(activeTab === 'web')}
          >
            <Globe size={20} strokeWidth={1.5} />
            <span>Site Web</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabClick('reel')}
            className={tabButtonClass(activeTab === 'reel')}
          >
            <Film size={20} strokeWidth={1.5} />
            <span>Vidéo Courte</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabClick('image')}
            className={tabButtonClass(activeTab === 'image')}
          >
            <Camera size={20} strokeWidth={1.5} />
            <span>Photo</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabClick('text')}
            className={tabButtonClass(activeTab === 'text')}
          >
            <FileText size={20} strokeWidth={1.5} />
            <span>Texte</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabClick('bulk')}
            className={tabButtonClass(activeTab === 'bulk')}
          >
            {queuedLinks.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--color-accent)] text-white shadow">
                {queuedLinks.length}
              </span>
            )}
            <Layers size={20} strokeWidth={1.5} />
            <span>En masse</span>
          </button>
        </div>

        {/* Contenu de l'onglet actif */}
        <div className="glass-panel rounded-3xl overflow-hidden animate-in fade-in duration-200">
          {activeTab === 'web' && (
            <div className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-6 text-center sm:text-left">
                <div className="w-12 h-12 shrink-0 bg-[var(--color-accent)]/15 text-[var(--color-accent)] rounded-2xl flex items-center justify-center border border-[var(--color-accent)]/30">
                  <Globe size={22} strokeWidth={1.5} />
                </div>
                <div>
                  <h4 className="text-[17px] font-serif font-medium text-[var(--color-text-primary)]">
                    Importer depuis un site web
                  </h4>
                  <p className="text-[13px] text-[var(--color-text-secondary)] mt-1">
                    Collez le lien d&apos;un blog culinaire ou d&apos;une vidéo. L&apos;IA détecte et extrait la recette automatiquement.
                  </p>
                </div>
              </div>
              <form onSubmit={handleUrlSubmit} className="flex flex-col gap-3">
                <div className="relative flex items-center">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value);
                      if (urlError) setUrlError(null);
                    }}
                    placeholder="https://www.marmiton.org/recettes/..."
                    disabled={isPending}
                    className={`w-full pl-4 pr-24 py-3.5 text-[14.5px] border rounded-2xl bg-white/5 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] transition-colors focus:outline-none focus:border-[var(--color-accent)] disabled:opacity-50 ${
                      urlError
                        ? 'border-red-400/70 bg-red-500/10'
                        : 'border-[var(--color-border)] hover:border-[var(--color-border-hover)]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => handlePasteFromClipboard('web')}
                    className="absolute right-2.5 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl glass-pill text-xs font-medium text-[var(--color-text-secondary)] hover:text-white transition-colors"
                  >
                    <ClipboardPaste size={13} strokeWidth={1.6} />
                    <span>Coller</span>
                  </button>
                </div>
                {urlError && (
                  <p className="text-[13px] text-red-400 pl-1 font-medium">{urlError}</p>
                )}
                {isPending ? (
                  <FakeProgressButton source="web" />
                ) : (
                  <button
                    type="submit"
                    disabled={!url.trim()}
                    className="w-full py-3.5 mt-2 bg-[var(--color-accent)] text-white text-[14.5px] font-semibold rounded-2xl shadow-[0_8px_20px_rgba(217,130,91,0.28)] hover:bg-[var(--accent-primary-hover)] disabled:opacity-40 transition-all active:scale-[0.99]"
                  >
                    Importer la recette
                  </button>
                )}
              </form>
            </div>
          )}

          {activeTab === 'reel' && (
            <div className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-6 text-center sm:text-left">
                <div className="w-12 h-12 shrink-0 bg-[var(--color-accent)]/15 text-[var(--color-accent)] rounded-2xl flex items-center justify-center border border-[var(--color-accent)]/30">
                  <Film size={22} strokeWidth={1.5} />
                </div>
                <div>
                  <h4 className="text-[17px] font-serif font-medium text-[var(--color-text-primary)]">
                    Instagram, TikTok ou YouTube
                  </h4>
                  <p className="text-[13px] text-[var(--color-text-secondary)] mt-1">
                    Collez le lien de la vidéo. L&apos;IA écoutera l&apos;audio et analysera la description.
                  </p>
                </div>
              </div>
              <form onSubmit={handleReelSubmit} className="flex flex-col gap-3">
                <div className="relative flex items-center">
                  <input
                    type="url"
                    value={reelUrl}
                    onChange={(e) => {
                      setReelUrl(e.target.value);
                      if (reelUrlError) setReelUrlError(null);
                    }}
                    placeholder="Lien Instagram, TikTok, YouTube..."
                    disabled={isPending}
                    className={`w-full pl-4 pr-24 py-3.5 text-[14.5px] border rounded-2xl bg-white/5 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] transition-colors focus:outline-none focus:border-[var(--color-accent)] disabled:opacity-50 ${
                      reelUrlError
                        ? 'border-red-400/70 bg-red-500/10'
                        : 'border-[var(--color-border)] hover:border-[var(--color-border-hover)]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => handlePasteFromClipboard('reel')}
                    className="absolute right-2.5 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl glass-pill text-xs font-medium text-[var(--color-text-secondary)] hover:text-white transition-colors"
                  >
                    <ClipboardPaste size={13} strokeWidth={1.6} />
                    <span>Coller</span>
                  </button>
                </div>
                {reelUrlError && (
                  <p className="text-[13px] text-red-400 pl-1 font-medium">{reelUrlError}</p>
                )}
                {isPending ? (
                  <FakeProgressButton source="reel" />
                ) : (
                  <button
                    type="submit"
                    disabled={!reelUrl.trim()}
                    className="w-full py-3.5 mt-2 bg-[var(--color-accent)] text-white text-[14.5px] font-semibold rounded-2xl shadow-[0_8px_20px_rgba(217,130,91,0.28)] hover:bg-[var(--accent-primary-hover)] disabled:opacity-40 transition-all active:scale-[0.99]"
                  >
                    Transcrire cette vidéo
                  </button>
                )}
              </form>
            </div>
          )}

          {activeTab === 'image' && (
            <div className="p-6 sm:p-8 flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-[var(--color-accent)]/15 text-[var(--color-accent)] rounded-2xl flex items-center justify-center mb-4 border border-[var(--color-accent)]/30">
                <Camera size={26} strokeWidth={1.5} />
              </div>
              <h4 className="text-[17px] font-serif font-medium text-[var(--color-text-primary)] mb-2">
                Scanner une image
              </h4>
              <p className="text-[13.5px] text-[var(--color-text-secondary)] mb-6 max-w-sm">
                Prenez en photo une page de livre ou soumettez une capture d&apos;écran de votre téléphone.
              </p>

              <label
                className={`w-full max-w-xs relative overflow-hidden flex flex-col items-center justify-center border border-dashed rounded-2xl px-6 py-10 transition-colors cursor-pointer group ${
                  isPending
                    ? 'opacity-50 pointer-events-none'
                    : 'border-white/20 bg-white/[0.02] hover:border-[var(--color-accent)] hover:bg-white/[0.05]'
                }`}
              >
                {isPending ? (
                  <FakeProgressButton source="image" />
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-full glass-pill flex items-center justify-center mb-3 text-[var(--color-text-secondary)] group-hover:text-[var(--color-accent)] transition-colors">
                      <Plus size={20} strokeWidth={1.6} />
                    </div>
                    <span className="text-[14px] font-semibold text-[var(--color-text-primary)]">
                      Choisir une image
                    </span>
                    <span className="text-[12px] text-[var(--color-text-muted)] mt-1">
                      Appareil photo ou Galerie
                    </span>

                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        let fileToUpload = file;
                        try {
                          fileToUpload = await compressImage(file);
                        } catch (err) {
                          console.error('Image compression failed', err);
                        }

                        const formData = new FormData();
                        formData.append('image', fileToUpload);
                        startTransition(async () => {
                          if (onImageImport) {
                            await onImageImport(formData);
                          }
                        });
                      }}
                    />
                  </>
                )}
              </label>
            </div>
          )}

          {activeTab === 'text' && (
            <div className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-6 text-center sm:text-left">
                <div className="w-12 h-12 shrink-0 bg-[var(--color-accent)]/15 text-[var(--color-accent)] rounded-2xl flex items-center justify-center border border-[var(--color-accent)]/30">
                  <FileText size={22} strokeWidth={1.5} />
                </div>
                <div>
                  <h4 className="text-[17px] font-serif font-medium text-[var(--color-text-primary)]">
                    Texte copié
                  </h4>
                  <p className="text-[13px] text-[var(--color-text-secondary)] mt-1">
                    Collez n&apos;importe quel texte désorganisé contenant les ingrédients et étapes d&apos;une recette.
                  </p>
                </div>
              </div>
              <form onSubmit={handleTextSubmit} className="flex flex-col gap-3">
                <textarea
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Exemple: 200g de farine, 3 oeufs. Cuire 20 min..."
                  disabled={isPending}
                  rows={6}
                  className="w-full px-4 py-3 text-[14px] border border-[var(--color-border)] rounded-2xl bg-white/5 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] resize-y focus:outline-none focus:border-[var(--color-accent)] disabled:opacity-50 transition-colors"
                />
                {isPending ? (
                  <FakeProgressButton source="text" />
                ) : (
                  <button
                    type="submit"
                    disabled={!pastedText.trim()}
                    className="w-full py-3.5 mt-2 bg-[var(--color-accent)] text-white text-[14.5px] font-semibold rounded-2xl shadow-[0_8px_20px_rgba(217,130,91,0.28)] hover:bg-[var(--accent-primary-hover)] disabled:opacity-40 transition-all active:scale-[0.99]"
                  >
                    Extraire les informations
                  </button>
                )}
              </form>
            </div>
          )}

          {activeTab === 'bulk' && (
            <div className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-6 text-center sm:text-left">
                <div className="w-12 h-12 shrink-0 bg-[var(--color-accent)]/15 text-[var(--color-accent)] rounded-2xl flex items-center justify-center border border-[var(--color-accent)]/30">
                  <Layers size={22} strokeWidth={1.5} />
                </div>
                <div>
                  <h4 className="text-[17px] font-serif font-medium text-[var(--color-text-primary)]">
                    Importer en masse
                  </h4>
                  <p className="text-[13px] text-[var(--color-text-secondary)] mt-1">
                    Collez vos liens à la suite ou importez directement vos recettes mises de côté depuis Instagram.
                  </p>
                </div>
              </div>

              <BulkImportView
                onDone={onBulkDone ?? (() => {})}
                initialUrls={queuedUrls}
                autoStartSignal={autoStartSignal}
                onUrlImported={onRemoveQueuedLink}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
