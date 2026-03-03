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

function getHiRes(url: string) {
  return url?.replace('100x100bb', '600x600bb') ?? '';
}
function toItemId(id: string, type: 'song' | 'album') {
  return type === 'album' ? `itunes:alb:${id}` : `itunes:trk:${id}`;
}
function isAlbumId(id: string) { return id?.startsWith('itunes:alb:'); }

function RatingBadge({ rating }: { rating: number }) {
  const col = ratingColor(rating);
  return (
    <div style={{ position: 'absolute', top: 8, right: 8, background: col, color: '#fff', fontSize: 11, fontWeight: 900, padding: '3px 7px', borderRadius: 8 }}>
      {rating.toFixed(1)}
    </div>
  );
}

function AlbumCard({ artwork, title, artist, rating, rank, size = 180, onClick }: {
  artwork: string; title: string; artist: string;
  rating?: number; rank?: number; size?: number; onClick: () => void;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ flexShrink: 0, width: size, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: 0, opacity: hov ? 0.8 : 1, transition: 'opacity 0.15s' }}>
      <div style={{ position: 'relative', width: size, height: size, borderRadius: 12, overflow: 'hidden', background: '#1c1c1e', marginBottom: 10 }}>
        {artwork
          ? <Image src={artwork} alt={title} fill style={{ objectFit: 'cover' }} unoptimized sizes={`${size}px`} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3a3a3c', fontSize: 32 }}>♪</div>}
        {rank != null && (
          <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.75)', color: '#fff', fontSize: 11, fontWeight: 900, padding: '3px 7px', borderRadius: 8 }}>
            #{rank}
          </div>
        )}
        {rating != null && <RatingBadge rating={rating} />}
      </div>
      <p style={{ fontSize: 14, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3 }}>{title}</p>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{artist}</p>
    </button>
  );
}

function SectionTitle({ children, sub, onSeeAll }: { children: React.ReactNode; sub?: string; onSeeAll?: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18 }}>
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px', margin: 0 }}>{children}</h2>
        {sub && <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>{sub}</p>}
      </div>
      {onSeeAll && (
        <button onClick={onSeeAll} style={{ fontSize: 14, fontWeight: 600, color: '#6C63FF', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0' }}>
          See All
        </button>
      )}
    </div>
  );
}

function HScroll({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'none' }}>
      {children}
    </div>
  );
}

function SongRow({ item, rank, onClick }: { item: any; rank?: number; onClick: () => void }) {
  const [hov, setHov] = useState(false);
  const col = ratingColor(item.rating ?? 0);
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', padding: '10px 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.05)', opacity: hov ? 0.75 : 1, transition: 'opacity 0.15s' }}>
      {rank != null && <span style={{ width: 24, textAlign: 'right', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.2)', flexShrink: 0 }}>{rank}</span>}
      <div style={{ width: 44, height: 44, borderRadius: 8, overflow: 'hidden', background: '#1c1c1e', flexShrink: 0, position: 'relative' }}>
        {item.artwork_url || item.artwork
          ? <Image src={(item.artwork_url || item.artwork)?.replace('{w}','100')?.replace('{h}','100')} alt={item.title} fill style={{ objectFit: 'cover' }} unoptimized sizes="44px" />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3a3a3c' }}>♪</div>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 15, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>{item.title}</p>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.artist}</p>
      </div>
      {item.rating > 0 && (
        <div style={{ flexShrink: 0, padding: '4px 10px', borderRadius: 8, background: col + '18', border: `1px solid ${col}33`, color: col, fontSize: 13, fontWeight: 900 }}>
          {item.rating.toFixed(1)}
        </div>
      )}
    </button>
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
      } else setMe(null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!me) return;
    supabase.from('user_rankings' as any).select('item_id, title, artist, artwork_url, rating')
      .eq('user_id', me.id).gte('rating', 8).not('title', 'is', null)
      .order('rating', { ascending: false }).limit(20)
      .then(({ data }) => { if (data) setHotRange(data as any[]); });
  }, [me]);

  useEffect(() => {
    (supabase as any).from('user_rankings').select('item_id, title, artist, artwork_url, rating, user_id')
      .gte('rating', 8).not('title', 'is', null).order('rating', { ascending: false }).limit(30)
      .then(({ data }: any) => {
        if (data) {
          const seen = new Set<string>();
          setCommunityPicks((data as any[]).filter((i: any) => {
            const k = `${i.user_id}_${i.item_id}`;
            if (seen.has(k)) return false; seen.add(k); return true;
          }));
        }
      });
  }, []);

  useEffect(() => {
    if (!me) return;
    (supabase as any).from('follows').select('followee_id').eq('follower_id', me.id)
      .then(async ({ data: follows }: any) => {
        if (!follows?.length) return;
        const ids = (follows as any[]).map((f: any) => f.followee_id);
        const { data } = await (supabase as any).from('user_rankings')
          .select('item_id, title, artist, artwork_url, rating, user_id')
          .in('user_id', ids).gte('rating', 8).not('title', 'is', null)
          .order('rating', { ascending: false }).limit(20);
        if (data) setFriendsPicks(data as any[]);
      });
  }, [me]);

  useEffect(() => {
    const map = (e: any) => ({
      id: e.id?.attributes?.['im:id'] ?? '',
      title: e['im:name']?.label ?? '',
      artist: e['im:artist']?.label ?? '',
      artwork: getHiRes(e['im:image']?.[2]?.label ?? ''),
    });
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
      const r = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song,album&limit=30`);
      const d = await r.json();
      setResults(d?.results ?? []);
      setSearching(false);
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  // Hero item — first new album
  const hero = newAlbums[0];

  return (
    <AppShell>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 32px 80px' }}>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 40 }}>
          <svg style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', opacity: 0.35 }} width="16" height="16" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search songs, albums, artists…"
            style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 50, padding: '12px 44px', fontSize: 15, color: '#fff', outline: 'none', boxSizing: 'border-box' }} />
          {searching && <div style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, border: '2px solid rgba(108,99,255,0.3)', borderTopColor: '#6C63FF', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />}
          {query && <button onClick={() => setQuery('')} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, lineHeight: 1 }}>×</button>}
        </div>

        {query ? (
          /* Search results */
          <div>
            <SectionTitle>Results for &ldquo;{query}&rdquo;</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 32px' }}>
              {results.map((r: any, i: number) => {
                const isAlbum = r.wrapperType === 'collection' || !r.trackId;
                const id = String(r.trackId ?? r.collectionId ?? '');
                const title = r.trackName ?? r.collectionName ?? '';
                const art = getHiRes(r.artworkUrl100 ?? '');
                return (
                  <SongRow key={`sr-${i}`}
                    item={{ title, artist: r.artistName ?? '', artwork_url: art }}
                    onClick={() => open({ id: toItemId(id, isAlbum ? 'album' : 'song'), title, artist: r.artistName ?? '', artwork: art, type: isAlbum ? 'album' : 'song' })}
                  />
                );
              })}
            </div>
            {results.length === 0 && !searching && <p style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '60px 0' }}>No results</p>}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 56 }}>

            {/* Hero banner — featured new album */}
            {hero && !loading && (
              <section>
                <button onClick={() => open({ id: toItemId(hero.id, 'album'), title: hero.title, artist: hero.artist, artwork: hero.artwork, type: 'album' })}
                  style={{ width: '100%', position: 'relative', borderRadius: 20, overflow: 'hidden', height: 280, background: '#1c1c1e', border: 'none', cursor: 'pointer', display: 'block', textAlign: 'left' }}>
                  <Image src={hero.artwork} alt={hero.title} fill style={{ objectFit: 'cover', filter: 'brightness(0.45)' }} unoptimized sizes="100vw" />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)' }} />
                  <div style={{ position: 'absolute', bottom: 32, left: 36 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: '#6C63FF', marginBottom: 8 }}>New Release</p>
                    <h2 style={{ fontSize: 32, fontWeight: 900, color: '#fff', letterSpacing: '-1px', marginBottom: 6 }}>{hero.title}</h2>
                    <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.65)' }}>{hero.artist}</p>
                    <div style={{ marginTop: 20, display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', color: '#000', fontSize: 14, fontWeight: 700, padding: '9px 22px', borderRadius: 100 }}>
                      Rate This Album
                    </div>
                  </div>
                </button>
              </section>
            )}

            {/* Friends' Picks */}
            {friendsPicks.length > 0 && (
              <section>
                <SectionTitle sub="Rated 8+ by people you follow">Friends&apos; Picks</SectionTitle>
                <HScroll>
                  {friendsPicks.map((item: any, i: number) => (
                    <AlbumCard key={`fp-${i}`} artwork={item.artwork_url ?? ''} title={item.title} artist={item.artist} rating={item.rating}
                      onClick={() => open({ id: item.item_id, title: item.title, artist: item.artist, artwork: item.artwork_url ?? '', type: isAlbumId(item.item_id) ? 'album' : 'song' })} />
                  ))}
                </HScroll>
              </section>
            )}

            {/* New Albums + Community Picks — side by side on wide screens */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }}>
              <section>
                <SectionTitle onSeeAll={() => router.push('/music')}>New Albums</SectionTitle>
                {loading
                  ? <div style={{ display: 'flex', gap: 14 }}>{[...Array(3)].map((_, i) => <div key={i} style={{ width: 180, height: 180, borderRadius: 12, background: '#1c1c1e', flexShrink: 0 }} />)}</div>
                  : <HScroll>{newAlbums.slice(0, 10).map((a: any, i: number) => (
                      <AlbumCard key={`na-${i}`} artwork={a.artwork} title={a.title} artist={a.artist}
                        onClick={() => open({ id: toItemId(a.id, 'album'), title: a.title, artist: a.artist, artwork: a.artwork, type: 'album' })} />
                    ))}</HScroll>}
              </section>

              <section>
                <SectionTitle sub="Highly rated by Lyra users">Community Picks</SectionTitle>
                <div>
                  {communityPicks.slice(0, 6).map((item: any, i: number) => (
                    <SongRow key={`cp-${i}`} item={item} rank={i + 1}
                      onClick={() => open({ id: item.item_id, title: item.title, artist: item.artist, artwork: item.artwork_url ?? '', type: isAlbumId(item.item_id) ? 'album' : 'song' })} />
                  ))}
                </div>
              </section>
            </div>

            {/* New Music */}
            <section>
              <SectionTitle>New Music</SectionTitle>
              {loading
                ? <div style={{ display: 'flex', gap: 16 }}>{[...Array(5)].map((_, i) => <div key={i} style={{ width: 180, height: 180, borderRadius: 12, background: '#1c1c1e', flexShrink: 0 }} />)}</div>
                : <HScroll>{newSongs.slice(0, 12).map((s: any, i: number) => (
                    <AlbumCard key={`nm-${i}`} artwork={s.artwork} title={s.title} artist={s.artist}
                      onClick={() => open({ id: toItemId(s.id, 'song'), title: s.title, artist: s.artist, artwork: s.artwork, type: 'song' })} />
                  ))}</HScroll>}
            </section>

            {/* Your Music + Top 50 — side by side */}
            <div style={{ display: 'grid', gridTemplateColumns: hotRange.length > 0 ? '1fr 1fr' : '1fr', gap: 48 }}>
              {hotRange.length > 0 && (
                <section>
                  <SectionTitle sub="Your top-rated music" onSeeAll={() => router.push('/ranked')}>Your Music</SectionTitle>
                  <div>
                    {hotRange.slice(0, 6).map((item: any, i: number) => (
                      <SongRow key={`hr-${i}`} item={item} rank={i + 1}
                        onClick={() => open({ id: item.item_id, title: item.title, artist: item.artist, artwork: item.artwork_url ?? '', type: isAlbumId(item.item_id) ? 'album' : 'song' })} />
                    ))}
                  </div>
                </section>
              )}
              <section>
                <SectionTitle>Top 50 US 🇺🇸</SectionTitle>
                {loading
                  ? <div style={{ display: 'flex', gap: 16 }}>{[...Array(5)].map((_, i) => <div key={i} style={{ width: 180, height: 180, borderRadius: 12, background: '#1c1c1e', flexShrink: 0 }} />)}</div>
                  : <HScroll>{topSongs.slice(0, 20).map((s: any, i: number) => (
                      <AlbumCard key={`ts-${i}`} artwork={s.artwork} title={s.title} artist={s.artist} rank={i + 1}
                        onClick={() => open({ id: toItemId(s.id, 'song'), title: s.title, artist: s.artist, artwork: s.artwork, type: 'song' })} />
                    ))}</HScroll>}
              </section>
            </div>

          </div>
        )}
      </div>

      <RatingModal open={modalOpen} onClose={() => setModalOpen(false)} item={modalItem} userId={me?.id ?? null} />
    </AppShell>
  );
}
