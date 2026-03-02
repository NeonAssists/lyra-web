'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { getArtworkHiRes } from '@/lib/itunes';
import { ratingColor } from '@/lib/ratingColor';
import RatingModal, { type ModalItem } from '@/components/RatingModal';
import AppShell from '@/components/AppShell';

type User = { id: string; handle: string; display_name: string; avatar_url: string | null };

function toItemId(itunesId: string, type: 'song' | 'album') {
  return type === 'album' ? `itunes:alb:${itunesId}` : `itunes:trk:${itunesId}`;
}

function RatingBadge({ rating }: { rating: number }) {
  const color = ratingColor(rating);
  return (
    <span className="inline-flex items-center justify-center text-[11px] font-black rounded-md px-1.5 py-0.5" style={{ backgroundColor: color + '22', color, border: `1px solid ${color}44` }}>
      {rating.toFixed(1)}
    </span>
  );
}

function HScroll({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4">
      {children}
    </div>
  );
}

function MusicTile({ artwork, title, artist, rating, rank, badge, onClick }: {
  artwork: string; title: string; artist: string;
  rating?: number; rank?: number; badge?: string; onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="flex-none w-[140px] sm:w-[160px] text-left group focus:outline-none">
      <div className="relative aspect-square rounded-xl overflow-hidden bg-[#141414] mb-2.5">
        {artwork ? (
          <Image src={artwork} alt={title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" unoptimized />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl text-[#48484A]">♪</div>
        )}
        {rank && (
          <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm text-white text-xs font-black px-1.5 py-0.5 rounded-md">
            #{rank}
          </div>
        )}
        {rating != null && (
          <div className="absolute top-2 right-2">
            <RatingBadge rating={rating} />
          </div>
        )}
        {badge && (
          <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm text-[10px] text-[#8E8E93] px-1.5 py-0.5 rounded-md">
            {badge}
          </div>
        )}
      </div>
      <p className="text-sm font-semibold text-white leading-tight truncate">{title}</p>
      <p className="text-xs text-[#8E8E93] truncate mt-0.5">{artist}</p>
    </button>
  );
}

function HotRangeRow({ item, rank, onClick }: { item: any; rank: number; onClick: () => void }) {
  const color = ratingColor(item.rating);
  return (
    <button onClick={onClick} className="flex items-center gap-3 w-full px-4 py-3 hover:bg-white/[0.03] transition-colors rounded-xl text-left group">
      <span className="text-sm font-black text-[#48484A] w-6 text-right flex-none">{rank}</span>
      <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-[#141414] flex-none">
        {item.artwork_url
          ? <Image src={item.artwork_url} alt={item.title} fill className="object-cover" unoptimized />
          : <div className="w-full h-full flex items-center justify-center text-[#48484A] text-lg">♪</div>}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{item.title}</p>
        <p className="text-xs text-[#8E8E93] truncate">{item.artist}</p>
      </div>
      <RatingBadge rating={item.rating} />
    </button>
  );
}

function SectionHeader({ title, subtitle, href }: { title: string; subtitle?: string; href?: string }) {
  return (
    <div className="flex items-end justify-between mb-4">
      <div>
        <h2 className="text-lg font-black text-white">{title}</h2>
        {subtitle && <p className="text-xs text-[#8E8E93] mt-0.5">{subtitle}</p>}
      </div>
      {href && (
        <Link href={href} className="text-xs font-semibold text-[#6C63FF] hover:text-[#8B83FF] transition-colors">
          See all →
        </Link>
      )}
    </div>
  );
}

function SkeletonRow() {
  return (
    <HScroll>
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex-none w-[140px] sm:w-[160px]">
          <div className="aspect-square rounded-xl bg-[#141414] animate-pulse mb-2.5" />
          <div className="h-3 bg-[#141414] rounded animate-pulse mb-1.5" />
          <div className="h-2.5 bg-[#141414] rounded animate-pulse w-2/3" />
        </div>
      ))}
    </HScroll>
  );
}

export default function AppHome() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [topSongs, setTopSongs] = useState<any[]>([]);
  const [newAlbums, setNewAlbums] = useState<any[]>([]);
  const [newSongs, setNewSongs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<User | null>(null);
  const [communityItems, setCommunityItems] = useState<any[]>([]);
  const [friendsPicks, setFriendsPicks] = useState<any[]>([]);
  const [hotRange, setHotRange] = useState<any[]>([]);
  const [modalItem, setModalItem] = useState<ModalItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const open = (item: ModalItem) => { setModalItem(item); setModalOpen(true); };

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        const { data: p } = await supabase.from('profiles')
          .select('id, handle, display_name, avatar_url').eq('id', data.user.id).single();
        setMe(p as User);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_ev, session) => {
      if (session?.user) {
        const { data: p } = await supabase.from('profiles')
          .select('id, handle, display_name, avatar_url').eq('id', session.user.id).single();
        setMe(p as User);
      } else setMe(null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!me) return;
    supabase.from('user_rankings')
      .select('item_id, title, artist, artwork_url, rating')
      .eq('user_id', me.id).gte('rating', 8).not('title', 'is', null)
      .order('rating', { ascending: false }).limit(20)
      .then(({ data }) => { if (data) setHotRange(data); });
  }, [me]);

  useEffect(() => {
    supabase.from('user_rankings')
      .select('item_id, title, artist, artwork_url, rating, user_id')
      .gte('rating', 8).not('title', 'is', null)
      .order('rating', { ascending: false }).limit(20)
      .then(({ data }) => { if (data) setCommunityItems(data as any[]); });
  }, []);

  useEffect(() => {
    if (!me) return;
    supabase.from('follows').select('following_id').eq('follower_id', me.id)
      .then(async ({ data: follows }) => {
        if (!follows?.length) return;
        const ids = follows.map((f: any) => f.following_id);
        const { data } = await supabase.from('user_rankings')
          .select('item_id, title, artist, artwork_url, rating, user_id, profiles(handle, display_name)')
          .in('user_id', ids).gte('rating', 8).not('title', 'is', null)
          .order('rating', { ascending: false }).limit(20);
        if (data) setFriendsPicks(data as any[]);
      });
  }, [me]);

  useEffect(() => {
    const mapEntry = (e: any) => ({
      id: e.id?.attributes?.['im:id'] ?? '',
      title: e['im:name']?.label ?? '',
      artist: e['im:artist']?.label ?? '',
      artwork: getArtworkHiRes(e['im:image']?.[2]?.label ?? ''),
    });
    Promise.all([
      fetch('https://itunes.apple.com/us/rss/topsongs/limit=25/json').then(r => r.json()),
      fetch('https://itunes.apple.com/us/rss/topalbums/limit=25/json').then(r => r.json()),
      fetch('https://itunes.apple.com/us/rss/newmusic/limit=25/json').then(r => r.json()),
    ]).then(([songs, albums, newmus]) => {
      setTopSongs((songs?.feed?.entry ?? []).map(mapEntry));
      setNewAlbums((albums?.feed?.entry ?? []).map(mapEntry));
      setNewSongs((newmus?.feed?.entry ?? []).map(mapEntry));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

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

  return (
    <AppShell>
      {/* Top bar */}
      <div className="sticky top-0 z-20 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/[0.06] px-4 py-3">
        <div className="relative max-w-lg">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#48484A]" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input
            value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search songs, albums, artists…"
            className="w-full bg-[#1c1c1e] border border-white/[0.08] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-[#48484A] outline-none focus:border-[#6C63FF]/40 transition-colors"
          />
          {searching && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-[#6C63FF]/30 border-t-[#6C63FF] rounded-full animate-spin" />}
        </div>
      </div>

      {query ? (
        /* ── Search results ── */
        <div className="px-4 py-6">
          <p className="text-xs text-[#8E8E93] mb-5">{results.length} results for &ldquo;{query}&rdquo;</p>
          <div className="space-y-1">
            {results.map((r: any, i: number) => {
              const isAlbum = r.wrapperType === 'collection' || !r.trackId;
              const id = r.trackId ?? r.collectionId;
              const title = r.trackName ?? r.collectionName ?? '';
              const art = getArtworkHiRes(r.artworkUrl100 ?? '');
              return (
                <button key={`sr-${i}-${id}`} onClick={() => open({ id: toItemId(String(id), isAlbum ? 'album' : 'song'), title, artist: r.artistName ?? '', artwork: art, type: isAlbum ? 'album' : 'song' })}
                  className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-white/[0.04] rounded-xl transition-colors text-left">
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-[#141414] flex-none">
                    {art && <Image src={art} alt={title} fill className="object-cover" unoptimized />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{title}</p>
                    <p className="text-xs text-[#8E8E93] truncate">{r.artistName}</p>
                  </div>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[#1c1c1e] text-[#8E8E93] flex-none">
                    {isAlbum ? 'Album' : 'Song'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="px-4 py-6 space-y-10 max-w-5xl">

          {/* Hot Range — my top picks */}
          {hotRange.length > 0 && (
            <section>
              <SectionHeader title="🔥 Hot Range" subtitle="Your top-rated music" href="/ranked" />
              <div className="bg-[#0d0d0d] rounded-2xl border border-white/[0.05] overflow-hidden divide-y divide-white/[0.04]">
                {hotRange.slice(0, 8).map((item: any, i: number) => (
                  <HotRangeRow key={`hr-${i}-${item.item_id}`} item={item} rank={i + 1}
                    onClick={() => open({ id: item.item_id, title: item.title, artist: item.artist, artwork: item.artwork_url ?? '', type: item.item_id?.startsWith('itunes:alb:') ? 'album' : 'song' })} />
                ))}
              </div>
            </section>
          )}

          {/* Friends' Picks */}
          {friendsPicks.length > 0 && (
            <section>
              <SectionHeader title="Friends&apos; Picks" subtitle="Rated 8+ by people you follow" />
              <HScroll>
                {friendsPicks.map((item: any, i: number) => (
                  <MusicTile
                    key={`fp-${i}`}
                    artwork={item.artwork_url ?? ''}
                    title={item.title}
                    artist={item.artist}
                    rating={item.rating}
                    badge={`@${(item.profiles as any)?.handle ?? ''}`}
                    onClick={() => open({ id: item.item_id, title: item.title, artist: item.artist, artwork: item.artwork_url ?? '', type: item.item_id?.startsWith('itunes:alb:') ? 'album' : 'song' })}
                  />
                ))}
              </HScroll>
            </section>
          )}

          {/* Community Picks */}
          {communityItems.length > 0 && (
            <section>
              <SectionHeader title="Community Picks" subtitle="Highly rated by Lyra users" />
              <HScroll>
                {communityItems.map((item: any, i: number) => (
                  <MusicTile
                    key={`cp-${i}`}
                    artwork={item.artwork_url ?? ''}
                    title={item.title}
                    artist={item.artist}
                    rating={item.rating}
                    onClick={() => open({ id: item.item_id, title: item.title, artist: item.artist, artwork: item.artwork_url ?? '', type: item.item_id?.startsWith('itunes:alb:') ? 'album' : 'song' })}
                  />
                ))}
              </HScroll>
            </section>
          )}

          {/* New Albums */}
          <section>
            <SectionHeader title="New Albums" subtitle="Latest releases" href="/music" />
            {loading ? <SkeletonRow /> : (
              <HScroll>
                {newAlbums.map((a: any, i: number) => (
                  <MusicTile
                    key={`na-${i}-${a.id}`}
                    artwork={a.artwork} title={a.title} artist={a.artist}
                    onClick={() => open({ id: toItemId(a.id, 'album'), title: a.title, artist: a.artist, artwork: a.artwork, type: 'album' })}
                  />
                ))}
              </HScroll>
            )}
          </section>

          {/* New Music */}
          <section>
            <SectionHeader title="New Music" subtitle="Fresh drops" />
            {loading ? <SkeletonRow /> : (
              <HScroll>
                {newSongs.map((s: any, i: number) => (
                  <MusicTile
                    key={`nm-${i}-${s.id}`}
                    artwork={s.artwork} title={s.title} artist={s.artist}
                    onClick={() => open({ id: toItemId(s.id, 'song'), title: s.title, artist: s.artist, artwork: s.artwork, type: 'song' })}
                  />
                ))}
              </HScroll>
            )}
          </section>

          {/* Top 50 US */}
          <section>
            <SectionHeader title="🇺🇸 Top 50 US" subtitle="iTunes charts right now" />
            {loading ? <SkeletonRow /> : (
              <HScroll>
                {topSongs.map((s: any, i: number) => (
                  <MusicTile
                    key={`ts-${i}-${s.id}`}
                    artwork={s.artwork} title={s.title} artist={s.artist} rank={i + 1}
                    onClick={() => open({ id: toItemId(s.id, 'song'), title: s.title, artist: s.artist, artwork: s.artwork, type: 'song' })}
                  />
                ))}
              </HScroll>
            )}
          </section>

        </div>
      )}

      <RatingModal open={modalOpen} onClose={() => setModalOpen(false)} item={modalItem} userId={me?.id ?? null} />
    </AppShell>
  );
}
