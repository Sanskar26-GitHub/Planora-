import React, { useState, useEffect } from 'react';

export interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt: string;
  fallback?: React.ReactNode;
  fallbackClassName?: string;
  containerClassName?: string;
  isDecorative?: boolean;
}

/**
 * SafeImage provides a resilient image rendering component that prevents broken-image
 * icons, eliminates infinite fallback loops, and avoids layout shifts.
 */
export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  fallback,
  fallbackClassName = '',
  containerClassName = '',
  isDecorative = false,
  className = '',
  ...props
}) => {
  const [hasError, setHasError] = useState<boolean>(!src);

  // Reset error state when src changes
  useEffect(() => {
    setHasError(!src);
  }, [src]);

  const handleError = () => {
    // Immediately flag error without re-requesting or changing src to prevent loops
    setHasError(true);
  };

  if (hasError || !src) {
    if (fallback) {
      return (
        <div
          className={containerClassName || className}
          role={isDecorative ? undefined : 'img'}
          aria-label={isDecorative ? undefined : alt}
          aria-hidden={isDecorative ? 'true' : undefined}
        >
          {fallback}
        </div>
      );
    }

    // Default designed fallback: Tasteful forest-green / ivory warm gradient
    return (
      <div
        className={`w-full h-full bg-linear-to-br from-[#1b4332] via-[#2d6a4f] to-[#142d22] flex items-center justify-center text-[#faf8f5]/80 ${fallbackClassName} ${className}`}
        role={isDecorative ? undefined : 'img'}
        aria-label={isDecorative ? undefined : alt}
        aria-hidden={isDecorative ? 'true' : undefined}
      >
        <div className="w-full h-full opacity-15 bg-[radial-gradient(#faf8f5_1px,transparent_1px)] [background-size:16px_16px]" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={isDecorative ? '' : alt}
      aria-hidden={isDecorative ? 'true' : undefined}
      onError={handleError}
      className={className}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      {...props}
    />
  );
};
