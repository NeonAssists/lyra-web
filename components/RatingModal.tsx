'use client';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { ratingColor } from '@/lib/ratingColor';

export interface ModalItem {
  id: string;
  title: string;
  artist: string;
  artwork: string;
  type: 'song' | 'album';
}

interface RatingModalProps {
  open: boolean;
  onClose: () => void;
  item: ModalItem | null;
  userId: string | null;
  onSaved?: () => void;
}

export default function RatingModal({ open, onClose, item, userId, onSaved }: RatingModalProps) {
  const [rating, setRating] = useState(7.0);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) { setRating(7.0); setNote(''); setSaved(false); }
  }, [open, item?.id]);

  const handleSave = async () => {
    if (!userId || !item) return;
    setSaving(true);
    const { error } = await supabase.from('user_rankings').upsert({
      user_id: userId,
      item_id: item.id,
      rating,
      note: note.trim() || null,
      title: item.title,
      artist: item.artist,
      artwork_url: item.artwork,
      item_type: item.type,
      ranked_at: new Date().toISOString(),
    }, { onConflict: 'user_id,item_id' });
    setSaving(false);
    if (!error) {
      setSaved(true);
      onSaved?.();
      setTimeout(onClose, 800);
    }
  };

  if (!open || !item) return null;
  const col = ratingColor(rating);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={e => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-[#141414] border border-white/[0.08] p-6 pb-10 sm:pb-6">
        {/* Drag handle */}
        <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-5 sm:hidden" />

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-[#1c1c1e]">
            {item.artwork && (
              <Image src={item.artwork} alt={item.title} fill className="object-cover" unoptimized />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-base truncate">{item.title}</p>
            <p className="text-sm text-[#8E8E93] truncate mt-0.5">{item.artist}</p>
            <span className="inline-block mt-1.5 text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-white/[0.06] text-[#8E8E93]">
              {item.type}
            </span>
          </div>
        </div>

        {/* Big rating number */}
        <div className="text-center mb-2">
          <span className="text-6xl font-black tabular-nums transition-colors" style={{ color: col }}>
            {rating.toFixed(1)}
          </span>
          <p className="text-xs text-[#8E8E93] mt-1 uppercase tracking-wider">Your Rating</p>
        </div>

        {/* Slider */}
        <div className="mb-6 px-2">
          <input
            type="range" min={0} max={10} step={0.1}
            value={rating}
            onChange={e => setRating(parseFloat(e.target.value))}
            className="w-full cursor-pointer"
            style={{ accentColor: col }}
          />
          <div className="flex justify-between text-[10px] text-[#48484A] mt-1">
            <span>0</span><span>5</span><span>10</span>
          </div>
        </div>

        {/* Note */}
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Add a note… (optional)"
          rows={2}
          className="w-full bg-[#1c1c1e] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder-[#48484A] outline-none resize-none focus:border-[#6C63FF]/40 transition-colors mb-4"
        />

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-white/[0.08] py-3 text-sm font-semibold text-[#8E8E93] hover:bg-white/[0.04] transition-colors"
          >
            Cancel
          </button>
          {userId ? (
            <button
              onClick={handleSave}
              disabled={saving || saved}
              className="flex-1 rounded-xl py-3 text-sm font-bold text-white transition-all disabled:opacity-70"
              style={{ backgroundColor: saved ? '#16A34A' : col }}
            >
              {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save Rating'}
            </button>
          ) : (
            <a href="/login" className="flex-1 rounded-xl py-3 text-sm font-bold text-white text-center bg-[#6C63FF]">
              Sign in to Rate
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
