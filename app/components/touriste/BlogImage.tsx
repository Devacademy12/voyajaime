"use client";

const FALLBACK = "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=800&q=80";

export function BlogImage({
  src,
  alt,
  className,
  style,
}: {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <img
      src={src || FALLBACK}
      alt={alt}
      className={className}
      style={style}
      onError={e => { (e.target as HTMLImageElement).src = FALLBACK; }}
    />
  );
}