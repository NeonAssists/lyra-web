'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import AppShell from '@/components/AppShell';
import RatingModal, { type ModalItem } from '@/components/RatingModal';
import { supabase } from '@/lib/supabase';
import { ratingColor } from '@/lib/ratingColor';

function getHiRes(url: string) { return url?.replace('100x100bb', '600x600bb') ?? ''; }
function toItemId(id: string) { return `itunes:trk:${id}`; }

export default function Top50Page() {
  const [songs, setSongs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [myRatings, setMyRatings] = useState<Record<string, number>>({});
  const [modal, setModal] = useState<ModalItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [chart, setChart] = useState<'us' | 'global'>('us');

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      setUserId(data.user.id);
      const { data: rankings } = await (supabase as any).from('user_rankings').select('item_id, rating').eq('user_id', data.user.id).gt('rating', 0);
      const map: Record<string, number> = {};
      for (const r of rankings ?? []) map[r.item_id] = r.rating;
      setMyRatings(map);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    const url = chart === 'us'
      ? 'https://itunes.apple.com/us/rss/topsongs/limit=50/json'
      : 'https://itunes.apple.com/gb/rss/topsongs/limit=50/json';
    fetch(url).then(r => r.json()).then(d => {
      setSongs((d?.feed?.entry ?? []).map((e: any) => ({ id: e.id?.attributes?.['im:id'] ?? '', title: e['im:name']?.label ?? '', artist: e['im:artist']?.label ?? '', artwork: getHiRes(e['im:image']?.[2]?.label ?? '') })));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [chart]);

  return (
    <AppShell>
      <div style={{ padding: '32px 28px 80px', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>Charts</p>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px', marginBottom: 6 }}>{chart === 'us' ? 'Top 50 US 🇺🇸' : 'Top 50 Global 🌍'}</h1>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>Tap any song to rate it</p>
          </div>
          <div style={{ display: 'flex', gap: 4, background: '#1a1a1a', borderRadius: 100, padding: 4, border: '1px solid rgba(255,255,255,0.06)' }}>
            {(['us', 'global'] as const).map(c => (
              <button key={c} onClick={() => setChart(c)} style={{ padding: '7px 16px', borderRadius: 100, fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', background: chart === c ? '#fff' : 'transparent', color: chart === c ? '#000' : 'rgba(255,255,255,0.4)', transition: 'all 0.15s' }}>
                {c === 'us' ? '🇺🇸 US' : '🌍 Global'}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Left: 1-25 */}
          <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>1 – 25</p>
            </div>
            {loading ? [...Array(8)].map((_, i) => <div key={i} style={{ height: 60, margin: '4px 12px', borderRadius: 8, background: '#1a1a1a' }} />)
              : songs.slice(0, 25).map((s, i) => {
                const myRating = myRatings[toItemId(s.id)];
                const col = myRating ? ratingColor(myRating) : null;
                return (
                  <button key={i} onClick={() => { setModal({ id: toItemId(s.id), title: s.title, artist: s.artist, artwork: s.artwork, type: 'song' }); setModalOpen(true); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '9px 16px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s', borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <span style={{ width: 24, textAlign: 'right', fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,0.2)', flexShrink: 0 }}>{i + 1}</span>
                    <div style={{ width: 40, height: 40, borderRadius: 7, overflow: 'hidden', background: '#1c1c1e', flexShrink: 0, position: 'relative' }}>
                      {s.artwork && <Image src={s.artwork} alt={s.title} fill style={{ objectFit: 'cover' }} unoptimized sizes="40px" />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</p>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.artist}</p>
                    </div>
                    {col && <div style={{ flexShrink: 0, padding: '3px 8px', borderRadius: 6, background: col + '18', border: `1px solid ${col}30`, color: col, fontSize: 12, fontWeight: 900 }}>{myRating!.toFixed(1)}</div>}
                  </button>
                );
              })}
          </div>
          {/* Right: 26-50 */}
          <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>26 – 50</p>
            </div>
            {loading ? [...Array(8)].map((_, i) => <div key={i} style={{ height: 60, margin: '4px 12px', borderRadius: 8, background: '#1a1a1a' }} />)
              : songs.slice(25, 50).map((s, i) => {
                const myRating = myRatings[toItemId(s.id)];
                const col = myRating ? ratingColor(myRating) : null;
                return (
                  <button key={i + 25} onClick={() => { setModal({ id: toItemId(s.id), title: s.title, artist: s.artist, artwork: s.artwork, type: 'song' }); setModalOpen(true); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '9px 16px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s', borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <span style={{ width: 24, textAlign: 'right', fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,0.2)', flexShrink: 0 }}>{i + 26}</span>
                    <div style={{ width: 40, height: 40, borderRadius: 7, overflow: 'hidden', background: '#1c1c1e', flexShrink: 0, position: 'relative' }}>
                      {s.artwork && <Image src={s.artwork} alt={s.title} fill style={{ objectFit: 'cover' }} unoptimized sizes="40px" />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</p>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.artist}</p>
                    </div>
                    {col && <div style={{ flexShrink: 0, padding: '3px 8px', borderRadius: 6, background: col + '18', border: `1px solid ${col}30`, color: col, fontSize: 12, fontWeight: 900 }}>{myRating!.toFixed(1)}</div>}
                  </button>
                );
              })}
          </div>
        </div>
      </div>
      <RatingModal open={modalOpen} onClose={() => setModalOpen(false)} item={modal} userId={userId} onSaved={() => supabase.auth.getUser().then(async ({ data }) => { if (!data.user) return; const { data: r } = await (supabase as any).from('user_rankings').select('item_id, rating').eq('user_id', data.user.id).gt('rating', 0); const map: Record<string, number> = {}; for (const x of r ?? []) map[x.item_id] = x.rating; setMyRatings(map); })} />
    </AppShell>
  );
}
