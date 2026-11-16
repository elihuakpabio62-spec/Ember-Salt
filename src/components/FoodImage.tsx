import { useState } from 'react';
import { Utensils } from 'lucide-react';

interface FoodImageProps {
  src?: string | null;
  alt: string;
  className?: string;
}

export function FoodImage({ src, alt, className = '' }: FoodImageProps) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-[#EFECE5] text-[#645F58] p-6 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <Utensils className="h-7 w-7 text-[#8C857B]" strokeWidth={1.5} />
        <span className="mt-2 max-w-[18ch] text-xs font-medium leading-snug text-[#645F58]">
          {alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
      loading="lazy"
    />
  );
}
