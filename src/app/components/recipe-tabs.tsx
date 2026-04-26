'use client';

import { useState, useRef, UIEvent } from 'react';
import { IngredientList } from '@/app/components/ingredient-list';
import { RecipeNotes } from '@/app/components/recipe-notes';
import type { Recipe } from '@/lib/schemas/recipe';

interface RecipeTabsProps {
  recipe: Recipe;
  recipeId: string;
}

export function RecipeTabs({ recipe, recipeId }: RecipeTabsProps) {
  const [activeTab, setActiveTab] = useState<'ingredients' | 'prep'>('ingredients');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToTab = (tab: 'ingredients' | 'prep') => {
    setActiveTab(tab);
    if (scrollContainerRef.current) {
      const { clientWidth } = scrollContainerRef.current;
      scrollContainerRef.current.scrollTo({
        left: tab === 'ingredients' ? 0 : clientWidth,
        behavior: 'smooth',
      });
    }
  };

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const { scrollLeft, clientWidth } = e.currentTarget;
    if (scrollLeft > clientWidth / 2 && activeTab === 'ingredients') {
      setActiveTab('prep');
    } else if (scrollLeft <= clientWidth / 2 && activeTab === 'prep') {
      setActiveTab('ingredients');
    }
  };

  // Add scroll snap style globally or inline so it's guaranteed to hide scrollbar
  return (
    <div className="mt-4">
      {/* Tab Header */}
      <div className="flex bg-[#F0E8DE] p-1.5 rounded-2xl mb-6 relative">
        {/* Animated background pill */}
        <div 
          className="absolute inset-y-1.5 w-[calc(50%-6px)] bg-white rounded-xl shadow-sm transition-transform duration-300 ease-out"
          style={{ transform: activeTab === 'ingredients' ? 'translateX(0)' : 'translateX(calc(100% + 12px))' }}
        />
        
        <button
          onClick={() => scrollToTab('ingredients')}
          className={`relative z-10 flex-1 py-3 text-[15px] font-semibold rounded-xl transition-colors ${
            activeTab === 'ingredients' ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          Ingrédients
        </button>
        <button
          onClick={() => scrollToTab('prep')}
          className={`relative z-10 flex-1 py-3 text-[15px] font-semibold rounded-xl transition-colors ${
            activeTab === 'prep' ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          Préparation
        </button>
      </div>

      {/* Swipe Container */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <style dangerouslySetInnerHTML={{__html: `
          .flex::-webkit-scrollbar {
            display: none;
          }
        `}} />

        {/* Tab 1: Ingredients */}
        <div className="w-full shrink-0 snap-center pr-4 md:pr-6" style={{ width: '100%' }}>
          <IngredientList ingredients={recipe.ingredients} />
        </div>

        {/* Tab 2: Preparation & Notes */}
        <div className="w-full shrink-0 snap-center pl-4 md:pl-6" style={{ width: '100%' }}>
          <div className="mb-8">
            <h2 className="text-base font-semibold text-[var(--color-text-primary)] mb-4 pb-2 border-b border-[var(--color-border)]">
              Étapes de préparation
            </h2>
            <ol className="space-y-0">
              {recipe.steps
                .sort((a, b) => a.order - b.order)
                .map((step, index) => (
                  <li key={index} className="relative pl-12 py-4 border-b border-[var(--color-border-light)] text-[15.5px] leading-relaxed text-[var(--color-text-secondary)]">
                    <span className="absolute left-0 top-4 w-8 h-8 rounded-full bg-[var(--color-bg-primary)] text-[var(--color-accent)] flex items-center justify-center font-bold text-sm shadow-sm border border-[var(--color-border-light)]">
                      {index + 1}
                    </span>
                    {step.text}
                  </li>
                ))}
            </ol>
          </div>

          <RecipeNotes recipeId={recipeId} initialNotes={recipe.notes || ''} />
        </div>
      </div>
    </div>
  );
}
