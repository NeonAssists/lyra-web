'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { searchItunes, getArtworkHiRes, ratingColor } from '@/lib/itunes';

type User = { id: string; handle: string; display_name: string; avatar_url: string | null };
type CommunityItem = { item_id: string; title: string; artist: string; artwork_url: string; rating: number; handle: string };

export default function AppHome() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [topSongs, setTopSongs] = useState<any[]>([]);
  const [newAlbums, setNewAlbums] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [communityItems, setCommunityItems] = useState<CommunityItem[]>([]);

  // Auth + profile
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, handle, display_name, avatar_url')
          .eq('id', data.user.id)
          .single();
        setMe(profile as User);
      }
      setAuthLoading(false);
    });
  }, []);

  // iTunes feeds
  useEffect(() => {
    Promise.all([
      fetch('https://itunes.apple.com/us/rss/topsongs/limit=20/json').then(r => r.json()),
      fetch('https://itunes.apple.com/us/rss/topalbums/limit=20/json').then(r => r.json()),
    ]).then(([songs, albums]) => {
      setTopSongs((songs?.feed?.entry ?? []).map((e: any) => ({
        id: e.id?.attributes?.['im:id'],
        title: e['im:name']?.label ?? '',
        artist: e['im:artist']?.label ?? '',
        artwork: getArtworkHiRes(e['im:image']?.[2]?.label ?? ''),
      })));
      setNewAlbums((albums?.feed?.entry ?? []).map((e: any) => ({
        id: e.id?.attributes?.['im:id'],
        title: e['im:name']?.label ?? '',
        artist: e['im:artist']?.label ?? '',
        artwork: getArtworkHiRes(e['im:image']?.[2]?.label ?? ''),
      })));
      setLoading(false);
    });
  }, []);

  // Community picks — highly rated items from all users
  useEffect(() => {
    supabase
      .from('user_rankings')
      .select('item_id, title, artist, artwork_url, rating, profiles(handle)')
      .gte('rating', 8)
      .not('title', 'is', null)
      .order('rating', { ascending: false })
      .limit(12)
      .then(({ data }) => {
        if (data) {
          setCommunityItems(data.map((r: any) => ({
            item_id: r.item_id,
            title: r.title,
            artist: r.artist,
            artwork_url: r.artwork_url,
            rating: r.rating,
            handle: r.profiles?.handle ?? '?',
          })));
        }
      });
  }, []);

  // Search
  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      const data = await searchItunes(query, 'song,album,musicArtist', 24);
      setResults(data?.results ?? []);
      setSearching(false);
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  const initials = me ? (me.display_name ?? me.handle).slice(0, 2).toUpperCase() : '';

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-24 md:pb-8">
      {/* Top nav */}
      <nav className="sticky top-0 z-40 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/[0.06] px-4 py-3 flex items-center gap-3">
        <Link href="/" className="text-lg font-black tracking-tight">Lyra</Link>
        <div className="flex-1 relative">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search songs, albums, artists…"
            className="w-full bg-[#1c1c1e] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#48484A] outline-none focus:border-[#6C63FF]/40 transition-colors"
          />
          {searching && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-[#6C63FF]/30 border-t-[#6C63FF] rounded-full animate-spin" />}
        </div>
        {!authLoading && (
          me ? (
            <Link href={`/u/${me.handle}`} className="flex-shrink-0">
              {me.avatar_url ? (
                <div className="relative w-8 h-8 rounded-full overflow-hidden">
                  <Image src={me.avatar_url} alt={me.display_name} fill className="object-cover" unoptimized />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#6C63FF] flex items-center justify-center text-xs font-bold">
                  {initials}
                </div>
              )}
            </Link>
          ) : (
            <Link href="/login" className="flex-shrink-0 text-sm font-semibold text-[#6C63FF]">
              Sign in
            </Link>
          )
        )}
      </nav>

      <div className="max-w-4xl mx-auto px-4 pt-4">
        {query ? (
          <div>
            <p className="text-xs text-[#8E8E93] mb-4">{results.length} results for &quot;{query}&quot;</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {results.map((r: any) => {
                const art = getArtworkHiRes(r.artworkUrl100 ?? '');
                const title = r.trackName ?? r.collectionName ?? r.artistName ?? '';
                const sub = r.artistName ?? '';
                return (
                  <div key={r.trackId ?? r.collectionId ?? r.artistId}
                    className="bg-[#141414] border border-white/[0.06] rounded-2xl overflow-hidden hover:border-[#6C63FF]/40 transition-all hover:scale-[1.02] cursor-pointer group">
                    <div className="relative aspect-square bg-[#1c1c1e]">
                      {art && <img src={art} alt={title} className="w-full h-full object-cover" />}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-2xl font-black text-white">+</span>
                      </div>
                    </div>
                    <div className="p-2.5">
                      <p className="text-xs font-semibold truncate">{title}</p>
                      <p className="text-[11px] text-[#8E8E93] truncate">{sub}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Community Picks */}
            {communityItems.length > 0 && (
              <section>
                <div className="flex items-baseline justify-between mb-4">
                  <h2 className="font-bold text-base">Community Picks</h2>
                  <span className="text-xs text-[#8E8E93]">Rated 8+</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {communityItems.slice(0, 8).map((item, i) => (
                    <Link key={`community-${item.item_id}-${i}`} href={`/u/${item.handle}`}
                      className="bg-[#141414] border border-white/[0.06] rounded-2xl overflow-hidden hover:border-[#6C63FF]/40 transition-all hover:scale-[1.02]">
                      <div className="relative aspect-square bg-[#1c1c1e]">
                        {item.artwork_url && (
                          <Image src={item.artwork_url} alt={item.title} fill className="object-cover" unoptimized sizes="200px" />
                        )}
                        <div className="absolute right-2 top-2 rounded-lg px-2 py-1" style={{ backgroundColor: ratingColor(item.rating) }}>
                          <span className="text-xs font-black text-white">{item.rating.toFixed(1)}</span>
                        </div>
                      </div>
                      <div className="p-2.5">
                        <p className="text-xs font-semibold truncate">{item.title}</p>
                        <p className="text-[11px] text-[#8E8E93] truncate">@{item.handle}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Top Songs */}
            <section>
              <div className="flex items-baseline justify-between mb-4">
                <h2 className="font-bold text-base">🇺🇸 Top Songs</h2>
                <span className="text-xs text-[#8E8E93]">iTunes</span>
              </div>
              {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[...Array(8)].map((_, i) => <div key={i} className="bg-[#141414] rounded-2xl aspect-square animate-pulse" />)}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {topSongs.slice(0, 10).map((song, i) => (
                    <div key={`topsong-${song.id}`} className="bg-[#141414] border border-white/[0.06] rounded-2xl overflow-hidden hover:border-[#6C63FF]/40 transition-all hover:scale-[1.02] cursor-pointer">
                      <div className="relative aspect-square">
                        <img src={song.artwork} alt={song.title} className="w-full h-full object-cover" />
                        <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">{i + 1}</div>
                      </div>
                      <div className="p-2.5">
                        <p className="text-xs font-semibold truncate">{song.title}</p>
                        <p className="text-[11px] text-[#8E8E93] truncate">{song.artist}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* New Albums */}
            <section>
              <div className="flex items-baseline justify-between mb-4">
                <h2 className="font-bold text-base">New Albums</h2>
                <span className="text-xs text-[#8E8E93]">iTunes</span>
              </div>
              {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[...Array(8)].map((_, i) => <div key={i} className="bg-[#141414] rounded-2xl aspect-square animate-pulse" />)}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {newAlbums.slice(0, 10).map((album) => (
                    <div key={`newalbum-${album.id}`} className="bg-[#141414] border border-white/[0.06] rounded-2xl overflow-hidden hover:border-[#6C63FF]/40 transition-all hover:scale-[1.02] cursor-pointer">
                      <div className="aspect-square">
                        <img src={album.artwork} alt={album.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="p-2.5">
                        <p className="text-xs font-semibold truncate">{album.title}</p>
                        <p className="text-[11px] text-[#8E8E93] truncate">{album.artist}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      {/* Mobile bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden bg-[#0a0a0a]/90 backdrop-blur-xl border-t border-white/[0.06] flex items-center justify-around px-6 py-3">
        <Link href="/app" className="flex flex-col items-center gap-1 text-[#6C63FF]">
          <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
          <span className="text-[10px] font-semibold">Home</span>
        </Link>
        <button onClick={() => document.querySelector('input')?.focus()} className="flex flex-col items-center gap-1 text-[#8E8E93]">
          <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <span className="text-[10px] font-semibold">Search</span>
        </button>
        {me ? (
          <Link href={`/u/${me.handle}`} className="flex flex-col items-center gap-1 text-[#8E8E93]">
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <span className="text-[10px] font-semibold">Profile</span>
          </Link>
        ) : (
          <Link href="/login" className="flex flex-col items-center gap-1 text-[#8E8E93]">
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <span className="text-[10px] font-semibold">Sign in</span>
          </Link>
        )}
      </div>
    </div>
  );
}
