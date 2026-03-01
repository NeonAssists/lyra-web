import Image from "next/image";
import { ratingColor } from "@/lib/itunes";

interface SongCardProps {
  artwork: string;
  title: string;
  artist: string;
  rating?: number;
  size?: "sm" | "md" | "lg";
  href?: string;
}

function RatingBadge({ rating }: { rating: number }) {
  return (
    <div
      className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold"
      style={{
        backgroundColor: `${ratingColor(rating)}20`,
        color: ratingColor(rating),
      }}
    >
      {rating}
    </div>
  );
}

export default function SongCard({
  artwork,
  title,
  artist,
  rating,
  size = "md",
}: SongCardProps) {
  const sizeClasses = {
    sm: "w-[140px]",
    md: "w-[160px]",
    lg: "w-full",
  };

  return (
    <div
      className={`group flex-shrink-0 ${sizeClasses[size]} cursor-pointer`}
    >
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-white/[0.08] bg-surface transition-transform duration-200 group-hover:scale-[1.02]">
        <Image
          src={artwork}
          alt={title}
          fill
          className="object-cover"
          unoptimized
          sizes={size === "lg" ? "100vw" : "160px"}
        />
        {rating !== undefined && <RatingBadge rating={rating} />}
      </div>
      <div className="mt-2 px-0.5">
        <p className="truncate text-sm font-medium text-white">{title}</p>
        <p className="truncate text-xs text-text-secondary">{artist}</p>
      </div>
    </div>
  );
}
