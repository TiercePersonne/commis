'use client';

import { useState } from 'react';
import { Download, Trash2, LogOut, Heart, ExternalLink } from 'lucide-react';
import { AppLayout } from '@/app/components/app-layout';
import { AiTagOrganizer } from '@/app/components/ai-tag-organizer';
import { ShareShortcutSetup } from '@/app/components/share-shortcut-setup';
import { ImageRepairer } from '@/app/components/image-repairer';
import { exportUserData, deleteAccount } from '@/app/actions/profile';
import { logout } from '@/app/login/actions';

export default function ProfilePage() {
  const [exporting, setExporting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setExporting(true);
    setError(null);

    const result = await exportUserData();

    if (result.error) {
      setError(result.error);
      setExporting(false);
      return;
    }

    if (result.data) {
      const blob = new Blob([result.data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `commis-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    setExporting(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);

    const result = await deleteAccount();

    if (result?.error) {
      setError(result.error);
      setDeleting(false);
    }
  };

  return (
    <AppLayout>
      <div className="px-4 sm:px-6 md:px-10 pb-12">
        <div className="max-w-2xl mx-auto pt-6 md:pt-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl md:text-3xl font-serif font-medium text-[var(--color-text-primary)]">
              Mon Profil
            </h1>
            <form action={logout}>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full glass-pill text-xs font-medium text-[var(--color-text-secondary)] hover:text-red-400 transition-colors"
              >
                <LogOut size={14} strokeWidth={1.6} />
                <span>Se déconnecter</span>
              </button>
            </form>
          </div>
          <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mb-8">
            Gérez votre compte, vos automatisations et vos données.
          </p>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-300 text-sm mb-6">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <ShareShortcutSetup />

            <AiTagOrganizer />

            <ImageRepairer />

            <div className="glass-panel rounded-3xl p-6">
              <h2 className="text-base sm:text-lg font-serif font-medium text-[var(--color-text-primary)] mb-2 flex items-center gap-2">
                <Download size={18} strokeWidth={1.6} className="text-[var(--color-accent)]" />
                <span>Exporter mes données</span>
              </h2>
              <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mb-4">
                Téléchargez toutes vos recettes, tags et plans de repas au format JSON.
              </p>
              <button
                onClick={handleExport}
                disabled={exporting}
                className="inline-flex items-center gap-2 justify-center px-5 py-2.5 bg-[var(--color-accent)] text-white rounded-xl hover:bg-[var(--accent-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed font-medium text-xs sm:text-sm transition-colors"
              >
                <Download size={15} strokeWidth={1.7} />
                <span>{exporting ? 'Export en cours...' : 'Exporter en JSON'}</span>
              </button>
            </div>

            <div className="glass-panel rounded-3xl p-6 flex items-center justify-between gap-4 flex-wrap">
              <div className="space-y-1">
                <h2 className="text-base font-serif font-medium text-[var(--color-text-primary)] flex items-center gap-2">
                  <Heart size={17} strokeWidth={1.6} className="text-[var(--color-accent)]" />
                  <span>Soutenir le projet Commis</span>
                </h2>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  Contribuez aux frais d&apos;hébergement et d&apos;intelligence artificielle.
                </p>
              </div>
              <a
                href="https://paypal.me/GJCommis"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl glass-pill text-xs font-medium text-[var(--color-text-primary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors"
              >
                <span>Faire un don</span>
                <ExternalLink size={13} strokeWidth={1.6} />
              </a>
            </div>

            <div className="glass-panel border-red-500/25 rounded-3xl p-6">
              <h2 className="text-base sm:text-lg font-serif font-medium text-[var(--color-text-primary)] mb-2 flex items-center gap-2">
                <Trash2 size={18} strokeWidth={1.6} className="text-red-400" />
                <span>Supprimer mon compte</span>
              </h2>
              <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mb-4">
                Cette action est irréversible. Toutes vos recettes, tags et plans de repas seront définitivement supprimés.
              </p>

              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="inline-flex items-center justify-center px-5 py-2.5 border border-red-500/40 bg-red-500/10 text-red-300 rounded-xl hover:bg-red-500/20 font-medium text-xs sm:text-sm transition-colors"
                >
                  Supprimer mon compte
                </button>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs sm:text-sm font-medium text-red-400">
                    Êtes-vous sûr ? Cette action est définitive.
                  </p>
                  <div className="flex gap-3 flex-wrap">
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="inline-flex items-center justify-center px-5 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-xs sm:text-sm transition-colors"
                    >
                      {deleting ? 'Suppression...' : 'Oui, supprimer définitivement'}
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={deleting}
                      className="inline-flex items-center justify-center px-5 py-2.5 glass-pill text-[var(--color-text-primary)] rounded-xl hover:bg-white/10 font-medium text-xs sm:text-sm transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
