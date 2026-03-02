'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ratingColor } from '@/lib/ratingColor';
import RatingModal, { type ModalItem } from '@/components/RatingModal';
import AppShell from '@/components/AppShell';

type User = { id: string; handle: string; display_name: string; avatar_url: string | null };

function toItemId(id: string, type: 'song' | 'album') {
  return type === 'album' ? `itunes:alb:${id}` : `itunes:trk:${id}`;
}

function getArtworkHiRes(url: string) {
  return url.replace('100x100bb', '600x600bb');
}

function RatingBadge({ rating }: { rating: number }) {
  const col = ratingColor(rating);
  return (
    <div className="absolute top-2 right-2 rounded-md px-1.5 py-0.5 text-[10px] font-black"
      style={{ backgroundColor: col, color: '#fff' }}>
      {rating.toFixed(1)}
    </div>
  );
}

// Compact square card — matches app's horizontal scroll cards
function AlbumCard({ artwork, title, artist, rating, rank, onClick }: {
  artwork: string; title: string; artist: string;
  rating?: number; rank?: number; onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="flex-none w-[140px] text-left focus:outline-none active:opacity-70 transition-opacity">
      <div className="relative w-[140px] h-[140px] rounded-[12px] overflow-hidden bg-[#1c1c1e] mb-2">
        {artwork
          ? <Image src={artwork} alt={title} fill className="object-cover" unoptimized sizes="140px" />
          : <div className="w-full h-full flex items-center justify-center text-3xl text-[#3a3a3c]">♪</div>}
        {rank != null && (
          <div className="absolute top-2 left-2 bg-black/70 text-white text-[10px] font-black px-1.5 py-0.5 rounded">
            #{rank}
          </div>
        )}
        {rating != null && <RatingBadge rating={rating} />}
      </div>
      <p className="text-[13px] font-semibold text-white leading-tight truncate px-0.5">{title}</p>
      <p className="text-[12px] text-[#8E8E93] truncate px-0.5 mt-0.5">{artist}</p>
    </button>
  );
}

// Section header — matches app exactly
function SectionHeader({ title, subtitle, onSeeAll }: { title: string; subtitle?: string; onSeeAll?: () => void }) {
  return (
    <div className="flex items-end justify-between px-4 mb-3">
      <div>
        <h2 className="text-[17px] font-bold text-white">{title}</h2>
        {subtitle && <p className="text-[12px] text-[#8E8E93] mt-0.5">{subtitle}</p>}
      </div>
      {onSeeAll && (
        <button onClick={onSeeAll} className="text-[14px] font-semibold text-[#6C63FF] active:opacity-70">
          See All
        </button>
      )}
    </div>
  );
}

// Horizontal scroll row
function HRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-1 px-4 scrollbar-none">
      {children}
    </div>
  );
}

// Song row — for ranked list style
function SongRow({ item, rank, onClick }: { item: any; rank?: number; onClick: () => void }) {
  const col = ratingColor(item.rating);
  return (
    <button onClick={onClick} className="flex items-center gap-3 px-4 py-3 w-full active:bg-white/[0.04] transition-colors text-left">
      {rank != null && <span className="text-[13px] font-bold text-[#636366] w-6 text-right flex-none">{rank}</span>}
      <div className="relative w-[44px] h-[44px] rounded-[8px] overflow-hidden bg-[#1c1c1e] flex-none">
        {(item.artwork_url || item.artwork)
          ? <Image src={item.artwork_url ?? item.artwork} alt={item.title} fill className="object-cover" unoptimized sizes="44px" />
          : <div className="w-full h-full flex items-center justify-center text-[#3a3a3c]">♪</div>}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold text-white truncate">{item.title}</p>
        <p className="text-[12px] text-[#8E8E93] truncate">{item.artist}</p>
      </div>
      {item.rating != null && (
        <div className="rounded-[8px] px-2 py-1 text-[13px] font-black flex-none" style={{ backgroundColor: col + '22', color: col }}>
          {Number(item.rating).toFixed(1)}
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
  const [topSongsGlobal, setTopSongsGlobal] = useState<any[]>([]);
  const [newAlbums, setNewAlbums] = useState<any[]>([]);
  const [newSongs, setNewSongs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [communityPicks, setCommunityPicks] = useState<any[]>([]);
  const [friendsPicks, setFriendsPicks] = useState<any[]>([]);
  const [hotRange, setHotRange] = useState<any[]>([]);
  const [modalItem, setModalItem] = useState<ModalItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const open = (item: ModalItem) => { setModalItem(item); setModalOpen(true); };

  // Auth
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        const { data: p } = await supabase.from('profiles').select('id, handle, display_name, avatar_url').eq('id', data.user.id).single();
        setMe(p as User);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_ev, session) => {
      if (session?.user) {
        const { data: p } = await supabase.from('profiles').select('id, handle, display_name, avatar_url').eq('id', session.user.id).single();
        setMe(p as User);
      } else setMe(null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Hot Range — own 8+ ratings
  useEffect(() => {
    if (!me) return;
    supabase.from('user_rankings').select('item_id, title, artist, artwork_url, rating')
      .eq('user_id', me.id).gte('rating', 8).not('title', 'is', null)
      .order('rating', { ascending: false }).limit(20)
      .then(({ data }) => { if (data) setHotRange(data); });
  }, [me]);

  // Community picks
  useEffect(() => {
    supabase.from('user_rankings').select('item_id, title, artist, artwork_url, rating, user_id')
      .gte('rating', 8).not('title', 'is', null).order('rating', { ascending: false }).limit(20)
      .then(({ data }) => {
        if (data) {
          const seen = new Set<string>();
          setCommunityPicks(data.filter((i: any) => {
            const k = `${i.user_id}_${i.item_id}`;
            if (seen.has(k)) return false;
            seen.add(k); return true;
          }));
        }
      });
  }, []);

  // Friends picks
  useEffect(() => {
    if (!me) return;
    supabase.from('follows').select('following_id').eq('follower_id', me.id)
      .then(async ({ data: follows }) => {
        if (!follows?.length) return;
        const ids = follows.map((f: any) => f.following_id);
        const { data } = await supabase.from('user_rankings')
          .select('item_id, title, artist, artwork_url, rating, user_id, profiles(handle)')
          .in('user_id', ids).gte('rating', 8).not('title', 'is', null)
          .order('rating', { ascending: false }).limit(20);
        if (data) setFriendsPicks(data as any[]);
      });
  }, [me]);

  // iTunes feeds
  useEffect(() => {
    const map = (e: any) => ({
      id: e.id?.attributes?.['im:id'] ?? '',
      title: e['im:name']?.label ?? '',
      artist: e['im:artist']?.label ?? '',
      artwork: getArtworkHiRes(e['im:image']?.[2]?.label ?? ''),
    });
    Promise.all([
      fetch('https://itunes.apple.com/us/rss/topsongs/limit=25/json').then(r => r.json()),
      fetch('https://itunes.apple.com/us/rss/topalbums/limit=25/json').then(r => r.json()),
      fetch('https://itunes.apple.com/us/rss/newmusic/limit=25/json').then(r => r.json()),
      fetch('https://itunes.apple.com/WebObjects/MZStoreServices.woa/ws/charts?cc=us&g=34&name=TopAlbums&limit=25').catch(() => ({ json: () => ({}) })).then(r => r instanceof Response ? r.json() : {}),
    ]).then(([songs, albums, newmus]) => {
      setTopSongs((songs?.feed?.entry ?? []).map(map));
      setNewAlbums((albums?.feed?.entry ?? []).map(map));
      setNewSongs((newmus?.feed?.entry ?? []).map(map));
      setLoading(false);
    }).catch(() => setLoading(false));

    // Global top songs
    fetch('https://itunes.apple.com/WebObjects/MZStoreServices.woa/ws/charts?cc=global&g=34&name=TopSongs&limit=25')
      .catch(() => null).then(async r => {
        if (!r) return;
        // fallback — just use US for global too
      });
  }, []);

  // Search
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

  const isAlbumId = (id: string) => id?.startsWith('itunes:alb:');

  return (
    <AppShell>
      {/* Header — matches app top bar */}
      <div className="flex items-center justify-between px-4 pt-14 pb-2">
        <h1 className="text-[28px] font-black text-white tracking-tight">Lyra</h1>
        <div className="flex items-center gap-3">
          {me ? (
            <Link href={`/u/${me.handle}`}>
              {me.avatar_url
                ? <div className="relative w-9 h-9 rounded-full overflow-hidden"><Image src={me.avatar_url} alt={me.display_name} fill className="object-cover" unoptimized /></div>
                : <div className="w-9 h-9 rounded-full bg-[#6C63FF] flex items-center justify-center text-xs font-bold">{(me.display_name ?? me.handle).slice(0,2).toUpperCase()}</div>}
            </Link>
          ) : (
            <Link href="/login" className="text-[14px] font-semibold text-[#6C63FF]">Sign in</Link>
          )}
        </div>
      </div>

      {/* Search bar */}
      <div className="px-4 pb-3">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#636366]" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Artists, songs, albums"
            className="w-full bg-[#1c1c1e] rounded-[10px] pl-8 pr-4 py-2.5 text-[14px] text-white placeholder-[#636366] outline-none"
          />
          {searching && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-[#6C63FF]/30 border-t-[#6C63FF] rounded-full animate-spin" />}
          {query && <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#636366] text-lg leading-none">×</button>}
        </div>
      </div>

      {query ? (
        /* Search results */
        <div className="px-4 space-y-1">
          {results.map((r: any, i: number) => {
            const isAlbum = r.wrapperType === 'collection' || !r.trackId;
            const id = String(r.trackId ?? r.collectionId ?? '');
            const title = r.trackName ?? r.collectionName ?? '';
            const art = getArtworkHiRes(r.artworkUrl100 ?? '');
            return (
              <SongRow key={`sr-${i}`}
                item={{ title, artist: r.artistName ?? '', artwork_url: art }}
                onClick={() => open({ id: toItemId(id, isAlbum ? 'album' : 'song'), title, artist: r.artistName ?? '', artwork: art, type: isAlbum ? 'album' : 'song' })}
              />
            );
          })}
          {results.length === 0 && !searching && <p className="text-[#636366] text-center py-10 text-sm">No results</p>}
        </div>
      ) : (
        <div className="space-y-8 pb-4">

          {/* Friends' Picks */}
          {friendsPicks.length > 0 && (
            <section>
              <SectionHeader title="Friends' Picks" subtitle="Rated 8+ by people you follow" />
              <HRow>
                {friendsPicks.map((item: any, i: number) => (
                  <AlbumCard key={`fp-${i}`} artwork={item.artwork_url ?? ''} title={item.title} artist={item.artist} rating={item.rating}
                    onClick={() => open({ id: item.item_id, title: item.title, artist: item.artist, artwork: item.artwork_url ?? '', type: isAlbumId(item.item_id) ? 'album' : 'song' })} />
                ))}
              </HRow>
            </section>
          )}

          {/* New Albums */}
          <section>
            <SectionHeader title="New Albums" onSeeAll={() => router.push('/music')} />
            {loading
              ? <HRow>{[...Array(5)].map((_, i) => <div key={i} className="flex-none w-[140px] h-[140px] rounded-[12px] bg-[#1c1c1e] animate-pulse" />)}</HRow>
              : <HRow>{newAlbums.slice(0, 12).map((a: any, i: number) => (
                  <AlbumCard key={`na-${i}`} artwork={a.artwork} title={a.title} artist={a.artist}
                    onClick={() => open({ id: toItemId(a.id, 'album'), title: a.title, artist: a.artist, artwork: a.artwork, type: 'album' })} />
                ))}</HRow>}
          </section>

          {/* Community Picks */}
          {communityPicks.length > 0 && (
            <section>
              <SectionHeader title="Community Picks" subtitle="Highly rated by Lyra users" />
              <div className="divide-y divide-white/[0.04]">
                {communityPicks.slice(0, 5).map((item: any, i: number) => (
                  <SongRow key={`cp-${i}`} item={item} rank={i + 1}
                    onClick={() => open({ id: item.item_id, title: item.title, artist: item.artist, artwork: item.artwork_url ?? '', type: isAlbumId(item.item_id) ? 'album' : 'song' })} />
                ))}
              </div>
            </section>
          )}

          {/* New Music */}
          <section>
            <SectionHeader title="New Music" />
            {loading
              ? <HRow>{[...Array(5)].map((_, i) => <div key={i} className="flex-none w-[140px] h-[140px] rounded-[12px] bg-[#1c1c1e] animate-pulse" />)}</HRow>
              : <HRow>{newSongs.slice(0, 12).map((s: any, i: number) => (
                  <AlbumCard key={`nm-${i}`} artwork={s.artwork} title={s.title} artist={s.artist}
                    onClick={() => open({ id: toItemId(s.id, 'song'), title: s.title, artist: s.artist, artwork: s.artwork, type: 'song' })} />
                ))}</HRow>}
          </section>

          {/* Your Music — Hot Range */}
          {hotRange.length > 0 && (
            <section>
              <SectionHeader title="Your Music" subtitle="Hot Range" onSeeAll={() => router.push('/ranked')} />
              <div className="divide-y divide-white/[0.04]">
                {hotRange.slice(0, 6).map((item: any, i: number) => (
                  <SongRow key={`hr-${i}`} item={item} rank={i + 1}
                    onClick={() => open({ id: item.item_id, title: item.title, artist: item.artist, artwork: item.artwork_url ?? '', type: isAlbumId(item.item_id) ? 'album' : 'song' })} />
                ))}
              </div>
            </section>
          )}

          {/* Top 50 US */}
          <section>
            <SectionHeader title="Top 50 US 🇺🇸" onSeeAll={() => router.push('/music')} />
            {loading
              ? <HRow>{[...Array(5)].map((_, i) => <div key={i} className="flex-none w-[140px] h-[140px] rounded-[12px] bg-[#1c1c1e] animate-pulse" />)}</HRow>
              : <HRow>{topSongs.slice(0, 25).map((s: any, i: number) => (
                  <AlbumCard key={`ts-${i}`} artwork={s.artwork} title={s.title} artist={s.artist} rank={i + 1}
                    onClick={() => open({ id: toItemId(s.id, 'song'), title: s.title, artist: s.artist, artwork: s.artwork, type: 'song' })} />
                ))}</HRow>}
          </section>

        </div>
      )}

      <RatingModal open={modalOpen} onClose={() => setModalOpen(false)} item={modalItem} userId={me?.id ?? null} />
    </AppShell>
  );
}
