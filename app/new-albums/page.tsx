'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import AppShell from '@/components/AppShell';
import RatingModal, { type ModalItem } from '@/components/RatingModal';
import { supabase } from '@/lib/supabase';

function getHiRes(url: string) { return url?.replace('100x100bb', '600x600bb') ?? ''; }
function toItemId(id: string) { return `itunes:alb:${id}`; }

const GENRES = [
  { name: 'All', id: null }, { name: 'Hip-Hop', id: '18' }, { name: 'R&B / Soul', id: '15' },
  { name: 'Pop', id: '14' }, { name: 'Rock', id: '21' }, { name: 'Electronic', id: '7' },
  { name: 'Country', id: '6' }, { name: 'Jazz', id: '11' }, { name: 'Latin', id: '12' },
];

function AlbumTile({ artwork, title, artist, rank, onClick }: { artwork: string; title: string; artist: string; rank: number; onClick: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: hov ? '#1c1c1e' : 'transparent', border: 'none', cursor: 'pointer', padding: 10, borderRadius: 12, textAlign: 'left', width: '100%', transition: 'background 0.15s' }}>
      <div style={{ position: 'relative', width: '100%', aspectRatio: '1', borderRadius: 10, overflow: 'hidden', background: '#1c1c1e', marginBottom: 8 }}>
        {artwork && <Image src={artwork} alt={title} fill style={{ objectFit: 'cover' }} unoptimized sizes="180px" />}
        <div style={{ position: 'absolute', top: 6, left: 6, background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 5 }}>#{rank}</div>
      </div>
      <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>{title}</p>
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{artist}</p>
    </button>
  );
}

export default function NewAlbumsPage() {
  const [albums, setAlbums] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeGenre, setActiveGenre] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
    const params = new URLSearchParams(window.location.search);
    const g = params.get('genre');
    if (g) setActiveGenre(g);
  }, []);

  useEffect(() => {
    setLoading(true);
    const url = activeGenre
      ? `https://itunes.apple.com/us/rss/topalbums/limit=25/genre=${activeGenre}/json`
      : `https://itunes.apple.com/us/rss/topalbums/limit=25/json`;
    fetch(url).then(r => r.json()).then(d => {
      setAlbums((d?.feed?.entry ?? []).map((e: any) => ({ id: e.id?.attributes?.['im:id'] ?? '', title: e['im:name']?.label ?? '', artist: e['im:artist']?.label ?? '', artwork: getHiRes(e['im:image']?.[2]?.label ?? '') })));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [activeGenre]);

  return (
    <AppShell>
      <div className="lyra-page" style={{ padding: '32px 28px 80px', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}>
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>Browse</p>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px', marginBottom: 6 }}>New Albums</h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>Top albums right now — tap to rate</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
          {GENRES.map(g => (
            <button key={g.id ?? 'all'} onClick={() => setActiveGenre(g.id)}
              style={{ padding: '7px 16px', borderRadius: 100, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.15s', background: activeGenre === g.id ? '#fff' : '#1a1a1a', color: activeGenre === g.id ? '#000' : 'rgba(255,255,255,0.6)', outline: activeGenre !== g.id ? '1px solid rgba(255,255,255,0.08)' : 'none' }}>
              {g.name}
            </button>
          ))}
        </div>
        {loading
          ? <div className="lyra-grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>{[...Array(10)].map((_, i) => <div key={i} style={{ aspectRatio: '1', background: '#1c1c1e', borderRadius: 10 }} />)}</div>
          : <div className="lyra-grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
              {albums.map((a, i) => (
                <AlbumTile key={i} artwork={a.artwork} title={a.title} artist={a.artist} rank={i + 1}
                  onClick={() => { setModal({ id: toItemId(a.id), title: a.title, artist: a.artist, artwork: a.artwork, type: 'album' }); setModalOpen(true); }} />
              ))}
            </div>}
      </div>
      <RatingModal open={modalOpen} onClose={() => setModalOpen(false)} item={modal} userId={userId} />
    </AppShell>
  );
}
