'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export function BackToRecipesButton() {
  const router = useRouter();

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  return (
    <a
      href="/"
      onClick={handleBack}
      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full glass-pill text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-white/25 transition-all mb-4 md:mb-6 cursor-pointer"
    >
      <ArrowLeft size={14} strokeWidth={1.6} />
      <span>Retour aux recettes</span>
    </a>
  );
}
