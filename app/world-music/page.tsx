'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import AppShell from '@/components/AppShell';
import RatingModal, { type ModalItem } from '@/components/RatingModal';
import { supabase } from '@/lib/supabase';
import { getCurrentWorldMusicWeek } from '@/lib/worldMusicSchedule';

function ListRow({ artwork, title, artist, rank, badge, onClick }: { artwork: string; title: string; artist: string; rank: number; badge?: string; onClick: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '8px 20px', background: hov ? 'rgba(255,255,255,0.04)' : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s' }}>
      <span style={{ width: 28, textAlign: 'right', fontSize: 13, fontWeight: 700, color: rank <= 3 ? '#6C63FF' : 'rgba(255,255,255,0.25)', flexShrink: 0 }}>{rank}</span>
      <div style={{ width: 44, height: 44, borderRadius: 8, overflow: 'hidden', background: '#1c1c1e', flexShrink: 0, position: 'relative' }}>
        {artwork ? <Image src={artwork} alt={title} fill style={{ objectFit: 'cover' }} unoptimized sizes="44px" />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3a3a3c', fontSize: 16 }}>♪</div>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 1 }}>{title}</p>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{artist}</p>
      </div>
      {badge && (
        <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.06)', borderRadius: 6, padding: '3px 7px', letterSpacing: 0.5, textTransform: 'uppercase', flexShrink: 0 }}>{badge}</span>
      )}
    </button>
  );
}

export default function WorldMusicPage() {
  const week = getCurrentWorldMusicWeek();
  const [userId, setUserId] = useState<string | null>(null);
  const [modalItem, setModalItem] = useState<ModalItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [recTracks, setRecTracks] = useState<{ id: string; title: string; artist: string; artwork: string }[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(true);
  const open = (item: ModalItem) => { setModalItem(item); setModalOpen(true); };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((ev, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Fetch additional recs from iTunes using the week's searchTerms
  useEffect(() => {
    if (!week.searchTerms?.length) { setLoadingRecs(false); return; }
    const curatedIds = new Set((week.manualTracks ?? []).map(t => t.id));
    Promise.all(
      week.searchTerms.map(term =>
        fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&media=music&limit=10&country=US`)
          .then(r => r.json())
          .then(d => (d?.results ?? [])
            .filter((r: any) => r.wrapperType === 'track')
            .map((r: any) => ({
              id: `itunes:trk:${r.trackId}`,
              title: r.trackName,
              artist: r.artistName,
              artwork: (r.artworkUrl100 ?? '').replace('100x100bb', '600x600bb'),
            }))
          )
          .catch(() => [])
      )
    ).then(batches => {
      const seen = new Set<string>(curatedIds);
      const recs = batches.flat().filter(t => {
        if (seen.has(t.id)) return false;
        seen.add(t.id);
        return true;
      });
      setRecTracks(recs.slice(0, 30));
      setLoadingRecs(false);
    });
  }, [week.searchTerms]);

  const curated = week.manualTracks ?? [];
  const allTracks = [...curated, ...recTracks];

  return (
    <AppShell>
      <div style={{ padding: '32px 24px 80px', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}>

        <div style={{ marginBottom: 28 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: '#6C63FF', marginBottom: 6 }}>World Music Week</p>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px', marginBottom: 6 }}>{week.flag} {week.region}</h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>{week.description}</p>
        </div>

        {/* Section header */}
        {curated.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#6C63FF', letterSpacing: 0.5, textTransform: 'uppercase' }}>Curated</p>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
          </div>
        )}

        {/* All tracks — curated first, then recs */}
        <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden' }}>
          {allTracks.length === 0 && !loadingRecs ? (
            <p style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.25)', fontSize: 14 }}>No tracks this week</p>
          ) : (
            allTracks.map((t, i) => {
              const isCurated = i < curated.length;
              return (
                <ListRow
                  key={`wm-${i}-${t.id}`}
                  artwork={t.artwork}
                  title={t.title}
                  artist={t.artist}
                  rank={i + 1}
                  onClick={() => open({ id: t.id, title: t.title, artist: t.artist, artwork: t.artwork, type: 'song' })}
                />
              );
            })
          )}
          {loadingRecs && recTracks.length === 0 && curated.length > 0 && (
            <p style={{ textAlign: 'center', padding: '16px 0', color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>Loading more…</p>
          )}
        </div>

        {/* Divider label between curated and recs */}
        {!loadingRecs && recTracks.length > 0 && (
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', textAlign: 'center', marginTop: 8 }}>
            + {recTracks.length} more from our picks
          </p>
        )}
      </div>

      <RatingModal open={modalOpen} onClose={() => setModalOpen(false)} item={modalItem} userId={userId} />
    </AppShell>
  );
}
