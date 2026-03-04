'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import AppShell from '@/components/AppShell';
import RatingModal, { type ModalItem } from '@/components/RatingModal';
import { supabase } from '@/lib/supabase';
import { ratingColor } from '@/lib/ratingColor';

function getHiRes(url: string) { return url?.replace('100x100bb', '600x600bb') ?? ''; }

export default function AlbumPage() {
  const params = useParams();
  const router = useRouter();
  const albumId = params.id as string;
  const [album, setAlbum] = useState<any>(null);
  const [tracks, setTracks] = useState<any[]>([]);
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
    if (!albumId) return;
    const fetchAlbum = async () => {
      setLoading(true);
      try {
        const res = await fetch(`https://itunes.apple.com/lookup?id=${albumId}&entity=song`);
        const data = await res.json();
        const results = data.results ?? [];
        const albumInfo = results.find((r: any) => r.wrapperType === 'collection');
        const songList = results.filter((r: any) => r.wrapperType === 'track');
        setAlbum(albumInfo);
        setTracks(songList);
      } catch (e) {
        console.error('Album fetch failed', e);
      }
      setLoading(false);
    };
    fetchAlbum();
  }, [albumId]);

  // Load user ratings
  useEffect(() => {
    if (!userId || tracks.length === 0) return;
    const ids = [
      `itunes:alb:${albumId}`,
      ...tracks.map(t => `itunes:trk:${t.trackId}`),
    ];
    supabase.from('rankings').select('item_id, rating').eq('user_id', userId).in('item_id', ids)
      .then(({ data }) => {
        const map: Record<string, number> = {};
        (data ?? []).forEach((r: any) => { map[r.item_id] = r.rating; });
        setRatings(map);
      });
  }, [userId, tracks, albumId]);

  const [hov, setHov] = useState<string | null>(null);
  const albumRating = ratings[`itunes:alb:${albumId}`];
  const albumCol = albumRating ? ratingColor(albumRating) : null;

  return (
    <AppShell>
      <style>{`
        .album-hero { display: flex; align-items: flex-end; gap: 24px; }
        .album-art { width: 180px; height: 180px; }
        .album-section { padding: 24px 32px 80px; }
        @media (max-width: 768px) {
          .album-hero { flex-direction: column; align-items: center; text-align: center; gap: 16px; }
          .album-art { width: 160px; height: 160px; }
          .album-section { padding: 16px 16px 80px; }
        }
      `}</style>
      <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}>

        {/* Hero */}
        <div style={{ position: 'relative', padding: '48px 24px 32px', background: 'linear-gradient(180deg, rgba(108,99,255,0.12) 0%, transparent 100%)' }}>
          {loading ? (
            <div className="album-hero">
              <div className="album-art" style={{ borderRadius: 16, background: '#1c1c1e' }} />
              <div><div style={{ width: 200, height: 20, background: '#1c1c1e', borderRadius: 4, marginBottom: 8 }} /><div style={{ width: 120, height: 14, background: '#1c1c1e', borderRadius: 4 }} /></div>
            </div>
          ) : album ? (
            <div className="album-hero">
              <div className="album-art" style={{ borderRadius: 16, overflow: 'hidden', background: '#1c1c1e', position: 'relative', flexShrink: 0, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
                <Image src={getHiRes(album.artworkUrl100)} alt={album.collectionName} fill style={{ objectFit: 'cover' }} unoptimized sizes="180px" />
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>Album</p>
                <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px', marginBottom: 4 }}>{album.collectionName}</h1>
                <p onClick={() => router.push(`/artist/${encodeURIComponent(album.artistName)}`)}
                  style={{ fontSize: 15, color: '#6C63FF', fontWeight: 600, cursor: 'pointer', marginBottom: 8 }}>{album.artistName}</p>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
                    {album.releaseDate ? new Date(album.releaseDate).getFullYear() : ''} · {tracks.length} tracks
                    {album.primaryGenreName ? ` · ${album.primaryGenreName}` : ''}
                  </span>
                  {albumCol && <span style={{ padding: '2px 8px', borderRadius: 6, background: albumCol + '1a', border: `1px solid ${albumCol}30`, color: albumCol, fontSize: 12, fontWeight: 900 }}>{albumRating.toFixed(1)}</span>}
                </div>
                <button onClick={() => open({ id: `itunes:alb:${albumId}`, title: album.collectionName, artist: album.artistName, artwork: getHiRes(album.artworkUrl100), type: 'album' })}
                  style={{ marginTop: 12, padding: '8px 20px', borderRadius: 100, background: '#6C63FF', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  ★ Rate Album
                </button>
              </div>
            </div>
          ) : (
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Album not found</p>
          )}
        </div>

        {/* Tracklist */}
        <div className="album-section">
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 16, letterSpacing: '-0.3px' }}>Tracklist</h2>
          <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden' }}>
            {loading ? (
              [...Array(10)].map((_, i) => (
                <div key={`sk-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px' }}>
                  <div style={{ width: 24 }} />
                  <div style={{ flex: 1 }}><div style={{ width: '50%', height: 12, background: '#1c1c1e', borderRadius: 4 }} /></div>
                </div>
              ))
            ) : tracks.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '32px 0', color: 'rgba(255,255,255,0.25)', fontSize: 14 }}>No tracks found</p>
            ) : (
              tracks.map((t: any, i: number) => {
                const rid = `itunes:trk:${t.trackId}`;
                const r = ratings[rid];
                const col = r ? ratingColor(r) : null;
                const dur = t.trackTimeMillis ? `${Math.floor(t.trackTimeMillis / 60000)}:${String(Math.floor((t.trackTimeMillis % 60000) / 1000)).padStart(2, '0')}` : '';
                return (
                  <button key={`at-${i}-${t.trackId}`}
                    onClick={() => open({ id: rid, title: t.trackName, artist: t.artistName, artwork: getHiRes(t.artworkUrl100), type: 'song' })}
                    onMouseEnter={() => setHov(String(t.trackId))} onMouseLeave={() => setHov(null)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '10px 20px', background: hov === String(t.trackId) ? 'rgba(255,255,255,0.04)' : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s' }}>
                    <span style={{ width: 24, textAlign: 'right', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.2)', flexShrink: 0 }}>{t.trackNumber ?? i + 1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.trackName}</p>
                    </div>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', flexShrink: 0 }}>{dur}</span>
                    {col && <div style={{ flexShrink: 0, padding: '3px 9px', borderRadius: 7, background: col + '1a', border: `1px solid ${col}30`, color: col, fontSize: 12, fontWeight: 900 }}>{(r ?? 0).toFixed(1)}</div>}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      <RatingModal open={modalOpen} onClose={() => setModalOpen(false)} item={modalItem} userId={userId} />
    </AppShell>
  );
}
