'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import AppShell from '@/components/AppShell';
import RatingModal, { type ModalItem } from '@/components/RatingModal';
import { supabase } from '@/lib/supabase';
import { ratingColor } from '@/lib/ratingColor';

function getHiRes(url: string) { return url?.replace('100x100bb', '600x600bb') ?? ''; }
function getMedRes(url: string) { return url?.replace('100x100bb', '300x300bb') ?? ''; }

export default function ArtistPage() {
  const params = useParams();
  const artistName = decodeURIComponent(params.name as string);
  const [topSongs, setTopSongs] = useState<any[]>([]);
  const [albums, setAlbums] = useState<any[]>([]);
  const [artistImg, setArtistImg] = useState('');
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [modalItem, setModalItem] = useState<ModalItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const open = (item: ModalItem) => { setModalItem(item); setModalOpen(true); };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((ev, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!artistName) return;
    const fetchArtist = async () => {
      setLoading(true);
      try {
        // Search iTunes for songs by this artist
        const songRes = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(artistName)}&entity=song&limit=25&attribute=artistTerm`);
        const songData = await songRes.json();
        const songs = (songData.results ?? []).filter((r: any) => r.wrapperType === 'track');

        // Search iTunes for albums by this artist
        const albumRes = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(artistName)}&entity=album&limit=20&attribute=artistTerm`);
        const albumData = await albumRes.json();
        const albs = (albumData.results ?? []).filter((r: any) => r.wrapperType === 'collection');

        // Artist image from first result
        if (songs.length > 0) {
          setArtistImg(getHiRes(songs[0].artworkUrl100));
        } else if (albs.length > 0) {
          setArtistImg(getHiRes(albs[0].artworkUrl100));
        }

        setTopSongs(songs.map((s: any) => ({
          id: String(s.trackId),
          title: s.trackName,
          artist: s.artistName,
          album: s.collectionName,
          artwork: getHiRes(s.artworkUrl100),
        })));

        // Deduplicate albums by collectionId
        const seen = new Set<number>();
        const uniqueAlbs = albs.filter((a: any) => {
          if (seen.has(a.collectionId)) return false;
          seen.add(a.collectionId);
          return true;
        });

        setAlbums(uniqueAlbs.map((a: any) => ({
          id: String(a.collectionId),
          title: a.collectionName,
          artist: a.artistName,
          artwork: getHiRes(a.artworkUrl100),
          year: a.releaseDate ? new Date(a.releaseDate).getFullYear() : null,
          trackCount: a.trackCount,
        })));
      } catch (e) {
        console.error('Artist fetch failed', e);
      }
      setLoading(false);
    };
    fetchArtist();
  }, [artistName]);

  // Load user ratings for these items
  useEffect(() => {
    if (!userId || (topSongs.length === 0 && albums.length === 0)) return;
    const ids = [
      ...topSongs.map(s => `itunes:trk:${s.id}`),
      ...albums.map(a => `itunes:alb:${a.id}`),
    ];
    supabase.from('rankings').select('item_id, rating').eq('user_id', userId).in('item_id', ids)
      .then(({ data }) => {
        const map: Record<string, number> = {};
        (data ?? []).forEach((r: any) => { map[r.item_id] = r.rating; });
        setRatings(map);
      });
  }, [userId, topSongs, albums]);

  const [hov, setHov] = useState<string | null>(null);

  return (
    <AppShell>
      <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}>

        {/* Hero */}
        <div style={{ position: 'relative', padding: '60px 32px 32px', background: 'linear-gradient(180deg, rgba(108,99,255,0.15) 0%, transparent 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 24 }}>
            <div style={{ width: 140, height: 140, borderRadius: 16, overflow: 'hidden', background: '#1c1c1e', position: 'relative', flexShrink: 0, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
              {artistImg && <Image src={artistImg} alt={artistName} fill style={{ objectFit: 'cover' }} unoptimized sizes="140px" />}
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>Artist</p>
              <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px', marginBottom: 6 }}>{artistName}</h1>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
                {topSongs.length > 0 ? `${topSongs.length} songs` : ''}{topSongs.length > 0 && albums.length > 0 ? ' · ' : ''}{albums.length > 0 ? `${albums.length} albums` : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Top Songs */}
        <div style={{ padding: '24px 32px' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 16, letterSpacing: '-0.3px' }}>Top Songs</h2>
          <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden' }}>
            {loading ? (
              [...Array(8)].map((_, i) => (
                <div key={`sk-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 20px' }}>
                  <div style={{ width: 28 }} />
                  <div style={{ width: 44, height: 44, background: '#1c1c1e', borderRadius: 8 }} />
                  <div style={{ flex: 1 }}><div style={{ width: '60%', height: 12, background: '#1c1c1e', borderRadius: 4, marginBottom: 6 }} /><div style={{ width: '40%', height: 10, background: '#1c1c1e', borderRadius: 4 }} /></div>
                </div>
              ))
            ) : topSongs.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '32px 0', color: 'rgba(255,255,255,0.25)', fontSize: 14 }}>No songs found</p>
            ) : (
              topSongs.map((s, i) => {
                const rid = `itunes:trk:${s.id}`;
                const r = ratings[rid];
                const col = r ? ratingColor(r) : null;
                return (
                  <button key={`as-${i}-${s.id}`} onClick={() => open({ id: rid, title: s.title, artist: s.artist, artwork: s.artwork, type: 'song' })}
                    onMouseEnter={() => setHov(s.id)} onMouseLeave={() => setHov(null)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '8px 20px', background: hov === s.id ? 'rgba(255,255,255,0.04)' : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s' }}>
                    <span style={{ width: 28, textAlign: 'right', fontSize: 13, fontWeight: 700, color: i < 3 ? '#6C63FF' : 'rgba(255,255,255,0.25)', flexShrink: 0 }}>{i + 1}</span>
                    <div style={{ width: 44, height: 44, borderRadius: 8, overflow: 'hidden', background: '#1c1c1e', flexShrink: 0, position: 'relative' }}>
                      <Image src={s.artwork} alt={s.title} fill style={{ objectFit: 'cover' }} unoptimized sizes="44px" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 1 }}>{s.title}</p>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.album}</p>
                    </div>
                    {col && <div style={{ flexShrink: 0, padding: '3px 9px', borderRadius: 7, background: col + '1a', border: `1px solid ${col}30`, color: col, fontSize: 12, fontWeight: 900 }}>{r.toFixed(1)}</div>}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Albums */}
        {albums.length > 0 && (
          <div style={{ padding: '0 32px 80px' }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 16, letterSpacing: '-0.3px' }}>Albums</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 16 }}>
              {albums.map((a, i) => {
                const rid = `itunes:alb:${a.id}`;
                const r = ratings[rid];
                const col = r ? ratingColor(r) : null;
                return (
                  <button key={`aa-${i}-${a.id}`} onClick={() => open({ id: rid, title: a.title, artist: a.artist, artwork: a.artwork, type: 'album' })}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
                    <div style={{ position: 'relative', width: '100%', aspectRatio: '1', borderRadius: 12, overflow: 'hidden', background: '#1c1c1e', marginBottom: 8 }}>
                      <Image src={a.artwork} alt={a.title} fill style={{ objectFit: 'cover' }} unoptimized sizes="180px" />
                      {col && <div style={{ position: 'absolute', top: 6, right: 6, background: col, color: '#fff', fontSize: 10, fontWeight: 900, padding: '2px 6px', borderRadius: 5 }}>{r.toFixed(1)}</div>}
                    </div>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>{a.title}</p>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{a.year}{a.trackCount ? ` · ${a.trackCount} tracks` : ''}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <RatingModal open={modalOpen} onClose={() => setModalOpen(false)} item={modalItem} userId={userId} />
    </AppShell>
  );
}
