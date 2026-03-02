'use client';
import Image from 'next/image';
import { ratingColor } from '@/lib/ratingColor';

interface MusicCardProps {
  artwork: string;
  title: string;
  artist: string;
  rating?: number;
  rank?: number;
  badge?: string;
  onClick?: () => void;
}

export default function MusicCard({ artwork, title, artist, rating, rank, badge, onClick }: MusicCardProps) {
  const col = rating != null ? ratingColor(rating) : null;
  return (
    <button
      onClick={onClick}
      className="group text-left w-full bg-[#141414] border border-white/[0.06] rounded-2xl overflow-hidden hover:border-[#6C63FF]/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
    >
      <div className="relative aspect-square bg-[#1c1c1e]">
        {artwork && (
          <Image src={artwork} alt={title} fill className="object-cover" unoptimized sizes="200px" />
        )}
        {rank != null && (
          <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
            {rank}
          </div>
        )}
        {rating != null && col && (
          <div className="absolute top-2 right-2 rounded-lg px-2 py-1" style={{ backgroundColor: col }}>
            <span className="text-xs font-black text-white">{rating.toFixed(1)}</span>
          </div>
        )}
        {badge && rating == null && (
          <div className="absolute bottom-2 left-2 right-2 rounded-lg px-2 py-1 bg-black/60 backdrop-blur-sm">
            <span className="text-[10px] font-semibold text-[#8E8E93] truncate block">{badge}</span>
          </div>
        )}
      </div>
      <div className="p-2.5">
        <p className="text-xs font-semibold truncate text-white">{title}</p>
        <p className="text-[11px] text-[#8E8E93] truncate mt-0.5">{artist}</p>
      </div>
    </button>
  );
}
