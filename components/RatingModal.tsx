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
  const [existing, setExisting] = useState<{ rating: number; note?: string } | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !item || !userId) { setExisting(null); return; }
    setRating(7.0); setNote(''); setSaved(false); setExisting(null);
    // load existing rating
    (supabase as any).from('user_rankings').select('rating, note').eq('user_id', userId).eq('item_id', item.id).maybeSingle()
      .then(({ data }: any) => {
        if (data?.rating > 0) {
          setExisting(data);
          setRating(data.rating);
          setNote(data.note ?? '');
        }
      });
  }, [open, item?.id, userId]);

  const handleSave = async () => {
    if (!userId || !item) return;
    setSaving(true);
    const { error } = await supabase.from('user_rankings' as any).upsert({
      user_id: userId, item_id: item.id, rating,
      note: note.trim() || null, title: item.title, artist: item.artist,
      artwork_url: item.artwork, item_type: item.type,
      ranked_at: new Date().toISOString(),
    }, { onConflict: 'user_id,item_id' });
    setSaving(false);
    if (!error) { setSaved(true); onSaved?.(); setTimeout(onClose, 900); }
  };

  const handleRemove = async () => {
    if (!userId || !item) return;
    await (supabase as any).from('user_rankings').delete().eq('user_id', userId).eq('item_id', item.id);
    onSaved?.(); onClose();
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!open || !item) return null;
  const col = ratingColor(rating);

  return (
    <div
      ref={overlayRef}
      onClick={e => { if (e.target === overlayRef.current) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        padding: 24,
      }}
    >
      <div style={{
        width: '100%', maxWidth: 520,
        background: 'rgba(20,20,20,0.92)',
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 24,
        overflow: 'hidden',
        boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
      }}>

        {/* Hero artwork strip */}
        <div style={{ position: 'relative', width: '100%', height: 180, background: '#0a0a0a', overflow: 'hidden' }}>
          {item.artwork && (
            <>
              {/* blurred bg */}
              <Image src={item.artwork} alt="" fill style={{ objectFit: 'cover', filter: 'blur(28px)', transform: 'scale(1.2)', opacity: 0.45 }} unoptimized />
              {/* sharp centered artwork */}
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 110, height: 110, borderRadius: 14, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.6)', position: 'relative', flexShrink: 0 }}>
                  <Image src={item.artwork} alt={item.title} fill style={{ objectFit: 'cover' }} unoptimized sizes="110px" />
                </div>
              </div>
            </>
          )}
          {/* Close button */}
          <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, width: 30, height: 30, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.8)', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>×</button>
          {/* Existing badge */}
          {existing && <div style={{ position: 'absolute', top: 14, left: 14, padding: '3px 10px', borderRadius: 20, background: ratingColor(existing.rating) + '33', border: `1px solid ${ratingColor(existing.rating)}55`, color: ratingColor(existing.rating), fontSize: 12, fontWeight: 800 }}>Your rating: {existing.rating.toFixed(1)}</div>}
        </div>

        {/* Content */}
        <div style={{ padding: '20px 24px 24px' }}>

          {/* Title + meta */}
          <div style={{ marginBottom: 20, textAlign: 'center' }}>
            <p style={{ fontSize: 18, fontWeight: 900, color: '#fff', letterSpacing: '-0.3px', marginBottom: 4 }}>{item.title}</p>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>{item.artist}</p>
            <span style={{ display: 'inline-block', padding: '3px 12px', borderRadius: 20, background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>{item.type}</span>
          </div>

          {/* Big rating */}
          <div style={{ textAlign: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 64, fontWeight: 900, letterSpacing: '-2px', color: col, lineHeight: 1, transition: 'color 0.15s' }}>
              {rating.toFixed(1)}
            </span>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1.5 }}>Your Rating</p>
          </div>

          {/* Slider */}
          <div style={{ marginBottom: 20, padding: '0 4px' }}>
            <input type="range" min={1} max={10} step={0.1} value={rating}
              onChange={e => setRating(parseFloat(e.target.value))}
              style={{ width: '100%', cursor: 'pointer', accentColor: col, height: 4 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontWeight: 700 }}>1.0</span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontWeight: 700 }}>5.0</span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontWeight: 700 }}>10.0</span>
            </div>
          </div>

          {/* Note */}
          <textarea value={note} onChange={e => setNote(e.target.value)}
            placeholder="Add a note… (optional)"
            rows={2}
            style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 14px', fontSize: 14, color: 'rgba(255,255,255,0.85)', outline: 'none', resize: 'none' as const, boxSizing: 'border-box' as const, marginBottom: 16, fontFamily: 'inherit' }} />

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose}
              style={{ flex: 1, padding: '13px 0', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              Cancel
            </button>
            {userId ? (
              <button onClick={handleSave} disabled={saving || saved}
                style={{ flex: 2, padding: '13px 0', borderRadius: 12, border: 'none', background: saved ? '#16a34a' : col, color: '#fff', fontSize: 14, fontWeight: 800, cursor: saving || saved ? 'default' : 'pointer', transition: 'all 0.2s', opacity: saving ? 0.7 : 1 }}>
                {saved ? '✓ Saved!' : saving ? 'Saving…' : existing ? 'Update Rating' : 'Save Rating'}
              </button>
            ) : (
              <a href="/login" style={{ flex: 2, padding: '13px 0', borderRadius: 12, background: '#6C63FF', color: '#fff', fontSize: 14, fontWeight: 800, textDecoration: 'none', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                Sign in to Rate
              </a>
            )}
          </div>

          {/* Remove rating */}
          {existing && userId && (
            <button onClick={handleRemove} style={{ display: 'block', width: '100%', marginTop: 12, padding: '8px 0', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'rgba(255,0,0,0.45)', fontWeight: 600, transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,60,60,0.8)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,0,0,0.45)')}>
              Remove rating
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
