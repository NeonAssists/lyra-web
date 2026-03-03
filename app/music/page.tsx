'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { getArtworkHiRes } from '@/lib/itunes';
import AppShell from '@/components/AppShell';
import RatingModal, { type ModalItem } from '@/components/RatingModal';
import { supabase } from '@/lib/supabase';

const GENRES = [
  { name: 'All',        id: null },
  { name: 'Hip-Hop',    id: '18' },
  { name: 'R&B / Soul', id: '15' },
  { name: 'Pop',        id: '14' },
  { name: 'Rock',       id: '21' },
  { name: 'Electronic', id: '7'  },
  { name: 'Country',    id: '6'  },
  { name: 'Jazz',       id: '11' },
  { name: 'Latin',      id: '12' },
  { name: 'Classical',  id: '5'  },
];

function toItemId(id: string, type: 'song' | 'album') {
  return type === 'album' ? `itunes:alb:${id}` : `itunes:trk:${id}`;
}

function AlbumTile({ artwork, title, artist, onClick }: { artwork: string; title: string; artist: string; onClick: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: hov ? '#1c1c1e' : 'transparent', border: 'none', cursor: 'pointer', padding: 10, borderRadius: 12, textAlign: 'left', transition: 'background 0.15s', width: '100%' }}>
      <div style={{ position: 'relative', width: '100%', aspectRatio: '1', borderRadius: 10, overflow: 'hidden', background: '#1c1c1e', marginBottom: 10 }}>
        {artwork
          ? <Image src={artwork} alt={title} fill style={{ objectFit: 'cover' }} unoptimized sizes="200px" />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3a3a3c', fontSize: 28 }}>♪</div>}
      </div>
      <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3 }}>{title}</p>
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{artist}</p>
    </button>
  );
}

export default function MusicPage() {
  const [activeGenre, setActiveGenre] = useState<string | null>(null);
  const [albums, setAlbums] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalItem, setModalItem] = useState<ModalItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const open = (item: ModalItem) => { setModalItem(item); setModalOpen(true); };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    setLoading(true);
    const url = activeGenre
      ? `https://itunes.apple.com/us/rss/topalbums/limit=25/genre=${activeGenre}/json`
      : `https://itunes.apple.com/us/rss/topalbums/limit=25/json`;
    fetch(url).then(r => r.json()).then(d => {
      setAlbums((d?.feed?.entry ?? []).map((e: any) => ({
        id: e.id?.attributes?.['im:id'] ?? '',
        title: e['im:name']?.label ?? '',
        artist: e['im:artist']?.label ?? '',
        artwork: getArtworkHiRes(e['im:image']?.[2]?.label ?? ''),
      })));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [activeGenre]);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song,album&limit=30`);
      const data = await res.json();
      setResults(data?.results ?? []);
      setSearching(false);
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  const genreName = GENRES.find(g => g.id === activeGenre)?.name ?? 'Top Albums';

  return (
    <AppShell>
      <div style={{ padding: '32px 32px 80px', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px', marginBottom: 6 }}>Music</h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>Explore, search, and rate anything in the catalog</p>
        </div>

        {/* Search — full width, prominent */}
        <div style={{ position: 'relative', marginBottom: 32 }}>
          <svg style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', opacity: 0.4, pointerEvents: 'none' }} width="16" height="16" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search songs, albums, artists…"
            style={{ width: '100%', background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '14px 18px 14px 48px', fontSize: 15, color: '#fff', outline: 'none', boxSizing: 'border-box' }} />
          {searching && <div style={{ position: 'absolute', right: 18, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, border: '2px solid rgba(108,99,255,0.3)', borderTopColor: '#6C63FF', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />}
          {query && !searching && <button onClick={() => setQuery('')} style={{ position: 'absolute', right: 18, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, lineHeight: 1 }}>×</button>}
        </div>

        {/* Genre chips — only when not searching */}
        {!query && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 32 }}>
            {GENRES.map(g => (
              <button key={g.id ?? 'all'} onClick={() => setActiveGenre(g.id)}
                style={{ padding: '8px 18px', borderRadius: 100, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                  background: activeGenre === g.id ? '#fff' : '#1a1a1a',
                  color: activeGenre === g.id ? '#000' : 'rgba(255,255,255,0.65)',
                  outline: activeGenre !== g.id ? '1px solid rgba(255,255,255,0.08)' : 'none' }}>
                {g.name}
              </button>
            ))}
          </div>
        )}

        {/* Results */}
        {query ? (
          <div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>
              {searching ? 'Searching…' : `${results.length} results for "${query}"`}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
              {results.map((r: any, i: number) => {
                const isAlbum = r.wrapperType === 'collection' || !r.trackId;
                const id = String(r.trackId ?? r.collectionId ?? '');
                const title = r.trackName ?? r.collectionName ?? '';
                const art = getArtworkHiRes(r.artworkUrl100 ?? '');
                return (
                  <AlbumTile key={`sr-${i}`} artwork={art} title={title} artist={r.artistName ?? ''}
                    onClick={() => open({ id: toItemId(id, isAlbum ? 'album' : 'song'), title, artist: r.artistName ?? '', artwork: art, type: isAlbum ? 'album' : 'song' })} />
                );
              })}
            </div>
          </div>
        ) : (
          <div>
            {/* Section label */}
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>
                {activeGenre ? 'Genre' : 'Charts'}
              </p>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.3px' }}>
                {genreName}
              </h2>
            </div>

            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
                {[...Array(10)].map((_, i) => <div key={i} style={{ aspectRatio: '1', background: '#1c1c1e', borderRadius: 10 }} />)}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
                {albums.map((a: any, i: number) => (
                  <AlbumTile key={`${a.id}-${i}`} artwork={a.artwork} title={a.title} artist={a.artist}
                    onClick={() => open({ id: toItemId(a.id, 'album'), title: a.title, artist: a.artist, artwork: a.artwork, type: 'album' })} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <RatingModal open={modalOpen} onClose={() => setModalOpen(false)} item={modalItem} userId={userId} />
    </AppShell>
  );
}
