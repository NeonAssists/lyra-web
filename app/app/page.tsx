'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ratingColor } from '@/lib/ratingColor';
import RatingModal, { type ModalItem } from '@/components/RatingModal';
import AppShell from '@/components/AppShell';
import { sessionOffset, sessionShuffle } from '@/lib/sessionSeed';

type User = { id: string; handle: string; display_name: string; avatar_url: string | null };
type Filter = 'all' | 'songs' | 'albums';
type SortDir = 'high' | 'low';

function getHiRes(url: string) { return url?.replace('100x100bb', '600x600bb') ?? ''; }
function toItemId(id: string, type: 'song' | 'album') { return type === 'album' ? `itunes:alb:${id}` : `itunes:trk:${id}`; }
function isAlbumId(id: string) { return id?.startsWith('itunes:alb:'); }
function greeting() { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; }

function AlbumArt({ src, size = 44, radius = 8 }: { src: string; size?: number; radius?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: radius, overflow: 'hidden', background: '#1c1c1e', flexShrink: 0, position: 'relative' }}>
      {src
        ? <Image src={src.replace('{w}','100').replace('{h}','100')} alt="" fill style={{ objectFit: 'cover' }} unoptimized sizes={`${size}px`} />
        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3a3a3c', fontSize: size / 3 }}>♪</div>}
    </div>
  );
}

function RatingPill({ rating }: { rating: number }) {
  const col = ratingColor(rating);
  return <div style={{ flexShrink: 0, padding: '3px 9px', borderRadius: 7, background: col + '1a', border: `1px solid ${col}30`, color: col, fontSize: 12, fontWeight: 900 }}>{rating.toFixed(1)}</div>;
}

function ListRow({ item, rank, onClick }: { item: any; rank?: number; onClick: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '8px 16px', background: hov ? 'rgba(255,255,255,0.04)' : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s' }}>
      {rank != null && <span style={{ width: 22, textAlign: 'right', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.2)', flexShrink: 0 }}>{rank}</span>}
      <AlbumArt src={item.artwork_url || item.artwork || ''} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 1 }}>{item.title}</p>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.artist}</p>
      </div>
      {item.rating > 0 && <RatingPill rating={item.rating} />}
    </button>
  );
}

// Spotify-style compact shortcut card
function ShortcutCard({ artwork, title, onClick }: { artwork: string; title: string; onClick: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 0, borderRadius: 6, overflow: 'hidden', background: hov ? '#333' : '#282828', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s', height: 54, width: '100%' }}>
      <div style={{ width: 54, height: 54, flexShrink: 0, position: 'relative', background: '#1c1c1e' }}>
        {artwork ? <Image src={artwork} alt="" fill style={{ objectFit: 'cover' }} unoptimized sizes="54px" /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555' }}>♪</div>}
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', padding: '0 14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{title}</span>
    </button>
  );
}

// Boxed section container
function Box({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden', ...style }}>
      {children}
    </div>
  );
}

function BoxHeader({ label, title, href, sort, onSort }: { label?: string; title: string; href?: string; sort?: SortDir; onSort?: (d: SortDir) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <div>
        {label && <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 3 }}>{label}</p>}
        <h2 style={{ fontSize: 16, fontWeight: 800, color: '#fff', letterSpacing: '-0.2px', margin: 0 }}>{title}</h2>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {sort && onSort && (
          <div style={{ display: 'flex', gap: 4, background: '#1a1a1a', borderRadius: 8, padding: 3 }}>
            {(['high', 'low'] as SortDir[]).map(d => (
              <button key={d} onClick={() => onSort(d)}
                style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'all 0.15s', background: sort === d ? '#6C63FF' : 'transparent', color: sort === d ? '#fff' : 'rgba(255,255,255,0.4)', textTransform: 'capitalize' }}>
                {d === 'high' ? '↑ High' : '↓ Low'}
              </button>
            ))}
          </div>
        )}
        {href && <Link href={href} style={{ fontSize: 11, fontWeight: 700, color: '#6C63FF', textDecoration: 'none', letterSpacing: 0.5 }}>See all →</Link>}
      </div>
    </div>
  );
}

// Browse grid card
function GridCard({ artwork, title, artist, rank, rating, onClick }: { artwork: string; title: string; artist: string; rank?: number; rating?: number; onClick: () => void }) {
  const [hov, setHov] = useState(false);
  const col = rating ? ratingColor(rating) : null;
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: hov ? '#1c1c1e' : 'transparent', border: 'none', cursor: 'pointer', padding: 10, borderRadius: 12, textAlign: 'left', transition: 'background 0.15s', width: '100%' }}>
      <div style={{ position: 'relative', width: '100%', aspectRatio: '1', borderRadius: 8, overflow: 'hidden', background: '#1c1c1e', marginBottom: 8 }}>
        {artwork ? <Image src={artwork} alt={title} fill style={{ objectFit: 'cover' }} unoptimized sizes="180px" /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3a3a3c', fontSize: 22 }}>♪</div>}
        {rank != null && <div style={{ position: 'absolute', top: 6, left: 6, background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 5 }}>#{rank}</div>}
        {col && <div style={{ position: 'absolute', top: 6, right: 6, background: col, color: '#fff', fontSize: 10, fontWeight: 900, padding: '2px 6px', borderRadius: 5 }}>{rating!.toFixed(1)}</div>}
      </div>
      <p style={{ fontSize: 12, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>{title}</p>
      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{artist}</p>
    </button>
  );
}

export default function AppHome() {
  const [me, setMe] = useState<User | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [topSongs, setTopSongs] = useState<any[]>([]);
  const [newAlbums, setNewAlbums] = useState<any[]>([]);
  const [newSongs, setNewSongs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [communityPicks, setCommunityPicks] = useState<any[]>([]);
  const [friendsPicks, setFriendsPicks] = useState<any[]>([]);
  const [hotRange, setHotRange] = useState<any[]>([]);
  const [hotSort, setHotSort] = useState<SortDir>('high');
  const [communitySort, setCommunitySort] = useState<SortDir>('high');
  const [friendsSort, setFriendsSort] = useState<SortDir>('high');
  const [modalItem, setModalItem] = useState<ModalItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const open = (item: ModalItem) => { setModalItem(item); setModalOpen(true); };

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        const { data: p } = await supabase.from('profiles').select('id, handle, display_name, avatar_url').eq('id', data.user.id).single();
        setMe(p as User);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (ev, session) => {
      if (session?.user) {
        const { data: p } = await supabase.from('profiles').select('id, handle, display_name, avatar_url').eq('id', session.user.id).single();
        setMe(p as User);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!me) return;
    (supabase as any).from('user_rankings').select('item_id, title, artist, artwork_url, rating')
      .eq('user_id', me.id).gt('rating', 0).not('title', 'is', null)
      .order('rating', { ascending: false }).limit(30)
      .then(({ data }: any) => { if (data) setHotRange(data); });
  }, [me]);

  useEffect(() => {
    (supabase as any).from('user_rankings').select('item_id, title, artist, artwork_url, rating, user_id')
      .gte('rating', 7).not('title', 'is', null).order('rating', { ascending: false }).limit(40)
      .then(({ data }: any) => {
        if (!data) return;
        const seen = new Set<string>();
        const deduped = data.filter((i: any) => { const k = `${i.user_id}_${i.item_id}`; if (seen.has(k)) return false; seen.add(k); return true; });
        setCommunityPicks(sessionShuffle(deduped, 'community_picks'));
      });
  }, []);

  useEffect(() => {
    if (!me) return;
    (supabase as any).from('follows').select('followee_id').eq('follower_id', me.id)
      .then(async ({ data: follows }: any) => {
        if (!follows?.length) return;
        const ids = follows.map((f: any) => f.followee_id);
        const { data } = await (supabase as any).from('user_rankings').select('item_id, title, artist, artwork_url, rating, user_id')
          .in('user_id', ids).gte('rating', 7).not('title', 'is', null).order('rating', { ascending: false }).limit(20);
        if (data) setFriendsPicks(data);
      });
  }, [me]);

  useEffect(() => {
    const map = (e: any) => ({ id: e.id?.attributes?.['im:id'] ?? '', title: e['im:name']?.label ?? '', artist: e['im:artist']?.label ?? '', artwork: getHiRes(e['im:image']?.[2]?.label ?? '') });
    Promise.all([
      fetch('https://itunes.apple.com/us/rss/topsongs/limit=50/json').then(r => r.json()),
      fetch('https://itunes.apple.com/us/rss/topalbums/limit=25/json').then(r => r.json()),
      fetch('https://itunes.apple.com/us/rss/newmusic/limit=25/json').then(r => r.json()),
    ]).then(([songs, albums, newmus]) => {
      const allSongs = (songs?.feed?.entry ?? []).map(map);
      const allAlbums = (albums?.feed?.entry ?? []).map(map);
      const allNewMus = (newmus?.feed?.entry ?? []).map(map);
      // Top 50 always stays ordered — charts are charts
      setTopSongs(allSongs);
      // New Albums: pick 10 from pool at a session-stable offset (fallback = first 10)
      const albumOffset = allAlbums.length > 10 ? sessionOffset('home_albums', allAlbums.length, 10) : 0;
      const albumSlice = allAlbums.slice(albumOffset, albumOffset + 10);
      setNewAlbums(albumSlice.length >= 5 ? albumSlice : allAlbums.slice(0, 10));
      // New Music: shuffle per session, fallback = original order
      const shuffled = allNewMus.length > 0 ? sessionShuffle(allNewMus, 'home_newmusic') : allNewMus;
      setNewSongs(shuffled.slice(0, 10));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      const r = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song,album&limit=40`);
      const d = await r.json();
      setResults(d?.results ?? []);
      setSearching(false);
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  const sortFn = (dir: SortDir) => (a: any, b: any) => dir === 'high' ? b.rating - a.rating : a.rating - b.rating;
  const sortedHot = [...hotRange].sort(sortFn(hotSort));
  const sortedCommunity = [...communityPicks].sort(sortFn(communitySort));
  const sortedFriends = [...friendsPicks].sort(sortFn(friendsSort));

  return (
    <AppShell>
      <div style={{ padding: '28px 28px 80px', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff', letterSpacing: '-0.3px', margin: 0 }}>
            {me ? `${greeting()}, ${me.display_name || me.handle}` : 'Home'}
          </h1>
          <div style={{ position: 'relative', width: 280 }}>
            <svg style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.35, pointerEvents: 'none' }} width="14" height="14" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search…"
              style={{ width: '100%', background: '#2a2a2a', border: '1px solid transparent', borderRadius: 100, padding: '9px 38px', fontSize: 14, color: '#fff', outline: 'none', boxSizing: 'border-box' }} />
            {query && <button onClick={() => setQuery('')} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>}
          </div>
        </div>

        {/* Filter chips */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
          {(['all', 'songs', 'albums'] as Filter[]).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: '6px 16px', borderRadius: 100, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.15s', background: filter === f ? '#fff' : '#2a2a2a', color: filter === f ? '#000' : '#fff', textTransform: 'capitalize' }}>
              {f}
            </button>
          ))}
        </div>

        {query ? (
          // Search view
          <Box>
            <BoxHeader title={`Results for "${query}"`} />
            <div style={{ padding: '8px 0' }}>
              {results.map((r: any, i: number) => {
                const isAlbum = r.wrapperType === 'collection' || !r.trackId;
                const id = String(r.trackId ?? r.collectionId ?? '');
                const title = r.trackName ?? r.collectionName ?? '';
                const art = getHiRes(r.artworkUrl100 ?? '');
                return <ListRow key={`sr-${i}`} item={{ title, artist: r.artistName ?? '', artwork_url: art, rating: 0 }}
                  onClick={() => open({ id: toItemId(id, isAlbum ? 'album' : 'song'), title, artist: r.artistName ?? '', artwork: art, type: isAlbum ? 'album' : 'song' })} />;
              })}
              {!searching && results.length === 0 && <p style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '40px 0' }}>No results</p>}
            </div>
          </Box>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Your Style shortcut row */}
            {hotRange.length > 0 && filter !== 'albums' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 2 }}>Quick Access</p>
                    <h2 style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: 0 }}>Your Style</h2>
                  </div>
                  <a href="/ranked" style={{ fontSize: 11, fontWeight: 700, color: '#6C63FF', textDecoration: 'none', letterSpacing: 0.5 }}>See all →</a>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {hotRange.slice(0, 8).map((item: any, i: number) => (
                    <ShortcutCard key={`sc-${i}`} artwork={item.artwork_url ?? ''} title={item.title}
                      onClick={() => open({ id: item.item_id, title: item.title, artist: item.artist, artwork: item.artwork_url ?? '', type: isAlbumId(item.item_id) ? 'album' : 'song' })} />
                  ))}
                </div>
              </div>
            )}

            {/* Row 1: Your Rankings (wide) + Community Picks */}
            {(filter === 'all' || filter === 'songs') && (
              <div style={{ display: 'grid', gridTemplateColumns: hotRange.length > 0 ? '1fr 1fr' : '1fr', gap: 16 }}>
                {hotRange.length > 0 && (
                  <Box>
                    <BoxHeader label="Your Taste" title="Your Rankings" sort={hotSort} onSort={setHotSort} href="/ranked" />
                    <div style={{ padding: '8px 0' }}>
                      {sortedHot.slice(0, 10).map((item: any, i: number) => (
                        <ListRow key={`hr-${i}`} item={item} rank={i + 1}
                          onClick={() => open({ id: item.item_id, title: item.title, artist: item.artist, artwork: item.artwork_url ?? '', type: isAlbumId(item.item_id) ? 'album' : 'song' })} />
                      ))}
                    </div>
                  </Box>
                )}
                <Box>
                  <BoxHeader label="Community" title="Community Picks" sort={communitySort} onSort={setCommunitySort} href="/community-picks" />
                  <div style={{ padding: '8px 0' }}>
                    {sortedCommunity.slice(0, 10).map((item: any, i: number) => (
                      <ListRow key={`cp-${i}`} item={item} rank={i + 1}
                        onClick={() => open({ id: item.item_id, title: item.title, artist: item.artist, artwork: item.artwork_url ?? '', type: isAlbumId(item.item_id) ? 'album' : 'song' })} />
                    ))}
                    {sortedCommunity.length === 0 && <p style={{ color: 'rgba(255,255,255,0.2)', textAlign: 'center', padding: '24px 0', fontSize: 12 }}>No picks yet</p>}
                  </div>
                </Box>
              </div>
            )}

            {/* Row 2: New Albums (wide grid) + Friends' Picks */}
            <div style={{ display: 'grid', gridTemplateColumns: filter === 'all' ? '1.5fr 1fr' : '1fr', gap: 16 }}>
              {(filter === 'all' || filter === 'albums') && (
                <Box>
                  <BoxHeader label="Browse" title="New Albums" href="/new-albums" />
                  <div style={{ padding: 12, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4 }}>
                    {loading ? [...Array(10)].map((_, i) => <div key={i} style={{ aspectRatio: '1', background: '#1c1c1e', borderRadius: 8 }} />)
                      : newAlbums.slice(0, 10).map((a: any, i: number) => (
                          <GridCard key={`na-${i}`} artwork={a.artwork} title={a.title} artist={a.artist}
                            onClick={() => open({ id: toItemId(a.id, 'album'), title: a.title, artist: a.artist, artwork: a.artwork, type: 'album' })} />
                        ))}
                  </div>
                </Box>
              )}
              {(filter === 'all' || filter === 'songs') && (
                <Box>
                  <BoxHeader label="Social" title="Friends' Picks" sort={friendsSort} onSort={setFriendsSort} href="/friends-picks" />
                  <div style={{ padding: '8px 0' }}>
                    {sortedFriends.slice(0, 10).map((item: any, i: number) => (
                      <ListRow key={`fp-${i}`} item={item} rank={i + 1}
                        onClick={() => open({ id: item.item_id, title: item.title, artist: item.artist, artwork: item.artwork_url ?? '', type: isAlbumId(item.item_id) ? 'album' : 'song' })} />
                    ))}
                    {sortedFriends.length === 0 && <p style={{ color: 'rgba(255,255,255,0.2)', textAlign: 'center', padding: '24px 0', fontSize: 12 }}>Follow people to see their picks</p>}
                  </div>
                </Box>
              )}
            </div>

            {/* Row 3: New Music grid + Top 50 list */}
            {(filter === 'all' || filter === 'songs') && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Box>
                  <BoxHeader label="Just Released" title="New Music" href="/new-music" />
                  <div style={{ padding: 12, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4 }}>
                    {loading ? [...Array(10)].map((_, i) => <div key={i} style={{ aspectRatio: '1', background: '#1c1c1e', borderRadius: 8 }} />)
                      : newSongs.slice(0, 10).map((s: any, i: number) => (
                          <GridCard key={`nm-${i}`} artwork={s.artwork} title={s.title} artist={s.artist}
                            onClick={() => open({ id: toItemId(s.id, 'song'), title: s.title, artist: s.artist, artwork: s.artwork, type: 'song' })} />
                        ))}
                  </div>
                </Box>
                <Box>
                  <BoxHeader label="Charts" title="Top 50 US 🇺🇸" href="/top50" />
                  <div style={{ padding: '8px 0' }}>
                    {topSongs.slice(0, 10).map((s: any, i: number) => (
                      <ListRow key={`ts-${i}`} item={{ title: s.title, artist: s.artist, artwork_url: s.artwork, rating: 0 }} rank={i + 1}
                        onClick={() => open({ id: toItemId(s.id, 'song'), title: s.title, artist: s.artist, artwork: s.artwork, type: 'song' })} />
                    ))}
                  </div>
                </Box>
              </div>
            )}

          </div>
        )}
      </div>

      <RatingModal open={modalOpen} onClose={() => setModalOpen(false)} item={modalItem} userId={me?.id ?? null} />
    </AppShell>
  );
}
