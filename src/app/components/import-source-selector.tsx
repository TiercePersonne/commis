'use client';

import { useState, useTransition } from 'react';
import { BulkImportView } from './bulk-import-view';

type SelectedSource = 'web' | 'text' | 'reel' | 'image' | 'bulk' | null;

interface ImportSourceSelectorProps {
  onImportStart?: (jobId: string, url: string) => void;
  onTextImport?: (text: string) => void;
  onReelImport?: (url: string) => void;
  onImageImport?: (formData: FormData) => void;
  onBulkDone?: () => void;
}

function isValidUrl(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://');
}

export function ImportSourceSelector({ onImportStart, onTextImport, onReelImport, onImageImport, onBulkDone }: ImportSourceSelectorProps) {
  const [selectedSource, setSelectedSource] = useState<SelectedSource>(null);
  const [url, setUrl] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);
  const [reelUrl, setReelUrl] = useState('');
  const [reelUrlError, setReelUrlError] = useState<string | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [isPending, startTransition] = useTransition();

  const compressImage = (file: File): Promise<File> => {
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
                resolve(new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpeg", { type: 'image/jpeg', lastModified: Date.now() }));
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
  };

  const handleCardClick = (source: 'web' | 'text' | 'reel' | 'image') => {
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
      setReelUrlError("URL invalide. Collez un lien Instagram, TikTok ou YouTube commençant par https://");
      return;
    }
    if (!trimmed.includes('instagram.com') && !trimmed.includes('tiktok.com') && !trimmed.includes('youtube.com') && !trimmed.includes('youtu.be')) {
      setReelUrlError("Ce lien ne semble pas être un lien Instagram, TikTok ou YouTube valide.");
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

  const tabButtonClass = (isActive: boolean) => 
    `flex-1 min-w-[100px] sm:min-w-[120px] py-4 px-3 text-[13px] font-semibold rounded-[var(--radius-lg)] flex flex-col items-center justify-center gap-2 transition-all ${
      isActive 
        ? 'bg-[var(--color-bg-card)] text-[var(--color-accent)] border-2 border-[var(--color-accent)] shadow-[0_4px_12px_rgba(0,0,0,0.05)] scale-[1.02]' 
        : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] border-2 border-transparent hover:bg-[var(--color-bg-card)] hover:shadow-sm'
    }`;

  // Si on n'a sélectionné aucune source, on force 'web' par défaut dans l'interface (même si l'état est null)
  const activeTab = selectedSource ?? 'web';

  const handleTabClick = (source: 'web' | 'text' | 'reel' | 'image' | 'bulk') => {
    setSelectedSource(source);
    setUrlError(null);
    setReelUrlError(null);
  };

  return (
    <div className="mt-4 md:mt-8 max-w-2xl mx-auto flex flex-col-reverse gap-6">

      {/* Barre d'onglets au même niveau - maintenant affichée en dessous grâce à flex-col-reverse */}
      <div className="flex flex-wrap gap-2 md:gap-3">
        <button 
          type="button"
          onClick={() => handleTabClick('web')}
          className={tabButtonClass(activeTab === 'web')}
        >
          <span className="text-xl md:text-2xl mb-0.5">🌐</span>
          Site Web
        </button>
        <button 
          type="button"
          onClick={() => handleTabClick('reel')}
          className={tabButtonClass(activeTab === 'reel')}
        >
          <span className="text-xl md:text-2xl mb-0.5">🎬</span>
          Vidéo Courte
        </button>
        <button 
          type="button"
          onClick={() => handleTabClick('image')}
          className={tabButtonClass(activeTab === 'image')}
        >
          <span className="text-xl md:text-2xl mb-0.5">📸</span>
          Photo
        </button>
        <button 
          type="button"
          onClick={() => handleTabClick('text')}
          className={tabButtonClass(activeTab === 'text')}
        >
          <span className="text-xl md:text-2xl mb-0.5">📋</span>
          Texte
        </button>
        <button 
          type="button"
          onClick={() => handleTabClick('bulk')}
          className={tabButtonClass(false)}
        >
          <span className="text-xl md:text-2xl mb-0.5">📦</span>
          En masse
        </button>
      </div>

      {/* Contenu de l'onglet actif (Affiché au dessus par flex-col-reverse) */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius-xl)] shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
        
        {activeTab === 'web' && (
          <div className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-6 text-center sm:text-left">
              <div className="w-12 h-12 shrink-0 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center text-2xl border border-blue-100">🌐</div>
              <div>
                <h4 className="text-[18px] font-bold text-[var(--color-text-primary)]">Importer depuis un site web</h4>
                <p className="text-[13px] text-[var(--color-text-secondary)] mt-1">Collez le lien d&apos;un blog culinaire ou d&apos;un site de recettes. L&apos;IA lira la page pour vous.</p>
              </div>
            </div>
            <form onSubmit={handleUrlSubmit} className="flex flex-col gap-3">
              <input
                type="url"
                value={url}
                onChange={(e) => { setUrl(e.target.value); if (urlError) setUrlError(null); }}
                placeholder="https://www.marmiton.org/recettes/..."
                disabled={isPending}
                className={`w-full px-4 py-3.5 text-[15px] border rounded-[var(--radius-md)] bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 disabled:opacity-50 ${
                  urlError ? 'border-red-400 bg-red-50' : 'border-[var(--color-border)] hover:border-[var(--color-border-hover)]'
                }`}
              />
              {urlError && <p className="text-[13px] text-red-600 pl-1 font-medium">{urlError}</p>}
              <button
                type="submit"
                disabled={isPending || !url.trim()}
                className="w-full py-3.5 mt-2 bg-[var(--color-accent)] text-white text-[15px] font-bold rounded-[var(--radius-md)] shadow-md hover:bg-[var(--accent-primary-hover)] disabled:opacity-50 transition-all active:scale-[0.98]"
              >
                Importer la recette
              </button>
            </form>
          </div>
        )}

        {activeTab === 'reel' && (
          <div className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-6 text-center sm:text-left">
              <div className="w-12 h-12 shrink-0 bg-purple-50 text-purple-500 rounded-full flex items-center justify-center text-2xl border border-purple-100">🎬</div>
              <div>
                <h4 className="text-[18px] font-bold text-[var(--color-text-primary)]">Instagram, TikTok ou YouTube</h4>
                <p className="text-[13px] text-[var(--color-text-secondary)] mt-1">Collez le lien de la vidéo. L&apos;IA écoutera l&apos;audio et analysera l&apos;image de couverture.</p>
              </div>
            </div>
            <form onSubmit={handleReelSubmit} className="flex flex-col gap-3">
              <input
                type="url"
                value={reelUrl}
                onChange={(e) => { setReelUrl(e.target.value); if (reelUrlError) setReelUrlError(null); }}
                placeholder="Lien Instagram, TikTok, YouTube..."
                disabled={isPending}
                className={`w-full px-4 py-3.5 text-[15px] border rounded-[var(--radius-md)] bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 disabled:opacity-50 ${
                  reelUrlError ? 'border-red-400 bg-red-50' : 'border-[var(--color-border)] hover:border-[var(--color-border-hover)]'
                }`}
              />
              {reelUrlError && <p className="text-[13px] text-red-600 pl-1 font-medium">{reelUrlError}</p>}
              <button
                type="submit"
                disabled={isPending || !reelUrl.trim()}
                className="w-full py-3.5 mt-2 bg-[var(--color-accent)] text-white text-[15px] font-bold rounded-[var(--radius-md)] shadow-md hover:bg-[var(--accent-primary-hover)] disabled:opacity-50 transition-all active:scale-[0.98]"
              >
                Transcrire cette vidéo
              </button>
            </form>
          </div>
        )}

        {activeTab === 'image' && (
          <div className="p-6 sm:p-8 flex flex-col items-center text-center">
            <div className="w-14 h-14 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center text-3xl mb-4 border border-orange-100 shadow-sm">📸</div>
            <h4 className="text-[18px] font-bold text-[var(--color-text-primary)] mb-2">Scanner une image</h4>
            <p className="text-[14px] text-[var(--color-text-secondary)] mb-8 max-w-sm">
              Prenez en photo une page de livre ou soumettez une capture d&apos;écran de votre téléphone.
            </p>
            
            <label className={`w-full max-w-xs relative overflow-hidden flex flex-col items-center justify-center border-2 border-dashed rounded-[var(--radius-xl)] px-6 py-10 transition-colors cursor-pointer group ${isPending ? 'opacity-50 pointer-events-none' : 'border-[var(--color-border)] hover:border-[var(--color-accent)] hover:bg-[var(--color-bg-secondary)]'}`}>
              <div className="text-3xl mb-3 text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)] transition-colors">➕</div>
              <span className="text-[14px] font-bold text-[var(--color-text-primary)]">Choisir une image</span>
              <span className="text-[12px] text-[var(--color-text-muted)] mt-1">Appareil photo ou Galerie</span>
              
              <input
                type="file"
                accept="image/*"
                capture="environment"
                disabled={isPending}
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
            </label>
          </div>
        )}

        {activeTab === 'text' && (
          <div className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-6 text-center sm:text-left">
              <div className="w-12 h-12 shrink-0 bg-yellow-50 text-yellow-600 rounded-full flex items-center justify-center text-2xl border border-yellow-100">📋</div>
              <div>
                <h4 className="text-[18px] font-bold text-[var(--color-text-primary)]">Texte copié</h4>
                <p className="text-[13px] text-[var(--color-text-secondary)] mt-1">Collez n&apos;importe quel texte désorganisé contenant des ingrédients d&apos;une recette.</p>
              </div>
            </div>
            <form onSubmit={handleTextSubmit} className="flex flex-col gap-3">
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Exemple: 200g de farine, 3 oeufs. Cuire 20 min..."
                disabled={isPending}
                rows={6}
                className="w-full px-4 py-3 text-[14px] border border-[var(--color-border)] rounded-[var(--radius-md)] bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] resize-y focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 disabled:opacity-50 transition-colors"
              />
              <button
                type="submit"
                disabled={isPending || !pastedText.trim()}
                className="w-full py-3.5 mt-2 bg-[var(--color-accent)] text-white text-[15px] font-bold rounded-[var(--radius-md)] shadow-md hover:bg-[var(--accent-primary-hover)] disabled:opacity-50 transition-all active:scale-[0.98]"
              >
                Extraire les informations
              </button>
            </form>
          </div>
        )}

        {activeTab === 'bulk' && (
          <div className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-6 text-center sm:text-left">
              <div className="w-12 h-12 shrink-0 bg-gray-50 text-gray-500 rounded-full flex items-center justify-center text-2xl border border-gray-100">📦</div>
              <div>
                <h4 className="text-[18px] font-bold text-[var(--color-text-primary)]">Importer en masse</h4>
                <p className="text-[13px] text-[var(--color-text-secondary)] mt-1">
                  Collez vos liens à la suite pour automatiser la lecture.
                </p>
              </div>
            </div>
            
            <BulkImportView onDone={onBulkDone ?? (() => {})} />
          </div>
        )}

      </div>
    </div>
  );
}
