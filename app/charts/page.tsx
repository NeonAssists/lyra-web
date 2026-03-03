'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import AppShell from '@/components/AppShell';
import RatingModal, { type ModalItem } from '@/components/RatingModal';
import { supabase } from '@/lib/supabase';

function getHiRes(url: string) { return url?.replace('100x100bb', '600x600bb') ?? ''; }
function toItemId(id: string, type: 'song' | 'album') { return type === 'album' ? `itunes:alb:${id}` : `itunes:trk:${id}`; }

function ChartCard({ artwork, title, artist, rank, onClick }: { artwork: string; title: string; artist: string; rank: number; onClick: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: hov ? '#1c1c1e' : 'transparent', border: 'none', cursor: 'pointer', padding: 10, borderRadius: 12, textAlign: 'left', width: '100%', transition: 'background 0.15s' }}>
      <div style={{ position: 'relative', width: '100%', aspectRatio: '1', borderRadius: 10, overflow: 'hidden', background: '#1c1c1e', marginBottom: 8 }}>
        {artwork
          ? <Image src={artwork} alt={title} fill style={{ objectFit: 'cover' }} unoptimized sizes="200px" />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3a3a3c', fontSize: 24 }}>&#9835;</div>}
        <div style={{ position: 'absolute', top: 6, left: 6, background: 'rgba(0,0,0,0.75)', color: '#fff', fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 6 }}>#{rank}</div>
      </div>
      <p style={{ fontSize: 12, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>{title}</p>
      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{artist}</p>
    </button>
  );
}

export default function ChartsPage() {
  const [topSongs, setTopSongs] = useState<any[]>([]);
  const [topAlbums, setTopAlbums] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [modalItem, setModalItem] = useState<ModalItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const open = (item: ModalItem) => { setModalItem(item); setModalOpen(true); };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });
  }, []);

  useEffect(() => {
    const map = (e: any) => ({
      id: e.id?.attributes?.['im:id'] ?? '',
      title: e['im:name']?.label ?? '',
      artist: e['im:artist']?.label ?? '',
      artwork: getHiRes(e['im:image']?.[2]?.label ?? ''),
    });
    const safeFetch = (url: string) => fetch(url).then(r => { if (!r.ok) return { feed: { entry: [] } }; return r.json(); }).catch(() => ({ feed: { entry: [] } }));
    Promise.all([
      safeFetch('https://itunes.apple.com/us/rss/topsongs/limit=50/json'),
      safeFetch('https://itunes.apple.com/us/rss/topalbums/limit=50/json'),
    ]).then(([songs, albums]) => {
      setTopSongs((songs?.feed?.entry ?? []).map(map));
      setTopAlbums((albums?.feed?.entry ?? []).map(map));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <AppShell>
      <style>{`
        .charts-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; }
        @media (max-width: 768px) { .charts-grid { grid-template-columns: repeat(2, 1fr) !important; } }
      `}</style>
      <div style={{ padding: '32px 32px 80px', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}>

        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px', marginBottom: 6 }}>Charts</h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>What the US is listening to right now</p>
        </div>

        {/* Top 50 Songs */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>Songs</p>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.3px', margin: 0 }}>Top 50 Songs</h2>
          </div>
          {loading ? (
            <div className="charts-grid">
              {[...Array(10)].map((_, i) => <div key={`ss-${i}`} style={{ aspectRatio: '1', background: '#1c1c1e', borderRadius: 10 }} />)}
            </div>
          ) : (
            <div className="charts-grid">
              {topSongs.map((s: any, i: number) => (
                <ChartCard key={`cs-${i}-${s.id}`} artwork={s.artwork} title={s.title} artist={s.artist} rank={i + 1}
                  onClick={() => open({ id: toItemId(s.id, 'song'), title: s.title, artist: s.artist, artwork: s.artwork, type: 'song' })} />
              ))}
            </div>
          )}
        </div>

        {/* Top 50 Albums */}
        <div>
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>Albums</p>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.3px', margin: 0 }}>Top 50 Albums</h2>
          </div>
          {loading ? (
            <div className="charts-grid">
              {[...Array(10)].map((_, i) => <div key={`sa-${i}`} style={{ aspectRatio: '1', background: '#1c1c1e', borderRadius: 10 }} />)}
            </div>
          ) : (
            <div className="charts-grid">
              {topAlbums.map((a: any, i: number) => (
                <ChartCard key={`ca-${i}-${a.id}`} artwork={a.artwork} title={a.title} artist={a.artist} rank={i + 1}
                  onClick={() => open({ id: toItemId(a.id, 'album'), title: a.title, artist: a.artist, artwork: a.artwork, type: 'album' })} />
              ))}
            </div>
          )}
        </div>
      </div>

      <RatingModal open={modalOpen} onClose={() => setModalOpen(false)} item={modalItem} userId={userId} />
    </AppShell>
  );
}
