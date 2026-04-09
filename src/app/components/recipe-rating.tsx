'use client';

import { useState, useTransition } from 'react';
import { updateRecipeRating } from '@/app/actions/recipes';

interface RecipeRatingProps {
  recipeId: string;
  initialRating?: number | null;
  readOnly?: boolean;
}

function StarIcon({ filled, half, className = '' }: { filled: boolean; half?: boolean; className?: string }) {
  if (half) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77V2Z" fill="currentColor" />
        <path d="M12 2L8.91 8.26L2 9.27L7 14.14L5.82 21.02L12 17.77V2Z" fill="#E5E7EB" />
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill={filled ? 'currentColor' : 'none'} 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 12 2" />
    </svg>
  );
}

export function RecipeRating({ recipeId, initialRating, readOnly = false }: RecipeRatingProps) {
  const [rating, setRating] = useState<number | null>(initialRating ?? null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleRate = (value: number) => {
    if (readOnly) return;
    // Si on clique sur la même étoile, on annule la note (0 / null)
    const newRating = rating === value ? null : value;
    setRating(newRating);
    
    startTransition(async () => {
      await updateRecipeRating(recipeId, newRating);
    });
  };

  const currentDisplay = hoverRating !== null ? hoverRating : (rating ?? 0);

  return (
    <div 
      className={`flex items-center gap-1 ${readOnly ? '' : 'cursor-pointer'}`}
      onMouseLeave={() => !readOnly && setHoverRating(null)}
    >
      {[1, 2, 3, 4, 5].map((starValue) => {
        const isFilled = currentDisplay >= starValue;
        return (
          <button
            key={starValue}
            type="button"
            disabled={readOnly || isPending}
            onClick={() => handleRate(starValue)}
            onMouseEnter={() => !readOnly && setHoverRating(starValue)}
            className={`transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 rounded-sm disabled:cursor-auto
              ${isFilled ? 'text-yellow-400 scale-110' : 'text-gray-300 hover:text-yellow-300'}
              ${readOnly ? '' : 'hover:scale-125'}
            `}
            aria-label={`Noter ${starValue} étoiles`}
          >
            <StarIcon filled={isFilled} className="w-5 h-5 sm:w-6 sm:h-6 drop-shadow-sm" />
          </button>
        );
      })}
    </div>
  );
}
