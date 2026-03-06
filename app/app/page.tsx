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

const WELCOME_SCALE_TIERS = [
  { score: 1,  label: 'Skip',        color: '#dc2626' },
  { score: 2,  label: 'Weak',        color: '#ea580c' },
  { score: 3,  label: 'Meh',         color: '#f59e0b' },
  { score: 4,  label: 'Below avg',   color: '#a3912a' },
  { score: 5,  label: 'Average',     color: '#84a332' },
  { score: 6,  label: 'Decent',      color: '#22863a' },
  { score: 7,  label: 'Good',        color: '#059669' },
  { score: 8,  label: 'Great',       color: '#0891b2' },
  { score: 9,  label: 'Elite',       color: '#3b82f6' },
  { score: 10, label: 'Masterpiece', color: '#8b5cf6' },
];

function WelcomeRatingCard() {
  const [rating, setRating] = useState(8.7);
  const tier = [...WELCOME_SCALE_TIERS].reverse().find(t => rating >= t.score) ?? WELCOME_SCALE_TIERS[0];
  const pct = ((rating - 1) / 9) * 100;
  return (
    <div style={{ background: 'rgba(20,16,12,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 20, boxShadow: `0 20px 60px ${tier.color}33` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Blinding Lights</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>The Weeknd</div>
        </div>
        <div style={{ background: `${tier.color}18`, borderRadius: 12, padding: '6px 12px', textAlign: 'center' as const }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: tier.color, lineHeight: 1 }}>{rating.toFixed(1)}</div>
          <div style={{ fontSize: 9, fontWeight: 700, color: tier.color, textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>{tier.label}</div>
        </div>
      </div>
      <div style={{ position: 'relative', marginBottom: 12 }}>
        <style>{`.lw-slider{-webkit-appearance:none;appearance:none;width:100%;height:28px;background:transparent;outline:none;cursor:pointer;position:relative;z-index:1}.lw-slider::-webkit-slider-thumb{-webkit-appearance:none;width:22px;height:22px;border-radius:50%;background:#fff;border:3px solid var(--lw-accent,#8b5cf6);box-shadow:0 2px 8px rgba(0,0,0,0.4);transition:border-color 0.2s}.lw-slider::-moz-range-thumb{width:22px;height:22px;border-radius:50%;background:#fff;border:3px solid var(--lw-accent,#8b5cf6)}`}</style>
        <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', transform: 'translateY(-50%)' }} />
        <div style={{ position: 'absolute', top: '50%', left: 0, width: `${pct}%`, height: 6, borderRadius: 3, background: tier.color, transform: 'translateY(-50%)', transition: 'width 0.05s, background 0.2s' }} />
        <input className="lw-slider" type="range" min="1" max="10" step="0.1" value={rating}
          style={{ '--lw-accent': tier.color } as React.CSSProperties}
          onChange={e => setRating(parseFloat(e.target.value))} />
      </div>
      {/* Bar chart — same as marketing page */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 64 }}>
        {WELCOME_SCALE_TIERS.map(t => {
          const h = 10 + (t.score / 10) * 90;
          return (
            <div key={t.score} style={{ flex: 1, height: '100%', position: 'relative' }}>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '3px 3px 0 0' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${h}%`, background: t.color, borderRadius: '3px 3px 0 0', opacity: 0.85 }} />
            </div>
          );
        })}
      </div>
    </div>
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
  const [welcomeStep, setWelcomeStep] = useState<1|2|3|4|5>(1);

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

  // Welcome modal trigger
  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('lyra_welcomed_v4') && me) {
      setShowWelcome(true);
      setWelcomeStep(1);
    }
  }, [me]);

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
        const TOTAL = 5;
        const dismissWelcome = () => { setShowWelcome(false); localStorage.setItem('lyra_welcomed_v4', 'true'); };
        const goNext = () => setWelcomeStep(s => Math.min(s + 1, TOTAL) as any);
        const goBack = () => setWelcomeStep(s => Math.max(s - 1, 1) as any);

        const TIERS = [
          { score: 1,  label: 'Skip',        color: '#dc2626' },
          { score: 2,  label: 'Weak',        color: '#ea580c' },
          { score: 3,  label: 'Meh',         color: '#f59e0b' },
          { score: 4,  label: 'Below Avg',   color: '#a3912a' },
          { score: 5,  label: 'Average',     color: '#84a332' },
          { score: 6,  label: 'Decent',      color: '#22863a' },
          { score: 7,  label: 'Good',        color: '#059669' },
          { score: 8,  label: 'Great',       color: '#0891b2' },
          { score: 9,  label: 'Elite',       color: '#3b82f6' },
          { score: 10, label: 'Masterpiece', color: '#8b5cf6' },
        ];

        const MOCK_TRACKS = [
          { title: 'Voodoo',            artist: "D'Angelo",        rating: 10.0, tier: 'Masterpiece', color: '#8b5cf6' },
          { title: 'DUCKWORTH.',        artist: 'Kendrick Lamar',   rating: 9.2,  tier: 'Elite',       color: '#3b82f6' },
          { title: 'Blinding Lights',   artist: 'The Weeknd',       rating: 8.7,  tier: 'Great',       color: '#0891b2' },
          { title: 'The Art of Loving', artist: 'Olivia Dean',      rating: 7.4,  tier: 'Good',        color: '#059669' },
        ];

        const MOCK_FRIENDS = [
          { initials: 'AL', color: '#6C63FF', name: 'Alex',  track: 'Voodoo',          score: 10.0, tier: 'Masterpiece', tc: '#8b5cf6' },
          { initials: 'BN', color: '#0891b2', name: 'Ben',   track: 'Blinding Lights', score: 8.7,  tier: 'Great',       tc: '#0891b2' },
          { initials: 'CO', color: '#059669', name: 'Cole',  track: 'DUCKWORTH.',      score: 9.2,  tier: 'Elite',       tc: '#3b82f6' },
        ];

        const cardStyle: React.CSSProperties = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 16 };
        const rowStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 10 };
        const artStyle: React.CSSProperties = { width: 38, height: 38, borderRadius: 8, background: 'rgba(255,255,255,0.08)', flexShrink: 0 };

        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div style={{ background: 'linear-gradient(135deg, rgba(108,99,255,0.5) 0%, rgba(139,92,246,0.2) 50%, rgba(6,182,212,0.2) 100%)', padding: 1, borderRadius: 28, maxWidth: 480, width: '100%' }}>
              <div style={{ background: 'linear-gradient(160deg, #0f0f0f 0%, #0d0b1a 100%)', borderRadius: 28, padding: '24px 28px 28px' }}>

                {/* Progress dots */}
                <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 24 }}>
                  {([1,2,3,4,5] as const).map(s => (
                    <div key={s} style={{ width: welcomeStep === s ? 24 : 6, height: 6, borderRadius: 3, background: welcomeStep === s ? '#6C63FF' : 'rgba(255,255,255,0.12)', transition: 'width 0.2s' }} />
                  ))}
                </div>

                {/* ── Step 1: What is Lyra ── */}
                {welcomeStep === 1 && (
                  <>
                    <h2 style={{ fontSize: 24, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px', margin: '0 0 8px' }}>Your music, ranked.</h2>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.65, margin: '0 0 20px' }}>Lyra isn't just a music app. It's where you build your personal music canon — every song, album, and artist you've ever loved, rated and ranked in order.</p>
                    <div style={cardStyle}>
                      {MOCK_TRACKS.map((t, i) => (
                        <div key={i} style={{ ...rowStyle, paddingBlock: 9, borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                          <span style={{ fontSize: 11, fontWeight: 900, color: '#3a3a3c', width: 16, textAlign: 'right', flexShrink: 0 }}>{i+1}</span>
                          <div style={artStyle} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{t.artist}</div>
                          </div>
                          <div style={{ background: t.color + '18', borderRadius: 9, padding: '5px 9px', textAlign: 'center', flexShrink: 0 }}>
                            <div style={{ fontSize: 15, fontWeight: 900, color: t.color, lineHeight: 1 }}>{t.rating.toFixed(1)}</div>
                            <div style={{ fontSize: 7, fontWeight: 800, color: t.color, textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 2 }}>{t.tier}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button onClick={goNext} style={{ width: '100%', marginTop: 20, padding: 14, borderRadius: 100, background: 'linear-gradient(135deg, #6C63FF, #8b5cf6)', color: '#fff', fontSize: 15, fontWeight: 800, border: 'none', cursor: 'pointer' }}>Next →</button>
                    <button onClick={dismissWelcome} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'rgba(255,255,255,0.2)', marginTop: 10, display: 'block', width: '100%', textAlign: 'center' }}>Skip for now</button>
                  </>
                )}

                {/* ── Step 2: The Scale ── */}
                {welcomeStep === 2 && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <button onClick={goBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', fontSize: 20, padding: 0, lineHeight: 1 }}>←</button>
                      <h2 style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.4px', margin: 0 }}>10 tiers. 90 decimal points.</h2>
                    </div>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.65, margin: '0 0 16px' }}>Not a thumbs up. Not a star. Every tier has a name, a color, and a meaning. Drag the slider and feel the difference.</p>
                    {/* Tier chips */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
                      {TIERS.map(t => (
                        <div key={t.score} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 9px', borderRadius: 8, background: t.color + '16', border: '1px solid' + t.color + '35' }}>
                          <span style={{ fontSize: 11, fontWeight: 900, color: t.color }}>{t.score}</span>
                          <span style={{ fontSize: 10, fontWeight: 700, color: t.color }}>{t.label}</span>
                        </div>
                      ))}
                    </div>
                    <WelcomeRatingCard />
                    <button onClick={goNext} style={{ width: '100%', marginTop: 16, padding: 14, borderRadius: 100, background: 'linear-gradient(135deg, #6C63FF, #8b5cf6)', color: '#fff', fontSize: 15, fontWeight: 800, border: 'none', cursor: 'pointer' }}>Next →</button>
                    <button onClick={dismissWelcome} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'rgba(255,255,255,0.2)', marginTop: 10, display: 'block', width: '100%', textAlign: 'center' }}>Skip for now</button>
                  </>
                )}

                {/* ── Step 3: Packs ── */}
                {welcomeStep === 3 && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <button onClick={goBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', fontSize: 20, padding: 0, lineHeight: 1 }}>←</button>
                      <h2 style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.4px', margin: 0 }}>Rate more. Know your taste.</h2>
                    </div>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.65, margin: '0 0 16px' }}>Packs are themed sets of music built to get you rating fast. The more you rate, the sharper your Personalization Pack gets — music picked specifically for you.</p>
                    <div style={cardStyle}>
                      {/* Pack rows */}
                      {[{name:'Hip-Hop Classics',color:'#8b5cf6'},{name:'R&B Essentials',color:'#0891b2'},{name:'Pop Hits',color:'#ea580c'},{name:'Jazz & Soul',color:'#059669'}].map((p,i) => (
                        <div key={i} style={{ ...rowStyle, paddingBlock: 9, borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                          <div style={{ width: 36, height: 36, borderRadius: 8, background: p.color + '25', flexShrink: 0 }} />
                          <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#fff' }}>{p.name}</div>
                          <div style={{ fontSize: 11, color: p.color, fontWeight: 700 }}>Rate →</div>
                        </div>
                      ))}
                      {/* Personalization Pack */}
                      <div style={{ marginTop: 12, background: 'rgba(108,99,255,0.1)', borderRadius: 12, border: '1px solid rgba(108,99,255,0.3)', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 9, fontWeight: 800, color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 }}>✦ Your Style Pack</div>
                          <div style={{ fontSize: 14, fontWeight: 900, color: '#fff' }}>Built for you</div>
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Gets smarter every time you rate</div>
                        </div>
                        <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(108,99,255,0.25)', flexShrink: 0 }} />
                      </div>
                    </div>
                    <button onClick={goNext} style={{ width: '100%', marginTop: 16, padding: 14, borderRadius: 100, background: 'linear-gradient(135deg, #6C63FF, #8b5cf6)', color: '#fff', fontSize: 15, fontWeight: 800, border: 'none', cursor: 'pointer' }}>Next →</button>
                    <button onClick={dismissWelcome} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'rgba(255,255,255,0.2)', marginTop: 10, display: 'block', width: '100%', textAlign: 'center' }}>Skip for now</button>
                  </>
                )}

                {/* ── Step 4: Head 2 Head ── */}
                {welcomeStep === 4 && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <button onClick={goBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', fontSize: 20, padding: 0, lineHeight: 1 }}>←</button>
                      <h2 style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.4px', margin: 0 }}>Head 2 Head.</h2>
                    </div>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.65, margin: '0 0 16px' }}>Two songs both rated 9.0? Head 2 Head settles it. Pick between songs, albums, or artists — head to head — until one true champion remains.</p>
                    <div style={cardStyle}>
                      {/* Mode tabs */}
                      <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: 3, marginBottom: 14 }}>
                        {['Songs','Albums','Artists'].map((mo,i) => (
                          <div key={mo} style={{ flex: 1, padding: '6px 0', borderRadius: 8, background: i===0 ? 'rgba(255,255,255,0.1)' : 'transparent', textAlign: 'center', fontSize: 11, fontWeight: i===0 ? 800 : 600, color: i===0 ? '#fff' : 'rgba(255,255,255,0.4)' }}>{mo}</div>
                        ))}
                      </div>
                      {/* VS cards */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ flex: 1, background: 'rgba(108,99,255,0.1)', borderRadius: 14, border: '1px solid rgba(108,99,255,0.4)', padding: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 52, height: 52, borderRadius: 10, background: 'rgba(108,99,255,0.25)' }} />
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', textAlign: 'center' }}>DUCKWORTH.</div>
                          <div style={{ background: '#3b82f620', borderRadius: 8, padding: '4px 10px', textAlign: 'center' }}>
                            <div style={{ fontSize: 14, fontWeight: 900, color: '#3b82f6' }}>9.2</div>
                            <div style={{ fontSize: 7, fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase' }}>ELITE</div>
                          </div>
                        </div>
                        <div style={{ background: 'rgba(108,99,255,0.15)', borderRadius: 10, padding: '8px 10px', flexShrink: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 900, color: '#6C63FF' }}>VS</div>
                        </div>
                        <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.1)', padding: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 52, height: 52, borderRadius: 10, background: 'rgba(255,255,255,0.08)' }} />
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', textAlign: 'center' }}>Blinding Lights</div>
                          <div style={{ background: '#0891b220', borderRadius: 8, padding: '4px 10px', textAlign: 'center' }}>
                            <div style={{ fontSize: 14, fontWeight: 900, color: '#0891b2' }}>8.7</div>
                            <div style={{ fontSize: 7, fontWeight: 800, color: '#0891b2', textTransform: 'uppercase' }}>GREAT</div>
                          </div>
                        </div>
                      </div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', textAlign: 'center', marginTop: 12, fontWeight: 600 }}>← Tap to pick your favorite →</div>
                    </div>
                    <button onClick={goNext} style={{ width: '100%', marginTop: 16, padding: 14, borderRadius: 100, background: 'linear-gradient(135deg, #6C63FF, #8b5cf6)', color: '#fff', fontSize: 15, fontWeight: 800, border: 'none', cursor: 'pointer' }}>Next →</button>
                    <button onClick={dismissWelcome} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'rgba(255,255,255,0.2)', marginTop: 10, display: 'block', width: '100%', textAlign: 'center' }}>Skip for now</button>
                  </>
                )}

                {/* ── Step 5: Friends ── */}
                {welcomeStep === 5 && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <button onClick={goBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', fontSize: 20, padding: 0, lineHeight: 1 }}>←</button>
                      <h2 style={{ fontSize: 20, fontWeight: 900, color: '#fff', letterSpacing: '-0.3px', margin: 0 }}>The more you rank, the more Lyra is yours.</h2>
                    </div>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.65, margin: '0 0 16px' }}>Add friends and see what they're rating in real time. The more you and your friends rank, the more your feed, your picks, and your app revolve around your actual taste.</p>
                    <div style={cardStyle}>
                      {MOCK_FRIENDS.map((f,i) => (
                        <div key={i} style={{ ...rowStyle, paddingBlock: 10, borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                          <div style={{ width: 34, height: 34, borderRadius: 17, background: f.color + '30', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <span style={{ fontSize: 12, fontWeight: 900, color: f.color }}>{f.initials}</span>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{f.name} <span style={{ fontWeight: 400, color: 'rgba(255,255,255,0.4)' }}>just rated</span></div>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.track}</div>
                          </div>
                          <div style={{ background: f.tc + '18', borderRadius: 8, padding: '4px 9px', textAlign: 'center', flexShrink: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 900, color: f.tc, lineHeight: 1 }}>{f.score.toFixed(1)}</div>
                            <div style={{ fontSize: 7, fontWeight: 800, color: f.tc, textTransform: 'uppercase', letterSpacing: 0.4 }}>{f.tier}</div>
                          </div>
                        </div>
                      ))}
                      <div style={{ marginTop: 12, background: 'rgba(108,99,255,0.1)', borderRadius: 10, border: '1px solid rgba(108,99,255,0.3)', padding: '10px 14px', textAlign: 'center', fontSize: 13, fontWeight: 800, color: '#8b5cf6' }}>
                        + Add friends
                      </div>
                    </div>
                    <button onClick={dismissWelcome} style={{ width: '100%', marginTop: 16, padding: 14, borderRadius: 100, background: 'linear-gradient(135deg, #6C63FF, #8b5cf6)', color: '#fff', fontSize: 15, fontWeight: 800, border: 'none', cursor: 'pointer' }}>Let's go →</button>
                  </>
                )}

              </div>
            </div>
          </div>
        );
      })()}

      <RatingModal open={modalOpen} onClose={() => setModalOpen(false)} item={modalItem} userId={me?.id ?? null} />
    </AppShell>
  );
}
