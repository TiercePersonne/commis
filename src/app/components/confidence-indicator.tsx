'use client';

interface ConfidenceIndicatorProps {
  confidence: 'complete' | 'partial';
}

export function ConfidenceIndicator({ confidence }: ConfidenceIndicatorProps) {
  if (confidence === 'complete') {
    return (
      <div
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium"
        style={{ backgroundColor: '#d4edda', color: '#155724' }}
      >
        <span>✓</span>
        <span>Recette complète</span>
      </div>
    );
  }

  return (
    <div
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium"
      style={{ backgroundColor: '#fff3cd', color: '#856404' }}
    >
      <span>⚠</span>
      <span>À vérifier — certains champs peuvent être incomplets</span>
    </div>
  );
}
