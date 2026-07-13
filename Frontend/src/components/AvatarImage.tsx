"use client";

import { useState, type ReactNode } from "react";

interface AvatarImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  fallback?: ReactNode;
  fallbackClassName?: string;
}

export default function AvatarImage({ src, alt, className, fallback, fallbackClassName }: AvatarImageProps) {
  const [hasError, setHasError] = useState(false);
  const resolvedSrc = typeof src === "string" ? src.trim() : "";

  if (!resolvedSrc || hasError) {
    return (
      <div className={fallbackClassName ?? "w-full h-full flex items-center justify-center"}>
        {fallback}
      </div>
    );
  }

  return <img src={resolvedSrc} alt={alt} className={className} onError={() => setHasError(true)} />;
}
