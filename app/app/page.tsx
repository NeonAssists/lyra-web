'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ratingColor } from '@/lib/ratingColor';
import RatingModal, { type ModalItem } from '@/components/RatingModal';
import AppShell from '@/components/AppShell';
import { sessionOffset, sessionShuffle } from '@/lib/sessionSeed';
import SeeAllCard from '@/components/SeeAllCard';
import { getCurrentWorldMusicWeek } from '@/lib/worldMusicSchedule';

type User = { id: string; handle: string; display_name: string; avatar_url: string | null };
type SortDir = 'high' | 'low';

function getHiRes(url: string) { return url?.replace('100x100bb', '600x600bb') ?? ''; }
function toItemId(id: string, type: 'song' | 'album') { return type === 'album' ? `itunes:alb:${id}` : `itunes:trk:${id}`; }
function isAlbumId(id: string) { return id?.startsWith('itunes:alb:'); }
function greeting() { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; }

/* ── Shared UI Components ── */

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
  return <div style={{ flexShrink: 0, padding: '3px 9px', borderRadius: 7, background: col + '1a', border: `1px solid ${col}30`, color: col, fontSize: 12, fontWeight: 900 }}>{(rating ?? 0).toFixed(1)}</div>;
}

function ListRow({ item, rank, onClick, compact }: { item: any; rank?: number; onClick: () => void; compact?: boolean }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: 'flex', alignItems: 'center', gap: compact ? 10 : 12, width: '100%', padding: compact ? '5px 14px' : '8px 16px', background: hov ? 'rgba(255,255,255,0.04)' : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s' }}>
      {rank != null && <span style={{ width: 20, textAlign: 'right', fontSize: 11, fontWeight: 700, color: rank <= 3 ? '#6C63FF' : 'rgba(255,255,255,0.2)', flexShrink: 0 }}>{rank}</span>}
      <AlbumArt src={item.artwork_url || item.artwork || ''} size={compact ? 36 : 44} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: compact ? 12 : 13, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 1 }}>{item.title}</p>
        <p style={{ fontSize: compact ? 10 : 11, color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.artist}</p>
      </div>
      {item.rating > 0 && <RatingPill rating={item.rating} />}
    </button>
  );
}

function GridCard({ artwork, title, artist, rank, rating, onClick }: { artwork: string; title: string; artist: string; rank?: number; rating?: number; onClick: () => void }) {
  const [hov, setHov] = useState(false);
  const col = rating ? ratingColor(rating) : null;
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, borderRadius: 12, textAlign: 'left', transition: 'opacity 0.15s', opacity: hov ? 0.75 : 1, width: '100%' }}>
      <div style={{ position: 'relative', width: '100%', aspectRatio: '1', borderRadius: 8, overflow: 'hidden', background: '#1c1c1e', marginBottom: 6 }}>
        {artwork ? <Image src={artwork} alt={title} fill style={{ objectFit: 'cover' }} unoptimized sizes="160px" /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3a3a3c', fontSize: 22 }}>♪</div>}
        {rank != null && <div style={{ position: 'absolute', top: 5, left: 5, background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: 9, fontWeight: 800, padding: '2px 5px', borderRadius: 4 }}>#{rank}</div>}
        {col && <div style={{ position: 'absolute', top: 5, right: 5, background: col, color: '#fff', fontSize: 9, fontWeight: 900, padding: '2px 5px', borderRadius: 4 }}>{rating!.toFixed(1)}</div>}
      </div>
      <p style={{ fontSize: 11, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 1 }}>{title}</p>
      <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{artist}</p>
    </button>
  );
}

function Box({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: '#000', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column', ...style }}>{children}</div>;
}

function BoxHeader({ label, title, href, sort, onSort, extra }: { label?: string; title: string; href?: string; sort?: SortDir; onSort?: (d: SortDir) => void; extra?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px 10px', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
      <div>
        {label && <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 2 }}>{label}</p>}
        <h2 style={{ fontSize: 15, fontWeight: 800, color: '#fff', letterSpacing: '-0.2px', margin: 0 }}>{title}</h2>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {extra}
        {sort && onSort && (
          <div style={{ display: 'flex', gap: 3, background: '#1a1a1a', borderRadius: 7, padding: 2 }}>
            {(['high', 'low'] as SortDir[]).map(d => (
              <button key={d} onClick={() => onSort(d)}
                style={{ padding: '3px 8px', borderRadius: 5, fontSize: 10, fontWeight: 700, border: 'none', cursor: 'pointer', background: sort === d ? '#6C63FF' : 'transparent', color: sort === d ? '#fff' : 'rgba(255,255,255,0.35)' }}>
                {d === 'high' ? '↑High' : '↓Low'}
              </button>
            ))}
          </div>
        )}
        {href && <Link href={href} style={{ fontSize: 10, fontWeight: 700, color: '#6C63FF', textDecoration: 'none', letterSpacing: 0.5 }}>See all →</Link>}
      </div>
    </div>
  );
}

function EmptyState({ icon, text, cta, href }: { icon: string; text: string; cta?: string; href?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 16px', flex: 1 }}>
      <span style={{ fontSize: 28, marginBottom: 8 }}>{icon}</span>
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', textAlign: 'center', marginBottom: cta ? 12 : 0 }}>{text}</p>
      {cta && href && <a href={href} style={{ padding: '8px 20px', borderRadius: 100, background: '#6C63FF', color: '#fff', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>{cta}</a>}
    </div>
  );
}

/* ── Main Component ── */

export default function AppHome() {
  const [me, setMe] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [topSongs, setTopSongs] = useState<any[]>([]);
  const [newAlbums, setNewAlbums] = useState<any[]>([]);
  const [newSongs, setNewSongs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalSongs, setGlobalSongs] = useState<any[]>([]);
  const [worldSongs, setWorldSongs] = useState<any[]>([]);
  const worldWeek = getCurrentWorldMusicWeek();
  const [chartTab, setChartTab] = useState<'us' | 'global'>('us');
  const [communityPicks, setCommunityPicks] = useState<any[]>([]);
  const [friendsPicks, setFriendsPicks] = useState<any[]>([]);
  const [hotRange, setHotRange] = useState<any[]>([]);
  const [hotSort, setHotSort] = useState<SortDir>('high');
  const [communitySort, setCommunitySort] = useState<SortDir>('high');
  const [friendsSort, setFriendsSort] = useState<SortDir>('high');
  const [modalItem, setModalItem] = useState<ModalItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const open = (item: ModalItem) => { setModalItem(item); setModalOpen(true); };

  // Welcome modal
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeSongs, setWelcomeSongs] = useState<{id:string;title:string;artist:string;artwork:string}[]>([]);
  const [selectedInWelcome, setSelectedInWelcome] = useState<Set<string>>(new Set());
  const [welcomeRatings, setWelcomeRatings] = useState<Record<string,number>>({});
  const [welcomeRatingTarget, setWelcomeRatingTarget] = useState<string|null>(null);
  const [welcomeStep, setWelcomeStep] = useState<1|2>(1);

  // Community hot (Change 4)
  const [communityHot, setCommunityHot] = useState<{ item_id: string; title: string; artist: string; artwork_url: string; rating: number }[]>([]);

  // Auth
  useEffect(() => {
    const loadProfile = async (uid: string) => {
      const { data: p } = await supabase.from('profiles').select('id, handle, display_name, avatar_url').eq('id', uid).single();
      setMe(p as User);
    };
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (ev, session) => {
      setAuthReady(true);
      if (session?.user) loadProfile(session.user.id);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Welcome modal trigger + fetch popular albums
  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('lyra_welcomed_v2') && me) {
      setShowWelcome(true);
      setWelcomeStep(1);
      fetch('https://itunes.apple.com/us/rss/topalbums/limit=30/json')
        .then(r => r.json())
        .then(data => {
          const entries = (data?.feed?.entry ?? []).map((e: any, i: number) => ({
            id: `itunes:alb:${e.id?.attributes?.['im:id'] ?? i}`,
            title: e['im:name']?.label ?? '',
            artist: e['im:artist']?.label ?? '',
            artwork: (e['im:image']?.[2]?.label ?? '').replace('170x170bb', '400x400bb'),
          }));
          setWelcomeSongs(entries.slice(0, 24));
        })
        .catch(() => {});
    }
  }, [me]);

  const saveAllWelcomeRatings = useCallback(async () => {
    if (!me) return;
    const entries = Object.entries(welcomeRatings);
    for (const [itemId, rating] of entries) {
      const song = welcomeSongs.find(s => s.id === itemId);
      if (!song) continue;
      await (supabase as any).from('user_rankings').upsert({
        user_id: me.id, item_id: song.id, title: song.title, artist: song.artist, artwork_url: song.artwork, rating, ranked_at: new Date().toISOString(),
      }, { onConflict: 'user_id,item_id' });
    }
  }, [me, welcomeRatings, welcomeSongs]);

  // User data + community hot
  useEffect(() => {
    if (!me) return;
    (supabase as any).from('user_rankings').select('item_id, title, artist, artwork_url, rating')
      .eq('user_id', me.id).gt('rating', 0).not('title', 'is', null)
      .order('rating', { ascending: false }).limit(30)
      .then(({ data }: any) => { if (data) setHotRange(data); });
    (supabase as any).from('user_rankings').select('item_id,title,artist,artwork_url,rating')
      .gte('rating', 8.5).order('ranked_at', { ascending: false }).limit(12)
      .then(({ data }: any) => {
        const seen = new Set<string>();
        setCommunityHot((data ?? []).filter((r: any) => { if (seen.has(r.item_id)) return false; seen.add(r.item_id); return true; }));
      });
  }, [me]);

  // Community picks
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

  // Friends picks
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

  // iTunes feeds
  useEffect(() => {
    const map = (e: any) => ({ id: e.id?.attributes?.['im:id'] ?? '', title: e['im:name']?.label ?? '', artist: e['im:artist']?.label ?? '', artwork: getHiRes(e['im:image']?.[2]?.label ?? '') });
    const safeFetch = (url: string) => fetch(url).then(r => { if (!r.ok) return { feed: { entry: [] } }; return r.json(); }).catch(() => ({ feed: { entry: [] } }));
    Promise.all([
      safeFetch('https://itunes.apple.com/us/rss/topsongs/limit=50/json'),
      safeFetch('https://itunes.apple.com/us/rss/topalbums/limit=25/json'),
      safeFetch('https://itunes.apple.com/us/rss/topsongs/limit=25/json'),
      safeFetch('https://itunes.apple.com/gb/rss/topsongs/limit=50/json'),
    ]).then(([songs, albums, newmus, globalSongsData]) => {
      setTopSongs((songs?.feed?.entry ?? []).map(map));
      const allAlbums = (albums?.feed?.entry ?? []).map(map);
      const albumOffset = allAlbums.length > 10 ? sessionOffset('home_albums', allAlbums.length, 10) : 0;
      const albumSlice = allAlbums.slice(albumOffset, albumOffset + 10);
      setNewAlbums(albumSlice.length >= 5 ? albumSlice : allAlbums.slice(0, 10));
      const allNewMus = (newmus?.feed?.entry ?? []).map(map);
      setNewSongs(sessionShuffle(allNewMus, 'home_newmusic').slice(0, 12));
      setGlobalSongs((globalSongsData?.feed?.entry ?? []).map(map));
      if (worldWeek.manualTracks?.length) {
        setWorldSongs(worldWeek.manualTracks.map(t => ({ id: t.id.replace('itunes:trk:', ''), title: t.title, artist: t.artist, artwork: t.artwork })));
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Search
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
  const isLoggedIn = !!me;

  return (
    <AppShell>
      <style>{`
        .dash-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .dash-tri { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
        .dash-quad { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 12px; }
        .album-grid-sm { display: grid; grid-template-columns: repeat(4, 1fr); gap: 2px; }
        @media (max-width: 900px) {
          .dash-grid { grid-template-columns: 1fr !important; }
          .dash-tri { grid-template-columns: 1fr !important; }
          .dash-quad { grid-template-columns: repeat(2, 1fr) !important; }
          .album-grid-sm { grid-template-columns: repeat(2, 1fr) !important; }
          .dash-grid-asymmetric { grid-template-columns: 1fr !important; }
          .home-wrap { padding: 16px 12px 80px !important; }
          .home-header { flex-direction: column; gap: 12px; align-items: stretch !important; }
          .home-search { width: 100% !important; }
        }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.6; } }
      `}</style>
      <div className="home-wrap" style={{ padding: '24px 24px 80px', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}>

        {/* ── Header ── */}
        <div className="home-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.3px', margin: 0 }}>
            {me ? `${greeting()}, ${me.display_name || me.handle}` : 'Home'}
          </h1>
          <div className="home-search" style={{ position: 'relative', width: 260 }}>
            <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.35, pointerEvents: 'none' }} width="13" height="13" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search songs, albums, artists…"
              style={{ width: '100%', background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 100, padding: '8px 34px', fontSize: 13, color: '#fff', outline: 'none', boxSizing: 'border-box' }} />
            {query && <button onClick={() => setQuery('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>×</button>}
          </div>
        </div>

        {/* Guest welcome banner — only show after auth is confirmed */}
        {authReady && !isLoggedIn && !query && (
          <div style={{ marginBottom: 20, padding: '20px', borderRadius: 18, background: 'linear-gradient(135deg, rgba(108,99,255,0.18) 0%, rgba(108,99,255,0.06) 100%)', border: '1px solid rgba(108,99,255,0.2)' }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: '#6C63FF', marginBottom: 8 }}>Welcome to Lyra</p>
            <p style={{ fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '-0.3px', marginBottom: 6 }}>Rate music. Build your taste.</p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5, marginBottom: 16 }}>Decimal ratings from 1.0–10.0. Real opinions. No algorithm.</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <a href="/login" style={{ padding: '9px 20px', borderRadius: 100, background: '#6C63FF', color: '#fff', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>Sign Up Free</a>
              <a href="/music" style={{ padding: '9px 20px', borderRadius: 100, background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.7)', fontWeight: 600, fontSize: 13, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.1)' }}>Explore</a>
            </div>
          </div>
        )}

        {query ? (
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* ═══ QUADRANT 1: Social + Personal (above the fold) ═══ */}
            <div className="dash-grid" style={{ minHeight: 420 }}>
              {/* Left: Friends' Picks or Sign In prompt */}
              <Box style={{ flex: 1 }}>
                {isLoggedIn ? (
                  <>
                    <BoxHeader label="Social" title="Friends' Picks" sort={friendsSort} onSort={setFriendsSort} href="/friends-picks" />
                    <div style={{ padding: '4px 0', flex: 1, overflowY: 'auto' }}>
                      {sortedFriends.length > 0 ? sortedFriends.slice(0, 12).map((item: any, i: number) => (
                        <ListRow key={`fp-${i}`} item={item} rank={i + 1} compact
                          onClick={() => open({ id: item.item_id, title: item.title, artist: item.artist, artwork: item.artwork_url ?? '', type: isAlbumId(item.item_id) ? 'album' : 'song' })} />
                      )) : <EmptyState icon="👥" text="Follow people to see what they're rating" cta="Find People" href="/social" />}
                    </div>
                  </>
                ) : (
                  <>
                    <BoxHeader label="Discover" title="🇺🇸 Trending Now" href="/charts" />
                    <div style={{ padding: '4px 0', flex: 1 }}>
                      {topSongs.slice(0, 12).map((s: any, i: number) => (
                        <ListRow key={`tr-${i}-${s.id}`} item={{ title: s.title, artist: s.artist, artwork_url: s.artwork, rating: 0 }} rank={i + 1} compact
                          onClick={() => open({ id: toItemId(s.id, 'song'), title: s.title, artist: s.artist, artwork: s.artwork, type: 'song' })} />
                      ))}
                    </div>
                    <div style={{ padding: '8px 18px 12px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                      <a href="/login" style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', textDecoration: 'none' }}>🔒 Sign in to see what your friends are rating</a>
                    </div>
                  </>
                )}
              </Box>

              {/* Right: Your Rankings or Global Charts for guests */}
              <Box style={{ flex: 1 }}>
                {isLoggedIn ? (
                  <>
                    <BoxHeader label="Your Taste" title="Your Rankings" sort={hotSort} onSort={setHotSort} href="/ranked" />
                    <div style={{ padding: '4px 0', flex: 1, overflowY: 'auto' }}>
                      {sortedHot.length > 0 ? sortedHot.slice(0, 12).map((item: any, i: number) => (
                        <ListRow key={`hr-${i}`} item={item} rank={i + 1} compact
                          onClick={() => open({ id: item.item_id, title: item.title, artist: item.artist, artwork: item.artwork_url ?? '', type: isAlbumId(item.item_id) ? 'album' : 'song' })} />
                      )) : (
                        <>
                          <EmptyState icon="⭐" text="Rate songs and albums to build your rankings" cta="Start Rating" href="/charts" />
                          {communityHot.length > 0 && (
                            <div style={{ padding: '0 8px 8px' }}>
                              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 8, paddingLeft: 8 }}>Community&apos;s Best This Week</p>
                              {communityHot.slice(0, 6).map((item: any, i: number) => (
                                <ListRow key={`ch-${i}-${item.item_id}`} item={item} compact
                                  onClick={() => open({ id: item.item_id, title: item.title, artist: item.artist, artwork: item.artwork_url ?? '', type: isAlbumId(item.item_id) ? 'album' : 'song' })} />
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <BoxHeader label="Charts" title="🌍 Global Top Songs" href="/charts" />
                    <div style={{ padding: '4px 0', flex: 1 }}>
                      {globalSongs.slice(0, 12).map((s: any, i: number) => (
                        <ListRow key={`gg-${i}-${s.id}`} item={{ title: s.title, artist: s.artist, artwork_url: s.artwork, rating: 0 }} rank={i + 1} compact
                          onClick={() => open({ id: toItemId(s.id, 'song'), title: s.title, artist: s.artist, artwork: s.artwork, type: 'song' })} />
                      ))}
                    </div>
                    <div style={{ padding: '8px 18px 12px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                      <a href="/login" style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', textDecoration: 'none' }}>🔒 Sign in to see your personal rankings</a>
                    </div>
                  </>
                )}
              </Box>
            </div>

            {/* ═══ QUADRANT 2: Community + World Music Week ═══ */}
            <div className="dash-grid">
              {/* Left: Community Picks (for logged-in) or Global Charts (guests) */}
              <Box>
                {isLoggedIn ? (
                  <>
                    <BoxHeader label="Community" title="Community Picks" sort={communitySort} onSort={setCommunitySort} href="/community-picks" />
                    <div style={{ padding: '4px 0' }}>
                      {sortedCommunity.slice(0, 8).map((item: any, i: number) => (
                        <ListRow key={`cp2-${i}`} item={item} rank={i + 1} compact
                          onClick={() => open({ id: item.item_id, title: item.title, artist: item.artist, artwork: item.artwork_url ?? '', type: isAlbumId(item.item_id) ? 'album' : 'song' })} />
                      ))}
                      {sortedCommunity.length === 0 && <EmptyState icon="🎤" text="No community picks yet" />}
                    </div>
                  </>
                ) : (
                  <>
                    <BoxHeader label="Community" title="Top Rated" sort={communitySort} onSort={setCommunitySort} href="/community-picks" />
                    <div style={{ padding: '4px 0' }}>
                      {sortedCommunity.slice(0, 8).map((item: any, i: number) => (
                        <ListRow key={`cpg-${i}`} item={item} rank={i + 1} compact
                          onClick={() => open({ id: item.item_id, title: item.title, artist: item.artist, artwork: item.artwork_url ?? '', type: isAlbumId(item.item_id) ? 'album' : 'song' })} />
                      ))}
                    </div>
                  </>
                )}
              </Box>

              {/* Right: World Music Week */}
              {worldSongs.length > 0 && (
                <Box>
                  <BoxHeader label="World Music Week" title={`${worldWeek.flag} ${worldWeek.region}`} href="/world-music" />
                  <p style={{ padding: '2px 18px 8px', fontSize: 11, color: 'rgba(255,255,255,0.3)', lineHeight: 1.4, margin: 0 }}>{worldWeek.description}</p>
                  <div style={{ padding: '0 0 4px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                    {worldSongs.slice(0, 8).map((s: any, i: number) => (
                      <ListRow key={`wms-${i}-${s.id}`} item={{ title: s.title, artist: s.artist, artwork_url: s.artwork, rating: 0 }} rank={i + 1} compact
                        onClick={() => open({ id: s.id.includes('itunes:') ? s.id : toItemId(s.id, 'song'), title: s.title, artist: s.artist, artwork: s.artwork, type: 'song' })} />
                    ))}
                  </div>
                </Box>
              )}
            </div>

            {/* ═══ ROW 3: New Albums (visual grid) ═══ */}
            <Box>
              <BoxHeader label="Browse" title="New Albums" href="/new-albums" />
              <div className="album-grid-sm" style={{ padding: 0 }}>
                {loading
                  ? [...Array(8)].map((_, i) => <div key={`na-sk-${i}`} style={{ aspectRatio: '1', background: '#1c1c1e', borderRadius: 8 }} />)
                  : <>
                      {newAlbums.slice(0, 7).map((a: any, i: number) => (
                        <GridCard key={`na-${i}-${a.id}`} artwork={a.artwork} title={a.title} artist={a.artist}
                          onClick={() => open({ id: toItemId(a.id, 'album'), title: a.title, artist: a.artist, artwork: a.artwork, type: 'album' })} />
                      ))}
                      <SeeAllCard artworks={newAlbums.slice(7, 11).map((a: any) => a.artwork)} label="New Albums" href="/new-albums" />
                    </>
                }
              </div>
            </Box>

            {/* ═══ ROW 4: New Music + Tabbed Charts ═══ */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }} className="dash-grid-asymmetric">
              <Box>
                <BoxHeader label="Just Released" title="New Music" href="/new-music" />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {loading ? [...Array(8)].map((_, i) => <div key={`nm-sk-${i}`} style={{ height: 52, margin: '2px 0', background: '#1c1c1e', borderRadius: 8 }} />)
                    : newSongs.slice(0, 10).map((s: any, i: number) => (
                        <ListRow key={`nm-${i}-${s.id}`} item={{ title: s.title, artist: s.artist, artwork_url: s.artwork, rating: 0 }} rank={i + 1} compact
                          onClick={() => open({ id: toItemId(s.id, 'song'), title: s.title, artist: s.artist, artwork: s.artwork, type: 'song' })} />
                      ))}
                </div>
              </Box>
              <Box>
                <BoxHeader label="Charts" title="Top Songs" href="/charts"
                  extra={
                    <div style={{ display: 'flex', gap: 3, background: '#1a1a1a', borderRadius: 7, padding: 2 }}>
                      {(['us', 'global'] as const).map(t => (
                        <button key={t} onClick={() => setChartTab(t)}
                          style={{ padding: '3px 10px', borderRadius: 5, fontSize: 10, fontWeight: 700, border: 'none', cursor: 'pointer', background: chartTab === t ? '#6C63FF' : 'transparent', color: chartTab === t ? '#fff' : 'rgba(255,255,255,0.35)' }}>
                          {t === 'us' ? '🇺🇸 US' : '🌍 Global'}
                        </button>
                      ))}
                    </div>
                  } />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '4px 0' }}>
                  {loading
                    ? [...Array(20)].map((_, i) => <div key={`csk-${i}`} style={{ height: 52, margin: '2px 8px', background: '#1c1c1e', borderRadius: 8 }} />)
                    : (chartTab === 'us' ? topSongs : globalSongs).slice(0, 20).map((s: any, i: number) => (
                        <ListRow key={`ch-${chartTab}-${i}-${s.id}`} item={{ title: s.title, artist: s.artist, artwork_url: s.artwork, rating: 0 }} rank={i + 1} compact
                          onClick={() => open({ id: toItemId(s.id, 'song'), title: s.title, artist: s.artist, artwork: s.artwork, type: 'song' })} />
                      ))}
                </div>
              </Box>
            </div>

            {/* Guest sign-in prompt */}
            {!isLoggedIn && (
              <Box style={{ padding: '32px 24px', textAlign: 'center' as const }}>
                <p style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 6 }}>Rate your music. See your taste.</p>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 20 }}>Sign up to rank songs, follow friends, and discover new music through your network.</p>
                <a href="/login" style={{ display: 'inline-block', padding: '10px 28px', borderRadius: 100, background: '#6C63FF', color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>Sign Up Free</a>
              </Box>
            )}

          </div>
        )}
      </div>

      {/* Welcome Modal */}
      {showWelcome && (() => {
        const scaleTiers = [
          { score: 1, label: 'Skip', color: '#ef4444' },
          { score: 2, label: 'Weak', color: '#f97316' },
          { score: 3, label: 'Meh', color: '#f59e0b' },
          { score: 4, label: 'Below avg', color: '#eab308' },
          { score: 5, label: 'Average', color: '#84cc16' },
          { score: 6, label: 'Decent', color: '#22c55e' },
          { score: 7, label: 'Good', color: '#10b981' },
          { score: 8, label: 'Great', color: '#06b6d4' },
          { score: 9, label: 'Elite', color: '#6366f1' },
          { score: 10, label: 'Masterpiece', color: '#8b5cf6' },
        ];
        const ratedCount = Object.keys(welcomeRatings).length;
        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            {/* Gradient border wrapper */}
            <div style={{ background: 'linear-gradient(135deg, rgba(108,99,255,0.5) 0%, rgba(139,92,246,0.2) 50%, rgba(6,182,212,0.2) 100%)', padding: 1, borderRadius: 28, maxWidth: 520, width: '100%', position: 'relative' }}>
              {/* Purple glow blob */}
              <div style={{ position: 'absolute', top: -80, left: '50%', transform: 'translateX(-50%)', width: 300, height: 200, background: 'radial-gradient(ellipse at center, rgba(108,99,255,0.25) 0%, transparent 70%)', filter: 'blur(40px)', zIndex: -1, pointerEvents: 'none' }} />
              {/* Card */}
              <div style={{ background: 'linear-gradient(135deg, #0f0f0f 0%, #0d0b1a 100%)', borderRadius: 28, width: '100%', position: 'relative' }}>
                {/* Step indicator dots */}
                <div style={{ display: 'flex', gap: 6, justifyContent: 'center', paddingTop: 24, marginBottom: 20 }}>
                  <div style={{ width: welcomeStep === 1 ? 24 : 6, height: 6, borderRadius: 3, background: welcomeStep === 1 ? '#6C63FF' : 'rgba(255,255,255,0.15)', transition: 'width 0.2s' }} />
                  <div style={{ width: welcomeStep === 2 ? 24 : 6, height: 6, borderRadius: 3, background: welcomeStep === 2 ? '#6C63FF' : 'rgba(255,255,255,0.15)', transition: 'width 0.2s' }} />
                </div>

                <div style={{ padding: '0 28px 28px' }}>
                  {welcomeStep === 1 ? (
                    <>
                      {/* Badge */}
                      <div style={{ display: 'inline-block', background: 'rgba(108,99,255,0.15)', border: '1px solid rgba(108,99,255,0.3)', borderRadius: 100, padding: '4px 12px', fontSize: 11, fontWeight: 700, color: '#6C63FF', letterSpacing: 1, textTransform: 'uppercase' as const, marginBottom: 16 }}>How Lyra Works</div>

                      {/* Headline */}
                      <h2 style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: -1, lineHeight: 1.1, marginBottom: 8, margin: 0, marginTop: 0 }}>Rate music on{'\n'}a 1–10 scale.</h2>

                      {/* Subtext */}
                      <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, marginBottom: 24, marginTop: 8 }}>Every decimal matters. A 7.3 hits different than a 7.8. Here&apos;s what the numbers mean:</p>

                      {/* Scale bar chart */}
                      <div style={{ marginBottom: 0 }}>
                        {scaleTiers.map(tier => (
                          <div key={tier.score} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
                            <span style={{ width: 20, fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.5)', textAlign: 'right' as const, flexShrink: 0 }}>{tier.score}</span>
                            <div style={{ flex: 1, height: 8 + (tier.score / 10) * 10, background: 'rgba(255,255,255,0.04)', borderRadius: 4, overflow: 'hidden' }}>
                              <div style={{ width: `${tier.score * 10}%`, height: '100%', background: `linear-gradient(90deg, ${tier.color}cc, ${tier.color}80)`, borderRadius: 4 }} />
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', minWidth: 70 }}>{tier.label}</span>
                          </div>
                        ))}
                      </div>

                      {/* CTA button */}
                      <button onClick={() => setWelcomeStep(2)}
                        style={{ width: '100%', marginTop: 24, padding: 16, borderRadius: 100, background: 'linear-gradient(135deg, #6C63FF, #8b5cf6)', color: '#fff', fontSize: 16, fontWeight: 800, border: 'none', cursor: 'pointer', letterSpacing: -0.3 }}>
                        Got it — let me rate some music →
                      </button>

                      {/* Skip link */}
                      <button onClick={() => { saveAllWelcomeRatings(); setShowWelcome(false); localStorage.setItem('lyra_welcomed_v2', 'true'); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'rgba(255,255,255,0.25)', marginTop: 12, display: 'block', width: '100%', textAlign: 'center' as const }}>
                        Skip
                      </button>
                    </>
                  ) : (
                    <>
                      {/* Back arrow + header row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                        <button onClick={() => setWelcomeStep(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', fontSize: 20, padding: 0, lineHeight: 1 }}>←</button>
                        <h2 style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: -0.5, margin: 0 }}>Rate music you know</h2>
                      </div>

                      {/* Subtext row */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Tap to select, tap again to rate</span>
                        {ratedCount > 0 && (
                          <span style={{ background: 'rgba(108,99,255,0.2)', color: '#6C63FF', borderRadius: 100, padding: '3px 10px', fontSize: 12, fontWeight: 700 }}>{ratedCount} rated</span>
                        )}
                      </div>

                      {/* Album grid */}
                      <div style={{ maxHeight: 320, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(88px, 1fr))', gap: 8 }}>
                        {welcomeSongs.map(song => {
                          const isSelected = selectedInWelcome.has(song.id);
                          const rating = welcomeRatings[song.id];
                          return (
                            <button key={song.id}
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedInWelcome(prev => { const next = new Set(prev); next.delete(song.id); return next; });
                                  setWelcomeRatings(prev => { const next = { ...prev }; delete next[song.id]; return next; });
                                  if (welcomeRatingTarget === song.id) setWelcomeRatingTarget(null);
                                } else {
                                  setSelectedInWelcome(prev => new Set(prev).add(song.id));
                                  if (rating === undefined) setWelcomeRatingTarget(song.id);
                                }
                              }}
                              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.04)'; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
                              style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', borderRadius: 12, overflow: 'hidden', transition: 'transform 0.15s', position: 'relative' }}>
                              <div style={{ width: '100%', aspectRatio: '1', borderRadius: 12, overflow: 'hidden', border: isSelected ? '2px solid #6C63FF' : '2px solid transparent', boxSizing: 'border-box' as const, position: 'relative' }}>
                                <img src={song.artwork} alt={song.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                {isSelected && rating !== undefined && (
                                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <span style={{ color: '#fff', fontWeight: 900, fontSize: 20 }}>{rating}</span>
                                  </div>
                                )}
                                {isSelected && rating === undefined && (
                                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(108,99,255,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'pulse 1.5s ease-in-out infinite' }}>
                                    <span style={{ color: '#fff', fontWeight: 900, fontSize: 20 }}>?</span>
                                  </div>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Inline rating picker */}
                      {welcomeRatingTarget && (() => {
                        const target = welcomeSongs.find(s => s.id === welcomeRatingTarget);
                        if (!target) return null;
                        return (
                          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '14px 16px', marginTop: 10 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                              <img src={target.artwork} alt={target.title} style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{target.title}</p>
                                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{target.artist}</p>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                              {scaleTiers.map(tier => (
                                <button key={tier.score} onClick={() => { setWelcomeRatings(prev => ({ ...prev, [welcomeRatingTarget]: tier.score })); setWelcomeRatingTarget(null); }}
                                  style={{ width: 40, height: 36, borderRadius: 10, border: `1px solid ${tier.color}44`, cursor: 'pointer', fontSize: 13, fontWeight: 800, background: tier.color + '22', color: tier.color }}>
                                  {tier.score}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Done button */}
                      <button onClick={() => { saveAllWelcomeRatings(); setShowWelcome(false); localStorage.setItem('lyra_welcomed_v2', 'true'); }}
                        style={{ width: '100%', marginTop: 16, padding: 14, borderRadius: 100, fontSize: 15, fontWeight: 800, border: ratedCount > 0 ? 'none' : '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', background: ratedCount > 0 ? 'linear-gradient(135deg, #6C63FF, #8b5cf6)' : 'transparent', color: ratedCount > 0 ? '#fff' : 'rgba(255,255,255,0.3)' }}>
                        {ratedCount > 0 ? `Done (${ratedCount} rated) →` : 'Skip for now →'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      <RatingModal open={modalOpen} onClose={() => setModalOpen(false)} item={modalItem} userId={me?.id ?? null} />
    </AppShell>
  );
}
