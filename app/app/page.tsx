'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ratingColor } from '@/lib/ratingColor';
import RatingModal, { type ModalItem } from '@/components/RatingModal';
import AppShell from '@/components/AppShell';

type User = { id: string; handle: string; display_name: string; avatar_url: string | null };
type Filter = 'all' | 'songs' | 'albums';

function getHiRes(url: string) { return url?.replace('100x100bb', '600x600bb') ?? ''; }
function toItemId(id: string, type: 'song' | 'album') { return type === 'album' ? `itunes:alb:${id}` : `itunes:trk:${id}`; }
function isAlbumId(id: string) { return id?.startsWith('itunes:alb:'); }
function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

// Compact horizontal quick-access card (Spotify "shortcut" style)
function QuickCard({ artwork, title, onClick }: { artwork: string; title: string; onClick: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 0, borderRadius: 6, overflow: 'hidden', background: hov ? '#333' : '#282828', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s', height: 56, width: '100%' }}>
      <div style={{ width: 56, height: 56, flexShrink: 0, position: 'relative', background: '#1c1c1e' }}>
        {artwork
          ? <Image src={artwork} alt={title} fill style={{ objectFit: 'cover' }} unoptimized sizes="56px" />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555' }}>♪</div>}
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', padding: '0 12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{title}</span>
    </button>
  );
}

// Square browse card with hover play button feel
function BrowseCard({ artwork, title, artist, rating, rank, onClick }: {
  artwork: string; title: string; artist: string; rating?: number; rank?: number; onClick: () => void;
}) {
  const [hov, setHov] = useState(false);
  const col = rating ? ratingColor(rating) : null;
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: hov ? '#1c1c1e' : '#111', border: 'none', cursor: 'pointer', padding: 12, borderRadius: 10, textAlign: 'left', transition: 'background 0.15s', width: '100%' }}>
      <div style={{ position: 'relative', width: '100%', aspectRatio: '1', borderRadius: 8, overflow: 'hidden', background: '#1c1c1e', marginBottom: 10 }}>
        {artwork
          ? <Image src={artwork} alt={title} fill style={{ objectFit: 'cover' }} unoptimized sizes="180px" />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3a3a3c', fontSize: 24 }}>♪</div>}
        {rank != null && <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: 11, fontWeight: 800, padding: '2px 7px', borderRadius: 5 }}>#{rank}</div>}
        {col && <div style={{ position: 'absolute', top: 8, right: 8, background: col, color: '#fff', fontSize: 11, fontWeight: 900, padding: '2px 7px', borderRadius: 5 }}>{rating!.toFixed(1)}</div>}
      </div>
      <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3 }}>{title}</p>
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{artist}</p>
    </button>
  );
}

// Row card — for song lists
function RowItem({ item, rank, onClick }: { item: any; rank?: number; onClick: () => void }) {
  const [hov, setHov] = useState(false);
  const col = item.rating > 0 ? ratingColor(item.rating) : null;
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '7px 8px', borderRadius: 8, background: hov ? 'rgba(255,255,255,0.06)' : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s' }}>
      {rank != null && <span style={{ width: 20, textAlign: 'right', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.2)', flexShrink: 0 }}>{rank}</span>}
      <div style={{ width: 40, height: 40, borderRadius: 6, overflow: 'hidden', background: '#1c1c1e', flexShrink: 0, position: 'relative' }}>
        {(item.artwork_url || item.artwork)
          ? <Image src={(item.artwork_url || item.artwork)?.replace('{w}','100')?.replace('{h}','100')} alt={item.title} fill style={{ objectFit: 'cover' }} unoptimized sizes="40px" />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3a3a3c' }}>♪</div>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 1 }}>{item.title}</p>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.artist}</p>
      </div>
      {col && <div style={{ flexShrink: 0, padding: '3px 8px', borderRadius: 6, background: col + '1a', border: `1px solid ${col}2e`, color: col, fontSize: 12, fontWeight: 900 }}>{item.rating.toFixed(1)}</div>}
    </button>
  );
}

// Section header — Spotify style: small gray label + large bold title + optional "Show all"
function SHeader({ label, title, href }: { label?: string; title: string; href?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 16 }}>
      <div>
        {label && <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 5 }}>{label}</p>}
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.3px', margin: 0 }}>{title}</h2>
      </div>
      {href && <Link href={href} style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', letterSpacing: 1, textTransform: 'uppercase' }}>Show all</Link>}
    </div>
  );
}

// Horizontal scroll row with arrow buttons
function HRow({ children, cols = 5 }: { children: React.ReactNode; cols?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * 220, behavior: 'smooth' });
  return (
    <div style={{ position: 'relative' }}>
      <div ref={ref} style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 6, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {children}
      </div>
    </div>
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
      .eq('user_id', me.id).gte('rating', 8).not('title', 'is', null)
      .order('rating', { ascending: false }).limit(20)
      .then(({ data }: any) => { if (data) setHotRange(data); });
  }, [me]);

  useEffect(() => {
    (supabase as any).from('user_rankings').select('item_id, title, artist, artwork_url, rating, user_id')
      .gte('rating', 8).not('title', 'is', null).order('rating', { ascending: false }).limit(30)
      .then(({ data }: any) => {
        if (!data) return;
        const seen = new Set<string>();
        setCommunityPicks(data.filter((i: any) => { const k = `${i.user_id}_${i.item_id}`; if (seen.has(k)) return false; seen.add(k); return true; }));
      });
  }, []);

  useEffect(() => {
    if (!me) return;
    (supabase as any).from('follows').select('followee_id').eq('follower_id', me.id)
      .then(async ({ data: follows }: any) => {
        if (!follows?.length) return;
        const ids = follows.map((f: any) => f.followee_id);
        const { data } = await (supabase as any).from('user_rankings').select('item_id, title, artist, artwork_url, rating, user_id')
          .in('user_id', ids).gte('rating', 8).not('title', 'is', null).order('rating', { ascending: false }).limit(20);
        if (data) setFriendsPicks(data);
      });
  }, [me]);

  useEffect(() => {
    const map = (e: any) => ({ id: e.id?.attributes?.['im:id'] ?? '', title: e['im:name']?.label ?? '', artist: e['im:artist']?.label ?? '', artwork: getHiRes(e['im:image']?.[2]?.label ?? '') });
    Promise.all([
      fetch('https://itunes.apple.com/us/rss/topsongs/limit=25/json').then(r => r.json()),
      fetch('https://itunes.apple.com/us/rss/topalbums/limit=25/json').then(r => r.json()),
      fetch('https://itunes.apple.com/us/rss/newmusic/limit=25/json').then(r => r.json()),
    ]).then(([songs, albums, newmus]) => {
      setTopSongs((songs?.feed?.entry ?? []).map(map));
      setNewAlbums((albums?.feed?.entry ?? []).map(map));
      setNewSongs((newmus?.feed?.entry ?? []).map(map));
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

  // Filter quick-access items
  const quickItems = hotRange.slice(0, 8);

  return (
    <AppShell>
      <div style={{ padding: '28px 28px 80px', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif', minHeight: '100vh' }}>

        {/* Top: greeting + search */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff', letterSpacing: '-0.3px', margin: 0 }}>
            {me ? `${greeting()}, ${me.display_name || me.handle}` : 'Home'}
          </h1>
          <div style={{ position: 'relative', width: 300 }}>
            <svg style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.4, pointerEvents: 'none' }} width="14" height="14" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search…"
              style={{ width: '100%', background: '#2a2a2a', border: '1px solid transparent', borderRadius: 100, padding: '9px 40px', fontSize: 14, color: '#fff', outline: 'none', boxSizing: 'border-box' }} />
            {query && <button onClick={() => setQuery('')} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.5)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>}
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
          // Search results
          <div>
            <SHeader title={`Results for "${query}"`} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 32px' }}>
              {results.map((r: any, i: number) => {
                const isAlbum = r.wrapperType === 'collection' || !r.trackId;
                const id = String(r.trackId ?? r.collectionId ?? '');
                const title = r.trackName ?? r.collectionName ?? '';
                const art = getHiRes(r.artworkUrl100 ?? '');
                return <RowItem key={`sr-${i}`} item={{ title, artist: r.artistName ?? '', artwork_url: art }}
                  onClick={() => open({ id: toItemId(id, isAlbum ? 'album' : 'song'), title, artist: r.artistName ?? '', artwork: art, type: isAlbum ? 'album' : 'song' })} />;
              })}
            </div>
            {!searching && results.length === 0 && <p style={{ color: 'rgba(255,255,255,0.3)', padding: '60px 0', textAlign: 'center' }}>No results</p>}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>

            {/* Quick-access grid — your hot range (Spotify shortcut cards) */}
            {quickItems.length > 0 && (filter === 'all' || filter === 'songs') && (
              <section>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
                  {quickItems.map((item: any, i: number) => (
                    <QuickCard key={`qc-${i}`} artwork={item.artwork_url ?? ''} title={item.title}
                      onClick={() => open({ id: item.item_id, title: item.title, artist: item.artist, artwork: item.artwork_url ?? '', type: isAlbumId(item.item_id) ? 'album' : 'song' })} />
                  ))}
                </div>
              </section>
            )}

            {/* New Albums */}
            {(filter === 'all' || filter === 'albums') && (
              <section>
                <SHeader label="Browse" title="New Albums" href="/music" />
                {loading
                  ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>{[...Array(5)].map((_, i) => <div key={i} style={{ aspectRatio: '1', background: '#1c1c1e', borderRadius: 10 }} />)}</div>
                  : <HRow cols={5}>{newAlbums.slice(0, 10).map((a: any, i: number) => (
                      <BrowseCard key={`na-${i}`} artwork={a.artwork} title={a.title} artist={a.artist}
                        onClick={() => open({ id: toItemId(a.id, 'album'), title: a.title, artist: a.artist, artwork: a.artwork, type: 'album' })} />
                    ))}</HRow>}
              </section>
            )}

            {/* Friends + Community — side by side list */}
            {filter === 'all' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
                {friendsPicks.length > 0 && (
                  <section>
                    <SHeader label="Social" title="Friends' Picks" />
                    {friendsPicks.slice(0, 7).map((item: any, i: number) => (
                      <RowItem key={`fp-${i}`} item={item} rank={i + 1}
                        onClick={() => open({ id: item.item_id, title: item.title, artist: item.artist, artwork: item.artwork_url ?? '', type: isAlbumId(item.item_id) ? 'album' : 'song' })} />
                    ))}
                  </section>
                )}
                <section>
                  <SHeader label="Community" title="Community Picks" />
                  {communityPicks.slice(0, 7).map((item: any, i: number) => (
                    <RowItem key={`cp-${i}`} item={item} rank={i + 1}
                      onClick={() => open({ id: item.item_id, title: item.title, artist: item.artist, artwork: item.artwork_url ?? '', type: isAlbumId(item.item_id) ? 'album' : 'song' })} />
                  ))}
                </section>
              </div>
            )}

            {/* New Music */}
            {(filter === 'all' || filter === 'songs') && (
              <section>
                <SHeader label="Just Released" title="New Music" href="/music" />
                {loading
                  ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>{[...Array(5)].map((_, i) => <div key={i} style={{ aspectRatio: '1', background: '#1c1c1e', borderRadius: 10 }} />)}</div>
                  : <HRow cols={5}>{newSongs.slice(0, 10).map((s: any, i: number) => (
                      <BrowseCard key={`nm-${i}`} artwork={s.artwork} title={s.title} artist={s.artist}
                        onClick={() => open({ id: toItemId(s.id, 'song'), title: s.title, artist: s.artist, artwork: s.artwork, type: 'song' })} />
                    ))}</HRow>}
              </section>
            )}

            {/* Your Music + Top 50 */}
            <div style={{ display: 'grid', gridTemplateColumns: hotRange.length > 0 ? '1fr 1fr' : '1fr', gap: 32 }}>
              {hotRange.length > 0 && (filter === 'all' || filter === 'songs') && (
                <section>
                  <SHeader label="Your Taste" title="Hot Range" href="/ranked" />
                  {hotRange.slice(0, 7).map((item: any, i: number) => (
                    <RowItem key={`hr-${i}`} item={item} rank={i + 1}
                      onClick={() => open({ id: item.item_id, title: item.title, artist: item.artist, artwork: item.artwork_url ?? '', type: isAlbumId(item.item_id) ? 'album' : 'song' })} />
                  ))}
                </section>
              )}
              {(filter === 'all' || filter === 'songs') && (
                <section>
                  <SHeader label="Charts" title="Top 50 US 🇺🇸" href="/music" />
                  {loading
                    ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>{[...Array(6)].map((_, i) => <div key={i} style={{ aspectRatio: '1', background: '#1c1c1e', borderRadius: 10 }} />)}</div>
                    : <HRow cols={hotRange.length > 0 ? 3 : 5}>{topSongs.slice(0, hotRange.length > 0 ? 6 : 10).map((s: any, i: number) => (
                        <BrowseCard key={`ts-${i}`} artwork={s.artwork} title={s.title} artist={s.artist} rank={i + 1}
                          onClick={() => open({ id: toItemId(s.id, 'song'), title: s.title, artist: s.artist, artwork: s.artwork, type: 'song' })} />
                      ))}</HRow>}
                </section>
              )}
            </div>

          </div>
        )}
      </div>

      <RatingModal open={modalOpen} onClose={() => setModalOpen(false)} item={modalItem} userId={me?.id ?? null} />
    </AppShell>
  );
}
