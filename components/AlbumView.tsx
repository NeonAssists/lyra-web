'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ratingColor } from '@/lib/ratingColor';
import { getArtworkHiRes } from '@/lib/itunes';
import type { ModalItem } from './RatingModal';

interface AlbumViewProps {
  open: boolean;
  onClose: () => void;
  albumId: string;
  albumTitle: string;
  albumArtist: string;
  albumArtwork: string;
  userId: string | null;
  onOpenSong: (item: ModalItem) => void;
  onOpenAlbum: (item: ModalItem) => void;
  highlightSongId?: string;
}

const LASTFM_KEY = '7b3ef80111877bb34f01fe2d7163d6ba';

export default function AlbumView({ open, onClose, albumId, albumTitle, albumArtist, albumArtwork, userId, onOpenSong, onOpenAlbum, highlightSongId }: AlbumViewProps) {
  const router = useRouter();
  const [tracks, setTracks] = useState<any[]>([]);
  const [recs, setRecs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratings, setRatings] = useState<Record<string, number>>({});

  // Fetch tracks
  useEffect(() => {
    if (!open || !albumId) return;
    setLoading(true);
    const itunesId = albumId.replace('itunes:alb:', '');
    fetch(`https://itunes.apple.com/lookup?id=${itunesId}&entity=song&limit=50`)
      .then(r => r.json())
      .then(data => {
        const t = (data.results ?? [])
          .filter((r: any) => r.wrapperType === 'track')
          .sort((a: any, b: any) => a.trackNumber - b.trackNumber);
        setTracks(t);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [open, albumId]);

  // Fetch user ratings for tracks
  useEffect(() => {
    if (!open || !userId || !tracks.length) return;
    const ids = tracks.map(t => `itunes:trk:${t.trackId}`);
    (supabase as any).from('user_rankings').select('item_id, rating')
      .eq('user_id', userId).in('item_id', ids).gt('rating', 0)
      .then(({ data }: any) => {
        const m: Record<string, number> = {};
        for (const r of (data ?? [])) m[r.item_id] = r.rating;
        setRatings(m);
      });
  }, [open, userId, tracks]);

  // Fetch similar album recs via Last.fm
  useEffect(() => {
    if (!open || !albumArtist) return;
    fetch(`https://ws.audioscrobbler.com/2.0/?method=artist.getSimilar&artist=${encodeURIComponent(albumArtist)}&limit=6&api_key=${LASTFM_KEY}&format=json`)
      .then(r => r.json())
      .then(async json => {
        const artists = (json?.similarartists?.artist ?? []).map((a: any) => a.name).slice(0, 5);
        const results: any[] = [];
        await Promise.all(artists.map(async (name: string) => {
          try {
            const r = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(name)}&entity=album&media=music&limit=2`);
            const d = await r.json();
            for (const item of (d?.results ?? [])) {
              if (item.wrapperType === 'collection' && `itunes:alb:${item.collectionId}` !== albumId) {
                results.push(item);
              }
            }
          } catch {}
        }));
        setRecs(results.slice(0, 5));
      }).catch(() => {});
  }, [open, albumArtist, albumId]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!open) return null;

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(20px)', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 560, maxHeight: '85vh', background: '#111116', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 32px 80px rgba(0,0,0,0.7)' }}>

        {/* Hero */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <div style={{ width: 72, height: 72, borderRadius: 12, overflow: 'hidden', position: 'relative', flexShrink: 0, background: '#1c1c1e' }}>
            {albumArtwork && <Image src={albumArtwork} alt={albumTitle} fill style={{ objectFit: 'cover' }} unoptimized sizes="72px" />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 18, fontWeight: 800, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3 }}>{albumTitle}</p>
            <p onClick={() => { onClose(); router.push(`/artist/${encodeURIComponent(albumArtist)}`); }}
              style={{ fontSize: 14, color: '#6C63FF', fontWeight: 500, cursor: 'pointer' }}>{albumArtist}</p>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button onClick={() => onOpenSong({ id: albumId, title: albumTitle, artist: albumArtist, artwork: albumArtwork, type: 'album' })}
                style={{ padding: '5px 12px', borderRadius: 8, background: '#6C63FF', border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                ★ Rate Album
              </button>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>×</button>
        </div>

        {/* Tracklist + Recs */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {loading ? (
            <div style={{ padding: '40px 24px', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>Loading tracks…</div>
          ) : tracks.length === 0 ? (
            <div style={{ padding: '40px 24px', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>No tracks found</div>
          ) : (
            <>
              {tracks.map((t, i) => {
                const songId = `itunes:trk:${t.trackId}`;
                const isHighlighted = highlightSongId === songId;
                const userRating = ratings[songId];
                const duration = t.trackTimeMillis
                  ? `${Math.floor(t.trackTimeMillis / 60000)}:${String(Math.floor((t.trackTimeMillis % 60000) / 1000)).padStart(2, '0')}`
                  : null;
                return (
                  <button key={`trk-${i}-${t.trackId}`} onClick={() => onOpenSong({
                    id: songId,
                    title: t.trackName,
                    artist: t.artistName,
                    artwork: getArtworkHiRes(t.artworkUrl100 ?? albumArtwork),
                    type: 'song',
                  })}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '10px 24px', background: isHighlighted ? 'rgba(108,99,255,0.08)' : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s' }}
                    onMouseEnter={e => { if (!isHighlighted) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                    onMouseLeave={e => { if (!isHighlighted) e.currentTarget.style.background = 'transparent'; }}>
                    <span style={{ width: 24, fontSize: 13, color: isHighlighted ? '#6C63FF' : 'rgba(255,255,255,0.25)', fontWeight: 600, textAlign: 'right', flexShrink: 0 }}>{t.trackNumber}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 500, color: isHighlighted ? '#6C63FF' : '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 1 }}>{t.trackName}</p>
                      {duration && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>{duration}</p>}
                    </div>
                    {userRating && (
                      <div style={{ padding: '3px 8px', borderRadius: 6, background: ratingColor(userRating) + '18', border: `1px solid ${ratingColor(userRating)}33`, color: ratingColor(userRating), fontSize: 12, fontWeight: 800, flexShrink: 0 }}>
                        {userRating.toFixed(1)}
                      </div>
                    )}
                  </button>
                );
              })}
            </>
          )}

          {/* Similar album recs */}
          {recs.length > 0 && (
            <div style={{ padding: '24px 24px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 8 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 14 }}>You might also like</p>
              <div style={{ display: 'flex', gap: 12, overflowX: 'auto' }}>
                {recs.map((rec: any, i: number) => (
                  <button key={`arec-${i}-${rec.collectionId}`}
                    onClick={() => onOpenAlbum({
                      id: `itunes:alb:${rec.collectionId}`,
                      title: rec.collectionName,
                      artist: rec.artistName,
                      artwork: getArtworkHiRes(rec.artworkUrl100 ?? ''),
                      type: 'album',
                    })}
                    style={{ flexShrink: 0, width: 110, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
                    <div style={{ width: 110, height: 110, borderRadius: 10, overflow: 'hidden', position: 'relative', background: '#1c1c1e', marginBottom: 6 }}>
                      <Image src={getArtworkHiRes(rec.artworkUrl100 ?? '')} alt={rec.collectionName} fill style={{ objectFit: 'cover' }} unoptimized sizes="110px" />
                    </div>
                    <p style={{ fontSize: 11, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rec.collectionName}</p>
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rec.artistName}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
