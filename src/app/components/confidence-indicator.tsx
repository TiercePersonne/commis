'use client';

import { Check, AlertTriangle } from 'lucide-react';

interface ConfidenceIndicatorProps {
  confidence: 'complete' | 'partial';
}

export function ConfidenceIndicator({ confidence }: ConfidenceIndicatorProps) {
  if (confidence === 'complete') {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12.5px] font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
        <Check size={14} strokeWidth={2} />
        <span>Recette complète</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12.5px] font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30">
      <AlertTriangle size={14} strokeWidth={1.8} />
      <span>À vérifier — certains champs peuvent être incomplets</span>
    </div>
  );
}
