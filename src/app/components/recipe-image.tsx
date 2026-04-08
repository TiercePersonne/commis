'use client';

import { useState } from 'react';
import { getImageProxySrc } from '@/lib/utils/image';

interface RecipeImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackClassName?: string;
}

export function RecipeImage({ src, alt, className, fallbackClassName }: RecipeImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className={fallbackClassName}>
        🍽️
      </div>
    );
  }

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      onError={() => {
        if (imgSrc === src) {
          setImgSrc(getImageProxySrc(src));
        } else {
          setFailed(true);
        }
      }}
    />
  );
}
