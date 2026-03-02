'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getArtworkHiRes } from '@/lib/itunes';
import RatingModal, { type ModalItem } from '@/components/RatingModal';
import SectionHeader from '@/components/SectionHeader';
import MusicCard from '@/components/MusicCard';
import AppShell from '@/components/AppShell';

type User = { id: string; handle: string; display_name: string; avatar_url: string | null };

function toItemId(itunesId: string, type: 'song' | 'album') {
  return type === 'album' ? `itunes:alb:${itunesId}` : `itunes:trk:${itunesId}`;
}

function Skeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
      {[...Array(5)].map((_, i) => <div key={i} className="bg-[#141414] rounded-2xl aspect-square animate-pulse" />)}
    </div>
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

  // Auth
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        const { data: p } = await supabase.from('profiles')
          .select('id, handle, display_name, avatar_url').eq('id', data.user.id).single();
        setMe(p as User);
      }
    });
  }, []);

  // Hot range — own 8+ ratings
  useEffect(() => {
    if (!me) return;
    supabase.from('user_rankings')
      .select('item_id, title, artist, artwork_url, rating')
      .eq('user_id', me.id).gte('rating', 8).not('title', 'is', null)
      .order('rating', { ascending: false }).limit(10)
      .then(({ data }) => { if (data) setHotRange(data); });
  }, [me]);

  // Community picks
  useEffect(() => {
    supabase.from('user_rankings')
      .select('item_id, title, artist, artwork_url, rating, profiles(handle)')
      .gte('rating', 8).not('title', 'is', null)
      .order('rating', { ascending: false }).limit(12)
      .then(({ data }) => { if (data) setCommunityItems(data as any[]); });
  }, []);

  // Friends' picks
  useEffect(() => {
    if (!me) return;
    supabase.from('follows').select('following_id').eq('follower_id', me.id)
      .then(async ({ data: follows }) => {
        if (!follows?.length) return;
        const ids = follows.map((f: any) => f.following_id);
        const { data } = await supabase.from('user_rankings')
          .select('item_id, title, artist, artwork_url, rating, profiles(handle)')
          .in('user_id', ids).gte('rating', 8).not('title', 'is', null)
          .order('rating', { ascending: false }).limit(15);
        if (data) setFriendsPicks(data as any[]);
      });
  }, [me]);

  // iTunes feeds
  useEffect(() => {
    const mapEntry = (e: any) => ({
      id: e.id?.attributes?.['im:id'] ?? '',
      title: e['im:name']?.label ?? '',
      artist: e['im:artist']?.label ?? '',
      artwork: getArtworkHiRes(e['im:image']?.[2]?.label ?? ''),
    });
    Promise.all([
      fetch('https://itunes.apple.com/us/rss/topsongs/limit=20/json').then(r => r.json()),
      fetch('https://itunes.apple.com/us/rss/topalbums/limit=20/json').then(r => r.json()),
      fetch('https://itunes.apple.com/us/rss/newmusic/limit=20/json').then(r => r.json()),
    ]).then(([songs, albums, newmus]) => {
      setTopSongs((songs?.feed?.entry ?? []).map(mapEntry));
      setNewAlbums((albums?.feed?.entry ?? []).map(mapEntry));
      setNewSongs((newmus?.feed?.entry ?? []).map(mapEntry));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Search
  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song,album&limit=24`);
      const data = await res.json();
      setResults(data?.results ?? []);
      setSearching(false);
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <AppShell>
      {/* Search bar */}
      <div className="sticky top-0 z-20 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/[0.06] px-4 py-3">
        <div className="relative max-w-xl">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#48484A]" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input
            value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search songs, albums, artists…"
            className="w-full bg-[#1c1c1e] border border-white/[0.08] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-[#48484A] outline-none focus:border-[#6C63FF]/40 transition-colors"
          />
          {searching && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-[#6C63FF]/30 border-t-[#6C63FF] rounded-full animate-spin" />}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-10">
        {query ? (
          // ── Search results ──
          <div>
            <p className="text-xs text-[#8E8E93] mb-4">{results.length} results for &ldquo;{query}&rdquo;</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {results.map((r: any) => {
                const isAlbum = r.wrapperType === 'collection' || !r.trackId;
                const id = r.trackId ?? r.collectionId;
                const title = r.trackName ?? r.collectionName ?? '';
                const art = getArtworkHiRes(r.artworkUrl100 ?? '');
                return (
                  <MusicCard key={`s-${id}`} artwork={art} title={title} artist={r.artistName ?? ''}
                    onClick={() => open({ id: toItemId(String(id), isAlbum ? 'album' : 'song'), title, artist: r.artistName ?? '', artwork: art, type: isAlbum ? 'album' : 'song' })} />
                );
              })}
            </div>
          </div>
        ) : (
          <>
            {/* Hot Range */}
            {hotRange.length > 0 && (
              <section>
                <SectionHeader title="🔥 Hot Range" subtitle="Your top-rated" />
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {hotRange.map((item: any) => (
                    <MusicCard key={`hr-${item.item_id}`} artwork={item.artwork_url ?? ''} title={item.title} artist={item.artist} rating={item.rating}
                      onClick={() => open({ id: item.item_id, title: item.title, artist: item.artist, artwork: item.artwork_url ?? '', type: item.item_id.startsWith('itunes:alb:') ? 'album' : 'song' })} />
                  ))}
                </div>
              </section>
            )}

            {/* Friends' Picks */}
            {friendsPicks.length > 0 && (
              <section>
                <SectionHeader title="Friends' Picks" subtitle="Rated 8+ by people you follow" />
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {friendsPicks.map((item: any, i: number) => (
                    <MusicCard key={`fp-${i}-${item.item_id}`} artwork={item.artwork_url ?? ''} title={item.title} artist={item.artist} rating={item.rating}
                      badge={`@${(item.profiles as any)?.handle}`}
                      onClick={() => open({ id: item.item_id, title: item.title, artist: item.artist, artwork: item.artwork_url ?? '', type: item.item_id.startsWith('itunes:alb:') ? 'album' : 'song' })} />
                  ))}
                </div>
              </section>
            )}

            {/* Community Picks */}
            {communityItems.length > 0 && (
              <section>
                <SectionHeader title="Community Picks" subtitle="Highly rated by Lyra users" />
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {communityItems.map((item: any, i: number) => (
                    <MusicCard key={`cp-${i}-${item.item_id}`} artwork={item.artwork_url ?? ''} title={item.title} artist={item.artist} rating={item.rating}
                      onClick={() => open({ id: item.item_id, title: item.title, artist: item.artist, artwork: item.artwork_url ?? '', type: item.item_id.startsWith('itunes:alb:') ? 'album' : 'song' })} />
                  ))}
                </div>
              </section>
            )}

            {/* New Albums */}
            <section>
              <SectionHeader title="New Albums" />
              {loading ? <Skeleton /> : (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {newAlbums.slice(0, 10).map((a: any) => (
                    <MusicCard key={`na-${a.id}`} artwork={a.artwork} title={a.title} artist={a.artist}
                      onClick={() => open({ id: toItemId(a.id, 'album'), title: a.title, artist: a.artist, artwork: a.artwork, type: 'album' })} />
                  ))}
                </div>
              )}
            </section>

            {/* New Music */}
            <section>
              <SectionHeader title="New Music" subtitle="Fresh releases" />
              {loading ? <Skeleton /> : (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {newSongs.slice(0, 10).map((s: any) => (
                    <MusicCard key={`nm-${s.id}`} artwork={s.artwork} title={s.title} artist={s.artist}
                      onClick={() => open({ id: toItemId(s.id, 'song'), title: s.title, artist: s.artist, artwork: s.artwork, type: 'song' })} />
                  ))}
                </div>
              )}
            </section>

            {/* Top 50 US */}
            <section>
              <SectionHeader title="🇺🇸 Top 50 US" subtitle="iTunes charts" />
              {loading ? <Skeleton /> : (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {topSongs.slice(0, 10).map((s: any, i: number) => (
                    <MusicCard key={`ts-${s.id}`} artwork={s.artwork} title={s.title} artist={s.artist} rank={i + 1}
                      onClick={() => open({ id: toItemId(s.id, 'song'), title: s.title, artist: s.artist, artwork: s.artwork, type: 'song' })} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      <RatingModal open={modalOpen} onClose={() => setModalOpen(false)} item={modalItem} userId={me?.id ?? null} />
    </AppShell>
  );
}
