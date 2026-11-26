import React, { useState } from 'react';
import { ImageOff } from 'lucide-react';

interface SafeImageProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackLabel?: string;
  isAvatar?: boolean;
}

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  className = '',
  fallbackLabel,
  isAvatar = false,
}) => {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    const initials = (fallbackLabel || alt || 'KD')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');

    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex items-center justify-center bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 ${className}`}
      >
        {isAvatar ? (
          <span className="text-xs font-semibold tracking-wide">{initials}</span>
        ) : (
          <div className="flex flex-col items-center justify-center gap-1 px-2 text-center">
            <ImageOff className="h-4 w-4 text-slate-400 dark:text-slate-500" />
            {fallbackLabel && (
              <span className="line-clamp-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {fallbackLabel}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
};
