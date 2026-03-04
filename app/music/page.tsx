'use client';
import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { getArtworkHiRes } from '@/lib/itunes';
import AppShell from '@/components/AppShell';
import { sessionGenre, sessionOffset, sessionShuffle } from '@/lib/sessionSeed';
import RatingModal, { type ModalItem } from '@/components/RatingModal';
import AlbumView from '@/components/AlbumView';
import { useModals } from '@/hooks/useModals';
import { supabase } from '@/lib/supabase';
import SeeAllCard from '@/components/SeeAllCard';

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

// Classic artists for the 60/40 mix — covers hip-hop, R&B, rock, pop, jazz, soul
const CLASSIC_SEEDS = [
  'The Beatles', 'Pink Floyd', 'Led Zeppelin', 'Marvin Gaye',
  'Stevie Wonder', 'Michael Jackson', 'Prince', 'Fleetwood Mac',
  'Bob Marley', 'Nirvana', 'Radiohead', 'Lauryn Hill',
  'OutKast', 'A Tribe Called Quest', 'The Notorious B.I.G.',
  'Tupac Shakur', 'Wu-Tang Clan', 'Nas', 'Jay-Z', 'Kanye West',
  'Frank Ocean', 'Kendrick Lamar', 'Amy Winehouse', 'Erykah Badu',
  'Miles Davis', 'John Coltrane', 'Aretha Franklin', 'Al Green',
  'D\'Angelo', 'Sade', 'Bob Dylan', 'David Bowie',
  'Queen', 'The Rolling Stones', 'Jimi Hendrix', 'Curtis Mayfield',
  'Childish Gambino', 'Tyler The Creator', 'SZA', 'Mac Miller',
];

function toItemId(id: string, type: 'song' | 'album') {
  return type === 'album' ? `itunes:alb:${id}` : `itunes:trk:${id}`;
}

// Returns 'large' (2×2), 'wide' (2×1), or 'small' (1×1) based on position
function tileSize(i: number): 'large' | 'wide' | 'small' {
  if (i % 11 === 0) return 'large';   // every 11th: featured 2×2
  if (i % 7 === 3) return 'wide';     // occasional wide tile
  return 'small';
}

function AlbumTile({ artwork, title, artist, badge, onClick, size = 'small' }: { artwork: string; title: string; artist: string; badge?: string; onClick: () => void; size?: 'large' | 'wide' | 'small' }) {
  const [hov, setHov] = useState(false);
  const isLarge = size === 'large';
  const isWide = size === 'wide';
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
        borderRadius: 12, textAlign: 'left', width: '100%', transition: 'opacity 0.15s', opacity: hov ? 0.75 : 1,
        gridColumn: isLarge ? 'span 2' : isWide ? 'span 2' : 'span 1',
        gridRow: isLarge ? 'span 2' : 'span 1',
      }}>
      <div style={{ position: 'relative', width: '100%', aspectRatio: isWide ? '2/1' : '1', borderRadius: 10, overflow: 'hidden', background: '#1c1c1e', marginBottom: 6 }}>
        {artwork
          ? <Image src={artwork} alt={title} fill style={{ objectFit: 'cover' }} unoptimized sizes={isLarge ? '400px' : '200px'} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3a3a3c', fontSize: isLarge ? 48 : 28 }}>♪</div>}
        {badge && (
          <div style={{ position: 'absolute', top: 6, left: 6, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', color: 'rgba(255,255,255,0.7)', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 5, letterSpacing: 0.5, textTransform: 'uppercase' }}>
            {badge}
          </div>
        )}
        {isLarge && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '32px 12px 10px', background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)' }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>{title}</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{artist}</p>
          </div>
        )}
      </div>
      {!isLarge && (
        <>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2, paddingLeft: 2 }}>{title}</p>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingLeft: 2 }}>{artist}</p>
        </>
      )}
    </button>
  );
}

export default function MusicPage() {
  const [activeGenre, setActiveGenre] = useState<string | null>(null);
  const [newAlbums, setNewAlbums] = useState<any[]>([]);
  const [genreSongs, setGenreSongs] = useState<any[]>([]);
  const [classicAlbums, setClassicAlbums] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const { modalItem, modalOpen, closeModal, albumView, albumOpen, closeAlbum, openItem: open, onAlbumSongClick, onAlbumRecClick, onModalAlbumClick } = useModals();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
    setActiveGenre(null); // Start on "All"
  }, []);

  // Fetch new/trending albums (and songs for genre) from iTunes RSS
  useEffect(() => {
    setLoading(true);
    const mapEntry = (e: any) => ({
      id: e.id?.attributes?.['im:id'] ?? '',
      title: e['im:name']?.label ?? '',
      artist: e['im:artist']?.label ?? '',
      artwork: getArtworkHiRes(e['im:image']?.[2]?.label ?? ''),
      source: 'new' as const,
    });
    const safeFetch = (url: string) => fetch(url).then(r => { if (!r.ok) return { feed: { entry: [] } }; return r.json(); }).catch(() => ({ feed: { entry: [] } }));
    const albumUrl = activeGenre
      ? `https://itunes.apple.com/us/rss/topalbums/limit=100/genre=${activeGenre}/json`
      : `https://itunes.apple.com/us/rss/topalbums/limit=100/json`;
    const songUrl = activeGenre
      ? `https://itunes.apple.com/us/rss/topsongs/limit=100/genre=${activeGenre}/json`
      : null;
    const fetches: Promise<any>[] = [safeFetch(albumUrl)];
    if (songUrl) fetches.push(safeFetch(songUrl));
    Promise.all(fetches).then(([albumData, songData]) => {
      setNewAlbums((albumData?.feed?.entry ?? []).map(mapEntry));
      setGenreSongs(songData ? (songData?.feed?.entry ?? []).map(mapEntry) : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [activeGenre]);

  // Fetch classic albums from iTunes search (session-stable selection)
  useEffect(() => {
    const shuffled = sessionShuffle([...CLASSIC_SEEDS], 'classic_artists');
    const picks = shuffled.slice(0, 12); // Pick 12 artists per session
    
    Promise.all(
      picks.map(artist =>
        fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(artist)}&entity=album&media=music&limit=3`)
          .then(r => r.json())
          .then(d => (d?.results ?? [])
            .filter((r: any) => r.wrapperType === 'collection')
            .map((r: any) => ({
              id: String(r.collectionId),
              title: r.collectionName,
              artist: r.artistName,
              artwork: getArtworkHiRes(r.artworkUrl100 ?? ''),
              source: 'classic' as const,
            }))
          )
          .catch(() => [])
      )
    ).then(batches => {
      const all = batches.flat();
      // Deduplicate by album ID
      const seen = new Set<string>();
      const deduped = all.filter(a => { if (seen.has(a.id)) return false; seen.add(a.id); return true; });
      setClassicAlbums(sessionShuffle(deduped, 'classic_albums'));
    });
  }, []);

  // Build the 60/40 mix
  const mixedAlbums = useMemo(() => {
    if (!newAlbums.length && !classicAlbums.length) return [];
    
    const totalSlots = 30;
    const classicCount = Math.round(totalSlots * 0.6);
    const newCount = totalSlots - classicCount;
    
    const classicSlice = classicAlbums.slice(0, classicCount);
    const newSlice = newAlbums.slice(0, newCount);
    
    // Interleave: for every 3 classic, insert 2 new
    const mixed: any[] = [];
    let ci = 0, ni = 0;
    while (mixed.length < totalSlots && (ci < classicSlice.length || ni < newSlice.length)) {
      // Add 3 classic
      for (let k = 0; k < 3 && ci < classicSlice.length; k++) {
        mixed.push(classicSlice[ci++]);
      }
      // Add 2 new
      for (let k = 0; k < 2 && ni < newSlice.length; k++) {
        mixed.push(newSlice[ni++]);
      }
    }
    return mixed.slice(0, totalSlots);
  }, [newAlbums, classicAlbums]);

  // Search
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

  const genreName = GENRES.find(g => g.id === activeGenre)?.name ?? 'All Music';

  return (
    <AppShell>
      <div className="lyra-page" style={{ padding: '32px 32px 80px', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px', marginBottom: 6 }}>Music</h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>Classic and new — explore, search, and rate anything</p>
        </div>

        {/* Search */}
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

        {/* Search results */}
        {query ? (
          <div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>
              {searching ? 'Searching…' : `${results.length} results for "${query}"`}
            </p>
            <div className="lyra-grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 4 }}>
              {results.map((r: any, i: number) => {
                const isAlbum = r.wrapperType === 'collection' || !r.trackId;
                const id = String(r.trackId ?? r.collectionId ?? '');
                const title = r.trackName ?? r.collectionName ?? '';
                const art = getArtworkHiRes(r.artworkUrl100 ?? '');
                return (
                  <AlbumTile key={`sr-${i}`} artwork={art} title={title} artist={r.artistName ?? ''} size={tileSize(i)}
                    onClick={() => open({ id: toItemId(id, isAlbum ? 'album' : 'song'), title, artist: r.artistName ?? '', artwork: art, type: isAlbum ? 'album' : 'song' })} />
                );
              })}
            </div>
          </div>
        ) : (
          <div>
            {/* Section label */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>
                  {activeGenre ? 'Genre' : 'Classic & New'}
                </p>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.3px' }}>
                  {activeGenre ? genreName : 'Mixed for You'}
                </h2>
              </div>
              <div style={{ display: 'flex', gap: 6 }}></div>
            </div>

            {loading && !classicAlbums.length ? (
              <div className="lyra-grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 4 }}>
                {[...Array(25)].map((_, i) => <div key={i} style={{ aspectRatio: '1', background: '#1c1c1e', borderRadius: 10 }} />)}
              </div>
            ) : activeGenre ? (
              /* When a genre is selected, show both top albums AND top songs */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
                {/* Top Albums for genre */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '-0.3px', margin: 0 }}>Top Albums</h3>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', padding: '4px 10px', background: '#1a1a1a', borderRadius: 8 }}>{newAlbums.length} albums</span>
                  </div>
                  <div className="lyra-grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 4 }}>
                    {newAlbums.slice(0, 24).map((a: any, i: number) => (
                      <AlbumTile key={`genre-alb-${i}-${a.id}`} artwork={a.artwork} title={a.title} artist={a.artist} size={tileSize(i)}
                        onClick={() => open({ id: toItemId(a.id, 'album'), title: a.title, artist: a.artist, artwork: a.artwork, type: 'album' })} />
                    ))}
                    {newAlbums.length > 24 && (
                      <SeeAllCard
                        artworks={newAlbums.slice(24, 28).map((a: any) => a.artwork)}
                        label="See all"
                        href={`/new-albums?genre=${activeGenre}`}
                      />
                    )}
                  </div>
                </div>
                {/* Top Songs for genre */}
                {genreSongs.length > 0 && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                      <h3 style={{ fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '-0.3px', margin: 0 }}>Top Songs</h3>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', padding: '4px 10px', background: '#1a1a1a', borderRadius: 8 }}>{genreSongs.length} songs</span>
                    </div>
                    <div className="lyra-grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 4 }}>
                      {genreSongs.map((s: any, i: number) => (
                        <AlbumTile key={`genre-sng-${i}-${s.id}`} artwork={s.artwork} title={s.title} artist={s.artist} size={tileSize(i)}
                          onClick={() => open({ id: toItemId(s.id, 'song'), title: s.title, artist: s.artist, artwork: s.artwork, type: 'song' })} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* "All" tab — 60/40 classic/new mix */
              <div className="lyra-grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 4 }}>
                {mixedAlbums.slice(0, 25).map((a: any, i: number) => (
                  <AlbumTile key={`mix-${i}-${a.id}`} artwork={a.artwork} title={a.title} artist={a.artist} size={tileSize(i)}
                    badge={a.source === 'classic' ? 'classic' : undefined}
                    onClick={() => open({ id: toItemId(a.id, 'album'), title: a.title, artist: a.artist, artwork: a.artwork, type: 'album' })} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <AlbumView open={albumOpen} onClose={closeAlbum}
        albumId={albumView?.id ?? ''} albumTitle={albumView?.title ?? ''} albumArtist={albumView?.artist ?? ''} albumArtwork={albumView?.artwork ?? ''}
        userId={userId} onOpenSong={onAlbumSongClick} onOpenAlbum={onAlbumRecClick} />
      <RatingModal open={modalOpen} onClose={closeModal} item={modalItem} userId={userId} onOpenAlbum={onModalAlbumClick} />
    </AppShell>
  );
}
