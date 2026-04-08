'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/app/components/app-layout';
import { exportUserData, deleteAccount, saveInstagramCookies, getInstagramCookies } from '@/app/actions/profile';

export default function ProfilePage() {
  const [exporting, setExporting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [instagramCookies, setInstagramCookies] = useState('');
  const [instagramSaved, setInstagramSaved] = useState(false);
  const [instagramSaving, setInstagramSaving] = useState(false);
  const [instagramConnected, setInstagramConnected] = useState(false);

  useEffect(() => {
    getInstagramCookies().then((cookies) => {
      if (cookies) setInstagramConnected(true);
    });
  }, []);

  const handleSaveInstagram = async () => {
    const trimmed = instagramCookies.trim();
    if (!trimmed) return;
    setInstagramSaving(true);
    setInstagramSaved(false);
    const result = await saveInstagramCookies(trimmed);
    setInstagramSaving(false);
    if (!result.error) {
      setInstagramConnected(true);
      setInstagramSaved(true);
      setTimeout(() => setInstagramSaved(false), 3000);
    }
  };

  const handleDisconnectInstagram = async () => {
    setInstagramSaving(true);
    await saveInstagramCookies(null);
    setInstagramCookies('');
    setInstagramConnected(false);
    setInstagramSaving(false);
  };

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
            {/* Section Instagram */}
            <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-light)] rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">🎬</span>
                <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                  Connexion Instagram
                </h2>
                {instagramConnected && (
                  <span className="ml-auto text-[12px] font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                    Connecté
                  </span>
                )}
              </div>
              <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                Pour importer des recettes depuis des Reels Instagram, colle le contenu de ton fichier cookies Instagram ci-dessous.
              </p>

              <details className="mb-4">
                <summary className="text-[13px] text-[var(--color-accent)] cursor-pointer hover:underline">
                  Comment obtenir mon fichier cookies ?
                </summary>
                <ol className="mt-2 space-y-1 text-[13px] text-[var(--color-text-secondary)] list-decimal list-inside">
                  <li>Installe l&apos;extension <strong>"Get cookies.txt LOCALLY"</strong> dans Chrome</li>
                  <li>Va sur <strong>instagram.com</strong> et connecte-toi</li>
                  <li>Clique sur l&apos;extension &gt; <strong>Export As</strong> &gt; <strong>cookies.txt (Current Site)</strong></li>
                  <li>Ouvre le fichier téléchargé dans un éditeur de texte, sélectionne tout et copie</li>
                  <li>Colle le contenu dans le champ ci-dessous</li>
                </ol>
              </details>

              {!instagramConnected ? (
                <div className="space-y-2">
                  <textarea
                    value={instagramCookies}
                    onChange={(e) => setInstagramCookies(e.target.value)}
                    placeholder={`# Netscape HTTP Cookie File\n.instagram.com\tTRUE\t/\tTRUE\t...`}
                    rows={5}
                    className="w-full px-3 py-2 text-[13px] font-mono border border-[var(--color-border)] rounded-xl bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] outline-none resize-none"
                  />
                  <button
                    onClick={handleSaveInstagram}
                    disabled={instagramSaving || !instagramCookies.trim()}
                    className="px-4 py-2 bg-[var(--color-accent)] text-white rounded-xl hover:bg-[var(--accent-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition-colors"
                  >
                    {instagramSaving ? 'Enregistrement…' : 'Enregistrer'}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-[13px] text-[var(--color-text-secondary)]">
                    Cookies enregistrés — import Reel activé
                  </span>
                  {instagramSaved && (
                    <span className="text-[12px] text-green-600">✓ Sauvegardé</span>
                  )}
                  <button
                    onClick={handleDisconnectInstagram}
                    disabled={instagramSaving}
                    className="ml-auto text-[13px] text-[var(--color-text-muted)] hover:text-red-600 transition-colors"
                  >
                    Déconnecter
                  </button>
                </div>
              )}
            </div>
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
