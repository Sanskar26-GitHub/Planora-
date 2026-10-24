import React, { useState, useEffect } from 'react';
import { User } from 'lucide-react';

export interface SafeAvatarProps {
  src?: string;
  alt?: string;
  initials?: string;
  className?: string;
  sizeClassName?: string;
}

/**
 * SafeAvatar displays a user avatar with graceful fallback to user initials
 * or a clean neutral icon if the image fails or is missing.
 */
export const SafeAvatar: React.FC<SafeAvatarProps> = ({
  src,
  alt = 'User profile',
  initials = 'PL',
  className = '',
  sizeClassName = 'w-7 h-7',
}) => {
  const [hasError, setHasError] = useState<boolean>(!src);

  useEffect(() => {
    setHasError(!src);
  }, [src]);

  if (hasError || !src) {
    return (
      <div
        className={`${sizeClassName} rounded-full bg-[#ede7dd] border border-[#c8beaf] text-[#1b4332] font-semibold flex items-center justify-center shrink-0 select-none text-[11px] tracking-tight ${className}`}
        role="img"
        aria-label={alt}
      >
        {initials ? (
          <span>{initials.toUpperCase().slice(0, 2)}</span>
        ) : (
          <User className="w-3.5 h-3.5 text-[#5c5344]" />
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setHasError(true)}
      referrerPolicy="no-referrer"
      className={`${sizeClassName} rounded-full object-cover border border-[#c8beaf] shrink-0 ${className}`}
    />
  );
};
