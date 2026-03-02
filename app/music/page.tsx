'use client';
import { useState, useEffect } from 'react';
import { getArtworkHiRes } from '@/lib/itunes';
import MusicCard from '@/components/MusicCard';
import SectionHeader from '@/components/SectionHeader';
import AppShell from '@/components/AppShell';
import RatingModal, { type ModalItem } from '@/components/RatingModal';
import { supabase } from '@/lib/supabase';

const GENRES = [
  { name: 'Hip-Hop', id: '18' }, { name: 'R&B/Soul', id: '15' },
  { name: 'Pop', id: '14' }, { name: 'Rock', id: '21' },
  { name: 'Electronic', id: '7' }, { name: 'Country', id: '6' },
  { name: 'Jazz', id: '11' }, { name: 'Latin', id: '12' },
];

function toItemId(id: string, type: 'song' | 'album') {
  return type === 'album' ? `itunes:alb:${id}` : `itunes:trk:${id}`;
}

export default function MusicPage() {
  const [activeGenre, setActiveGenre] = useState<string | null>(null);
  const [genreAlbums, setGenreAlbums] = useState<any[]>([]);
  const [newAlbums, setNewAlbums] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalItem, setModalItem] = useState<ModalItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);

  const open = (item: ModalItem) => { setModalItem(item); setModalOpen(true); };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
    fetch('https://itunes.apple.com/us/rss/topalbums/limit=20/json').then(r => r.json()).then(d => {
      setNewAlbums((d?.feed?.entry ?? []).map((e: any) => ({
        id: e.id?.attributes?.['im:id'] ?? '',
        title: e['im:name']?.label ?? '',
        artist: e['im:artist']?.label ?? '',
        artwork: getArtworkHiRes(e['im:image']?.[2]?.label ?? ''),
      })));
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!activeGenre) return;
    setLoading(true);
    fetch(`https://itunes.apple.com/us/rss/topalbums/limit=20/genre=${activeGenre}/json`)
      .then(r => r.json()).then(d => {
        setGenreAlbums((d?.feed?.entry ?? []).map((e: any) => ({
          id: e.id?.attributes?.['im:id'] ?? '',
          title: e['im:name']?.label ?? '',
          artist: e['im:artist']?.label ?? '',
          artwork: getArtworkHiRes(e['im:image']?.[2]?.label ?? ''),
        })));
        setLoading(false);
      });
  }, [activeGenre]);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const t = setTimeout(async () => {
      const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song,album&limit=24`);
      const data = await res.json();
      setResults(data?.results ?? []);
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  const albums = activeGenre ? genreAlbums : newAlbums;

  return (
    <AppShell>
      <div className="px-4 py-6 max-w-5xl mx-auto">
        {/* Search */}
        <div className="mb-6 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#48484A]" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search music…"
            className="w-full bg-[#1c1c1e] border border-white/[0.08] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-[#48484A] outline-none focus:border-[#6C63FF]/40 transition-colors" />
        </div>

        {!query && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none -mx-4 px-4">
            <button onClick={() => setActiveGenre(null)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${!activeGenre ? 'bg-[#6C63FF] text-white' : 'bg-[#1c1c1e] text-[#8E8E93] hover:text-white'}`}>
              All
            </button>
            {GENRES.map(g => (
              <button key={g.id} onClick={() => setActiveGenre(g.id === activeGenre ? null : g.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${activeGenre === g.id ? 'bg-[#6C63FF] text-white' : 'bg-[#1c1c1e] text-[#8E8E93] hover:text-white'}`}>
                {g.name}
              </button>
            ))}
          </div>
        )}

        {query ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {results.map((r: any) => {
              const isAlbum = r.wrapperType === 'collection' || !r.trackId;
              const id = r.trackId ?? r.collectionId;
              const title = r.trackName ?? r.collectionName ?? '';
              const art = getArtworkHiRes(r.artworkUrl100 ?? '');
              return (
                <MusicCard key={`s-${id}`} artwork={art} title={title} artist={r.artistName ?? ''}
                  onClick={() => open({ id: toItemId(String(id), isAlbum ? 'album' : 'song'), title, artist: r.artistName ?? '', artwork: art, type: isAlbum ? 'album' : 'song' })} />
              );
            })}
          </div>
        ) : (
          <>
            <SectionHeader title={activeGenre ? (GENRES.find(g => g.id === activeGenre)?.name ?? 'Albums') : 'Top Albums'} />
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{[...Array(8)].map((_, i) => <div key={i} className="bg-[#141414] rounded-2xl aspect-square animate-pulse" />)}</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {albums.map((a: any) => (
                  <MusicCard key={a.id} artwork={a.artwork} title={a.title} artist={a.artist}
                    onClick={() => open({ id: toItemId(a.id, 'album'), title: a.title, artist: a.artist, artwork: a.artwork, type: 'album' })} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
      <RatingModal open={modalOpen} onClose={() => setModalOpen(false)} item={modalItem} userId={userId} />
    </AppShell>
  );
}
