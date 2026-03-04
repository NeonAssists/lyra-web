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

// Every 9th tile (0, 9, 18...) is a 2×2 featured tile. Everything else is 1×1.
function tileSize(i: number): 'large' | 'small' {
  return i % 9 === 0 ? 'large' : 'small';
}

function AlbumTile({ artwork, title, artist, badge, onClick, size = 'small' }: { artwork: string; title: string; artist: string; badge?: string; onClick: () => void; size?: 'large' | 'small' }) {
  const [hov, setHov] = useState(false);
  const isLarge = size === 'large';
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      className={isLarge ? 'lyra-tile-large' : ''}
      style={{
        background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
        borderRadius: 12, textAlign: 'left', width: '100%', transition: 'opacity 0.15s', opacity: hov ? 0.75 : 1,
        gridColumn: isLarge ? 'span 2' : 'span 1',
        gridRow: isLarge ? 'span 2' : 'span 1',
      }}>
      <div style={{ position: 'relative', width: '100%', aspectRatio: '1', borderRadius: 12, overflow: 'hidden', background: '#1c1c1e', marginBottom: 6 }}>
        {artwork
          ? <Image src={artwork} alt={title} fill style={{ objectFit: 'cover' }} unoptimized sizes={isLarge ? '560px' : '280px'} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3a3a3c', fontSize: isLarge ? 48 : 28 }}>♪</div>}
        {badge && (
          <div style={{ position: 'absolute', top: 6, left: 6, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', color: 'rgba(255,255,255,0.7)', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 5, letterSpacing: 0.5, textTransform: 'uppercase' }}>
            {badge}
          </div>
        )}
      </div>
      <p style={{ fontSize: isLarge ? 13 : 12, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2, paddingLeft: 2 }}>{title}</p>
      <p style={{ fontSize: isLarge ? 12 : 11, color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingLeft: 2 }}>{artist}</p>
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

  const [searching, setSearching] = useState(false);
  const { modalItem, modalOpen, closeModal, albumView, albumOpen, closeAlbum, openItem: open, onAlbumSongClick, onAlbumRecClick, onModalAlbumClick } = useModals();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => subscription.unsubscribe();
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

  type SearchResults = { artists: any[]; albums: any[]; songs: any[] };
  const [searchResults, setSearchResults] = useState<SearchResults>({ artists: [], albums: [], songs: [] });

  // Search — parallel fetch for artists, albums, songs
  useEffect(() => {
    if (!query.trim()) { setSearchResults({ artists: [], albums: [], songs: [] }); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const [artistRes, albumRes, songRes] = await Promise.all([
          fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=musicArtist&limit=5`).then(r => r.json()),
          fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=album&limit=12`).then(r => r.json()),
          fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=20`).then(r => r.json()),
        ]);
        setSearchResults({
          artists: artistRes?.results ?? [],
          albums: albumRes?.results?.filter((r: any) => r.wrapperType === 'collection') ?? [],
          songs: songRes?.results?.filter((r: any) => r.wrapperType === 'track') ?? [],
        });
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  const genreName = GENRES.find(g => g.id === activeGenre)?.name ?? 'All Music';

  return (
    <AppShell>
      <div className="lyra-page music-page-wrap" style={{ padding: '32px 28px 80px', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}>

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
          <div className="music-genre-pills" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 32 }}>
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
            {searching ? (
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>Searching…</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
                {/* Artists */}
                {searchResults.artists.length > 0 && (
                  <div>
                    <h3 style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 14 }}>Artists</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {searchResults.artists.map((a: any, i: number) => (
                        <button key={`art-${i}`} onClick={() => { window.location.href = `/artist/${encodeURIComponent(a.artistName)}`; }}
                          style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 12px', borderRadius: 12, background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                          <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#1c1c1e', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: 'rgba(255,255,255,0.3)', overflow: 'hidden', position: 'relative' }}>
                            {a.artworkUrl100
                              ? <Image src={getArtworkHiRes(a.artworkUrl100)} alt={a.artistName} fill style={{ objectFit: 'cover' }} unoptimized sizes="44px" />
                              : '♪'}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 14, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.artistName}</p>
                            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Artist</p>
                          </div>
                          <svg width="14" height="14" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Albums */}
                {searchResults.albums.length > 0 && (
                  <div>
                    <h3 style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 14 }}>Albums</h3>
                    <div className="lyra-grid-responsive music-album-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                      {searchResults.albums.map((a: any, i: number) => {
                        const art = getArtworkHiRes(a.artworkUrl100 ?? '');
                        return (
                          <AlbumTile key={`sal-${i}`} artwork={art} title={a.collectionName} artist={a.artistName ?? ''} size={tileSize(i)}
                            onClick={() => open({ id: toItemId(String(a.collectionId), 'album'), title: a.collectionName, artist: a.artistName ?? '', artwork: art, type: 'album' })} />
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Songs */}
                {searchResults.songs.length > 0 && (
                  <div>
                    <h3 style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 14 }}>Songs</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {searchResults.songs.map((s: any, i: number) => {
                        const art = getArtworkHiRes(s.artworkUrl100 ?? '');
                        return (
                          <button key={`sng-${i}`} onClick={() => open({ id: toItemId(String(s.trackId), 'song'), title: s.trackName, artist: s.artistName ?? '', artwork: art, type: 'song' })}
                            className="music-song-row"
                            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', borderRadius: 12, background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s', width: '100%' }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                            <div style={{ width: 44, height: 44, borderRadius: 8, background: '#1c1c1e', flexShrink: 0, overflow: 'hidden', position: 'relative' }}>
                              {art && <Image src={art} alt={s.trackName} fill style={{ objectFit: 'cover' }} unoptimized sizes="44px" />}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: 14, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.trackName}</p>
                              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.artistName} · {s.collectionName}</p>
                            </div>
                            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>{s.trackTimeMillis ? `${Math.floor(s.trackTimeMillis / 60000)}:${String(Math.floor((s.trackTimeMillis % 60000) / 1000)).padStart(2, '0')}` : ''}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {searchResults.artists.length === 0 && searchResults.albums.length === 0 && searchResults.songs.length === 0 && (
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)', textAlign: 'center', paddingTop: 40 }}>No results for &ldquo;{query}&rdquo;</p>
                )}
              </div>
            )}
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
              <div className="lyra-grid-responsive music-album-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
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
                  <div className="lyra-grid-responsive music-album-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
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
                    <div className="lyra-grid-responsive music-album-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
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
              <div className="lyra-grid-responsive music-album-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                {mixedAlbums.slice(0, 25).map((a: any, i: number) => (
                  <AlbumTile key={`mix-${i}-${a.id}`} artwork={a.artwork} title={a.title} artist={a.artist} size={tileSize(i)}

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
