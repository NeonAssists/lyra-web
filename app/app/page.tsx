'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ratingColor } from '@/lib/ratingColor';
import RatingModal, { type ModalItem } from '@/components/RatingModal';
import AppShell from '@/components/AppShell';

type User = { id: string; handle: string; display_name: string; avatar_url: string | null };

function getHiRes(url: string) { return url?.replace('100x100bb', '600x600bb') ?? ''; }
function toItemId(id: string, type: 'song' | 'album') { return type === 'album' ? `itunes:alb:${id}` : `itunes:trk:${id}`; }
function isAlbumId(id: string) { return id?.startsWith('itunes:alb:'); }
function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function AlbumCard({ artwork, title, artist, rating, rank, onClick }: {
  artwork: string; title: string; artist: string; rating?: number; rank?: number; onClick: () => void;
}) {
  const [hov, setHov] = useState(false);
  const col = rating ? ratingColor(rating) : null;
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: hov ? '#1c1c1e' : 'transparent', border: 'none', cursor: 'pointer', padding: 12, borderRadius: 12, textAlign: 'left', transition: 'background 0.15s', width: '100%' }}>
      <div style={{ position: 'relative', width: '100%', aspectRatio: '1', borderRadius: 10, overflow: 'hidden', background: '#1c1c1e', marginBottom: 10 }}>
        {artwork
          ? <Image src={artwork} alt={title} fill style={{ objectFit: 'cover' }} unoptimized sizes="200px" />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3a3a3c', fontSize: 28 }}>♪</div>}
        {rank != null && <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.75)', color: '#fff', fontSize: 11, fontWeight: 800, padding: '3px 7px', borderRadius: 6 }}>#{rank}</div>}
        {col && <div style={{ position: 'absolute', top: 8, right: 8, background: col, color: '#fff', fontSize: 11, fontWeight: 900, padding: '3px 8px', borderRadius: 6 }}>{rating!.toFixed(1)}</div>}
        <div style={{ position: 'absolute', inset: 0, background: hov ? 'rgba(255,255,255,0.04)' : 'transparent', transition: 'background 0.15s' }} />
      </div>
      <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3 }}>{title}</p>
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{artist}</p>
    </button>
  );
}

function SongRow({ item, rank, onClick }: { item: any; rank?: number; onClick: () => void }) {
  const [hov, setHov] = useState(false);
  const col = item.rating > 0 ? ratingColor(item.rating) : null;
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '8px 12px', borderRadius: 10, background: hov ? 'rgba(255,255,255,0.05)' : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s' }}>
      {rank != null && <span style={{ width: 22, textAlign: 'right', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.2)', flexShrink: 0 }}>{rank}</span>}
      <div style={{ width: 42, height: 42, borderRadius: 8, overflow: 'hidden', background: '#1c1c1e', flexShrink: 0, position: 'relative' }}>
        {(item.artwork_url || item.artwork)
          ? <Image src={(item.artwork_url || item.artwork)?.replace('{w}','100')?.replace('{h}','100')} alt={item.title} fill style={{ objectFit: 'cover' }} unoptimized sizes="42px" />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3a3a3c', fontSize: 16 }}>♪</div>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>{item.title}</p>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.artist}</p>
      </div>
      {col && <div style={{ flexShrink: 0, padding: '4px 9px', borderRadius: 7, background: col + '1a', border: `1px solid ${col}30`, color: col, fontSize: 13, fontWeight: 900 }}>{item.rating.toFixed(1)}</div>}
    </button>
  );
}

function SectionHeader({ title, sub, href }: { title: string; sub?: string; href?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 16 }}>
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.3px', margin: 0 }}>{title}</h2>
        {sub && <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{sub}</p>}
      </div>
      {href && <Link href={href} style={{ fontSize: 13, fontWeight: 600, color: '#6C63FF', textDecoration: 'none' }}>See all</Link>}
    </div>
  );
}

function Grid({ cols = 5, children }: { cols?: number; children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 4 }}>
      {children}
    </div>
  );
}

export default function AppHome() {
  const router = useRouter();
  const [me, setMe] = useState<User | null>(null);
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
        setCommunityPicks(data.filter((i: any) => {
          const k = `${i.user_id}_${i.item_id}`;
          if (seen.has(k)) return false; seen.add(k); return true;
        }));
      });
  }, []);

  useEffect(() => {
    if (!me) return;
    (supabase as any).from('follows').select('followee_id').eq('follower_id', me.id)
      .then(async ({ data: follows }: any) => {
        if (!follows?.length) return;
        const ids = follows.map((f: any) => f.followee_id);
        const { data } = await (supabase as any).from('user_rankings')
          .select('item_id, title, artist, artwork_url, rating, user_id')
          .in('user_id', ids).gte('rating', 8).not('title', 'is', null)
          .order('rating', { ascending: false }).limit(20);
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

  const hero = newAlbums[0];

  return (
    <AppShell>
      <div style={{ padding: '32px 32px 80px', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}>

        {/* Top bar: greeting + search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 36 }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px', margin: 0 }}>
              {me ? `${greeting()}, ${me.display_name || me.handle}` : 'Home'}
            </h1>
          </div>
          <div style={{ position: 'relative', width: 320 }}>
            <svg style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.35, pointerEvents: 'none' }} width="15" height="15" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search songs, albums, artists…"
              style={{ width: '100%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 100, padding: '10px 40px', fontSize: 14, color: '#fff', outline: 'none', boxSizing: 'border-box' }} />
            {query && <button onClick={() => setQuery('')} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>}
          </div>
        </div>

        {query ? (
          <div>
            <SectionHeader title={`Results for "${query}"`} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 32px' }}>
              {results.map((r: any, i: number) => {
                const isAlbum = r.wrapperType === 'collection' || !r.trackId;
                const id = String(r.trackId ?? r.collectionId ?? '');
                const title = r.trackName ?? r.collectionName ?? '';
                const art = getHiRes(r.artworkUrl100 ?? '');
                return <SongRow key={`sr-${i}`} item={{ title, artist: r.artistName ?? '', artwork_url: art }}
                  onClick={() => open({ id: toItemId(id, isAlbum ? 'album' : 'song'), title, artist: r.artistName ?? '', artwork: art, type: isAlbum ? 'album' : 'song' })} />;
              })}
            </div>
            {!searching && results.length === 0 && <p style={{ color: 'rgba(255,255,255,0.3)', padding: '60px 0', textAlign: 'center' }}>No results</p>}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>

            {/* Hero feature */}
            {hero && !loading && (
              <button onClick={() => open({ id: toItemId(hero.id, 'album'), title: hero.title, artist: hero.artist, artwork: hero.artwork, type: 'album' })}
                style={{ width: '100%', position: 'relative', borderRadius: 18, overflow: 'hidden', height: 260, background: '#1c1c1e', border: 'none', cursor: 'pointer', display: 'block' }}>
                <Image src={hero.artwork} alt={hero.title} fill style={{ objectFit: 'cover', filter: 'brightness(0.4)' }} unoptimized sizes="100vw" />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)' }} />
                <div style={{ position: 'absolute', bottom: 30, left: 32, textAlign: 'left' }}>
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: '#6C63FF', marginBottom: 8 }}>Featured Release</p>
                  <h2 style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px', marginBottom: 6, maxWidth: 420 }}>{hero.title}</h2>
                  <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', marginBottom: 18 }}>{hero.artist}</p>
                  <span style={{ display: 'inline-block', background: '#fff', color: '#000', fontSize: 13, fontWeight: 700, padding: '8px 20px', borderRadius: 100 }}>Rate this album →</span>
                </div>
              </button>
            )}

            {/* Quick stats if has ranked items */}
            {hotRange.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                {[
                  { label: 'Your Top Rated', value: hotRange[0]?.title ?? '—', sub: hotRange[0]?.artist ?? '', rating: hotRange[0]?.rating },
                  { label: 'Hot Range', value: `${hotRange.length} tracks`, sub: 'Rated 8+', rating: null },
                  { label: 'Friends Online', value: friendsPicks.length > 0 ? `${new Set(friendsPicks.map((f: any) => f.user_id)).size} friend${new Set(friendsPicks.map((f: any) => f.user_id)).size > 1 ? 's' : ''} active` : 'No activity yet', sub: friendsPicks.length > 0 ? `${friendsPicks.length} picks` : 'Follow people to see picks', rating: null },
                  { label: 'Community', value: `${communityPicks.length} picks`, sub: 'Rated 8+ by users', rating: null },
                ].map((s, i) => {
                  const col = s.rating ? ratingColor(s.rating) : '#6C63FF';
                  return (
                    <div key={i} style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '16px 18px' }}>
                      <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>{s.label}</p>
                      <p style={{ fontSize: 15, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.value}</p>
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>{s.sub}</p>
                      {s.rating && <div style={{ marginTop: 8, display: 'inline-block', background: col, color: '#fff', fontSize: 13, fontWeight: 900, padding: '2px 8px', borderRadius: 6 }}>{s.rating.toFixed(1)}</div>}
                    </div>
                  );
                })}
              </div>
            )}

            {/* New Albums grid */}
            <section>
              <SectionHeader title="New Albums" href="/music" />
              {loading
                ? <Grid cols={5}>{[...Array(5)].map((_, i) => <div key={i} style={{ aspectRatio: '1', background: '#1c1c1e', borderRadius: 10, margin: 12 }} />)}</Grid>
                : <Grid cols={5}>{newAlbums.slice(0, 10).map((a: any, i: number) => (
                    <AlbumCard key={`na-${i}`} artwork={a.artwork} title={a.title} artist={a.artist}
                      onClick={() => open({ id: toItemId(a.id, 'album'), title: a.title, artist: a.artist, artwork: a.artwork, type: 'album' })} />
                  ))}</Grid>}
            </section>

            {/* Friends' Picks + Community Picks — 2 col */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
              {friendsPicks.length > 0 && (
                <section>
                  <SectionHeader title="Friends' Picks" sub="Rated 8+ by people you follow" />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {friendsPicks.slice(0, 6).map((item: any, i: number) => (
                      <SongRow key={`fp-${i}`} item={item} rank={i + 1}
                        onClick={() => open({ id: item.item_id, title: item.title, artist: item.artist, artwork: item.artwork_url ?? '', type: isAlbumId(item.item_id) ? 'album' : 'song' })} />
                    ))}
                  </div>
                </section>
              )}
              <section>
                <SectionHeader title="Community Picks" sub="Highly rated across Lyra" />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {communityPicks.slice(0, 6).map((item: any, i: number) => (
                    <SongRow key={`cp-${i}`} item={item} rank={i + 1}
                      onClick={() => open({ id: item.item_id, title: item.title, artist: item.artist, artwork: item.artwork_url ?? '', type: isAlbumId(item.item_id) ? 'album' : 'song' })} />
                  ))}
                </div>
              </section>
            </div>

            {/* New Music grid */}
            <section>
              <SectionHeader title="New Music" />
              {loading
                ? <Grid cols={5}>{[...Array(5)].map((_, i) => <div key={i} style={{ aspectRatio: '1', background: '#1c1c1e', borderRadius: 10, margin: 12 }} />)}</Grid>
                : <Grid cols={5}>{newSongs.slice(0, 10).map((s: any, i: number) => (
                    <AlbumCard key={`nm-${i}`} artwork={s.artwork} title={s.title} artist={s.artist}
                      onClick={() => open({ id: toItemId(s.id, 'song'), title: s.title, artist: s.artist, artwork: s.artwork, type: 'song' })} />
                  ))}</Grid>}
            </section>

            {/* Your Music + Top 50 — 2 col */}
            <div style={{ display: 'grid', gridTemplateColumns: hotRange.length > 0 ? '1fr 1fr' : '1fr', gap: 40 }}>
              {hotRange.length > 0 && (
                <section>
                  <SectionHeader title="Your Music" sub="Hot Range — rated 8+" href="/ranked" />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {hotRange.slice(0, 6).map((item: any, i: number) => (
                      <SongRow key={`hr-${i}`} item={item} rank={i + 1}
                        onClick={() => open({ id: item.item_id, title: item.title, artist: item.artist, artwork: item.artwork_url ?? '', type: isAlbumId(item.item_id) ? 'album' : 'song' })} />
                    ))}
                  </div>
                </section>
              )}
              <section>
                <SectionHeader title="Top 50 US 🇺🇸" href="/music" />
                <Grid cols={hotRange.length > 0 ? 3 : 5}>
                  {topSongs.slice(0, hotRange.length > 0 ? 6 : 10).map((s: any, i: number) => (
                    <AlbumCard key={`ts-${i}`} artwork={s.artwork} title={s.title} artist={s.artist} rank={i + 1}
                      onClick={() => open({ id: toItemId(s.id, 'song'), title: s.title, artist: s.artist, artwork: s.artwork, type: 'song' })} />
                  ))}
                </Grid>
              </section>
            </div>

          </div>
        )}
      </div>

      <RatingModal open={modalOpen} onClose={() => setModalOpen(false)} item={modalItem} userId={me?.id ?? null} />
    </AppShell>
  );
}
