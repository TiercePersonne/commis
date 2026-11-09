'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Utensils } from 'lucide-react';

interface RecipeImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackClassName?: string;
}

export function RecipeImage({ src, alt, className, fallbackClassName }: RecipeImageProps) {
  const [useNative, setUseNative] = useState(false);
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className={fallbackClassName}>
        <Utensils size={40} strokeWidth={1.3} className="text-[var(--color-text-muted)] opacity-60" />
      </div>
    );
  }

  if (useNative) {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 1024px) 100vw, 800px"
        priority
        className="object-cover object-center"
        onError={() => setUseNative(true)}
      />
    </div>
  );
}
