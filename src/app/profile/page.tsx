'use client';

import { useState } from 'react';
import { AppLayout } from '@/app/components/app-layout';
import { exportUserData, deleteAccount } from '@/app/actions/profile';

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
      <div className="px-10 pb-10">
        <div className="max-w-2xl mx-auto pt-8">
          <h1 className="text-[28px] font-serif font-bold text-[var(--color-text-primary)] mb-2">
            Mon Profil
          </h1>
          <p className="text-[14px] text-[var(--color-text-muted)] mb-8">
            Gérer ton compte et tes données.
          </p>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 mb-6">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-light)] rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
                Exporter mes données
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                Télécharge toutes tes recettes, tags et plans de repas au format JSON.
              </p>
              <button
                onClick={handleExport}
                disabled={exporting}
                className="inline-flex items-center justify-center px-5 py-2.5 bg-[var(--color-accent)] text-white rounded-xl hover:bg-[var(--accent-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition-colors"
              >
                {exporting ? 'Export en cours...' : 'Exporter en JSON'}
              </button>
            </div>

            <div className="bg-[var(--color-bg-card)] border border-red-200 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
                Supprimer mon compte
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                Cette action est irréversible. Toutes tes recettes, tags et plans de repas seront définitivement supprimés.
              </p>

              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="inline-flex items-center justify-center px-5 py-2.5 border border-[#ba2d2d] text-[#ba2d2d] rounded-xl hover:bg-red-50 font-medium text-sm transition-colors"
                >
                  Supprimer mon compte
                </button>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-[#ba2d2d]">
                    Es-tu sûr ? Cette action est définitive.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="inline-flex items-center justify-center px-5 py-2.5 bg-[#ba2d2d] text-white rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition-opacity"
                    >
                      {deleting ? 'Suppression...' : 'Oui, supprimer définitivement'}
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={deleting}
                      className="inline-flex items-center justify-center px-5 py-2.5 border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-xl hover:bg-[var(--color-bg-secondary)] font-medium text-sm transition-colors"
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
