'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { ratingColor } from '@/lib/ratingColor';

export interface ModalItem {
  id: string;
  title: string;
  artist: string;
  artwork: string;
  type: 'song' | 'album';
}

interface RatingModalProps {
  open: boolean;
  onClose: () => void;
  item: ModalItem | null;
  userId: string | null;
  onSaved?: () => void;
  onOpenAlbum?: (item: ModalItem) => void;
}

const RATING_TAGS = ['Chill', 'Hype', 'Emotional', 'Classic', 'Underrated', 'Overrated', 'Nostalgic', 'Summer', 'Late Night', 'Gym', 'Road Trip', 'Study'];

function getRatingLabel(r: number): string {
  if (r === 0) return 'Tap to rate';
  if (r <= 2) return 'Poor';
  if (r <= 4) return 'Below Average';
  if (r <= 5.5) return 'Decent';
  if (r <= 7) return 'Good';
  if (r <= 8.5) return 'Great';
  if (r <= 9.5) return 'Excellent';
  return 'Masterpiece';
}

function StreamLink({ icon, label, url }: { icon: string; label: string; url: string }) {
  const [hov, setHov] = useState(false);
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '6px 10px', borderRadius: 10,
        background: hov ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: 600,
        textDecoration: 'none', transition: 'all 0.15s', whiteSpace: 'nowrap',
      }}>
      <span style={{ fontSize: 14 }}>{icon}</span>{label}
    </a>
  );
}

export default function RatingModal({ open, onClose, item, userId, onSaved, onOpenAlbum }: RatingModalProps) {
  const [rating, setRating] = useState(0);
  const [ratingInput, setRatingInput] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [note, setNote] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagsExpanded, setTagsExpanded] = useState(false);
  const [creditsOpen, setCreditsOpen] = useState(false);
  const [credits, setCredits] = useState<{ label: string; names: string[] }[]>([]);
  const [creditsLoading, setCreditsLoading] = useState(false);
  const [liked, setLiked] = useState(false);
  const [listenLater, setListenLater] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [existing, setExisting] = useState<{ rating: number; note?: string; tags?: string[] } | null>(null);
  const [friendRatings, setFriendRatings] = useState<{ handle: string; rating: number; avatar_url?: string }[]>([]);
  const overlayRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load existing data
  useEffect(() => {
    if (!open || !item) {
      setExisting(null); setFriendRatings([]); return;
    }
    setRating(0); setRatingInput(''); setIsEditing(false);
    setNote(''); setSelectedTags([]); setTagsExpanded(false);
    setCreditsOpen(false); setCredits([]); setCreditsLoading(false);
    setSaved(false); setLiked(false); setListenLater(false);

    if (!userId) return;

    // Load user's existing rating + like/later state
    (supabase as any).from('user_rankings')
      .select('rating, note, tags, liked, listen_later')
      .eq('user_id', userId).eq('item_id', item.id).maybeSingle()
      .then(({ data }: any) => {
        if (data) {
          if (data.rating > 0) {
            setExisting(data);
            setRating(data.rating);
            setRatingInput((data.rating ?? 0).toFixed(1));
            setNote(data.note ?? '');
            if (data.tags) setSelectedTags(data.tags);
          }
          setLiked(!!data.liked);
          setListenLater(!!data.listen_later);
        }
      });

    // Load friend ratings
    (async () => {
      try {
        const { data: follows } = await (supabase as any).from('follows').select('followee_id').eq('follower_id', userId);
        if (!follows?.length) return;
        const ids = follows.map((f: any) => f.followee_id);
        const { data: ratings } = await (supabase as any).from('user_rankings')
          .select('user_id, rating').eq('item_id', item.id).in('user_id', ids).gt('rating', 0);
        if (!ratings?.length) return;
        const { data: profiles } = await (supabase as any).from('profiles')
          .select('id, handle, avatar_url').in('id', ids);
        const pMap: Record<string, any> = {};
        (profiles ?? []).forEach((p: any) => { pMap[p.id] = p; });
        setFriendRatings(ratings.map((r: any) => ({
          handle: pMap[r.user_id]?.handle ?? '?',
          rating: r.rating,
          avatar_url: pMap[r.user_id]?.avatar_url,
        })));
      } catch {}
    })();
  }, [open, item?.id, userId]);

  // Fetch credits from Genius when credits panel opens
  useEffect(() => {
    if (!creditsOpen || !item || credits.length > 0) return;
    setCreditsLoading(true);
    const geniusToken = 'QOq2DOUYlcO6KKc--0vv5nP-HWf77mutVRkxsp5LhjqtJamZ7KLURBZDU-TWSNan';
    fetch(`https://api.genius.com/search?q=${encodeURIComponent(item.title + ' ' + item.artist)}&per_page=1`, {
      headers: { Authorization: `Bearer ${geniusToken}` },
    })
      .then(r => r.json())
      .then(async (d) => {
        const hit = d?.response?.hits?.[0]?.result;
        if (!hit?.id) { setCreditsLoading(false); return; }
        const songRes = await fetch(`https://api.genius.com/songs/${hit.id}`, { headers: { Authorization: `Bearer ${geniusToken}` } });
        const songData = await songRes.json();
        const song = songData?.response?.song;
        if (!song) { setCreditsLoading(false); return; }
        const creds: { label: string; names: string[] }[] = [];
        if (song.producer_artists?.length) creds.push({ label: 'Producers', names: song.producer_artists.map((a: any) => a.name) });
        if (song.writer_artists?.length) creds.push({ label: 'Writers', names: song.writer_artists.map((a: any) => a.name) });
        const customPerfs = song.custom_performances;
        if (customPerfs?.length) {
          customPerfs.forEach((cp: any) => {
            if (cp.artists?.length) creds.push({ label: cp.label, names: cp.artists.map((a: any) => a.name) });
          });
        }
        setCredits(creds);
        setCreditsLoading(false);
      })
      .catch(() => setCreditsLoading(false));
  }, [creditsOpen, item?.id]);

  // Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const commitRating = useCallback((text: string) => {
    setIsEditing(false);
    const parsed = parseFloat(text);
    if (isNaN(parsed) || parsed < 1) {
      setRating(0); setRatingInput(''); return;
    }
    const clamped = Math.round(Math.max(1, Math.min(10, parsed)) * 10) / 10;
    setRating(clamped);
    setRatingInput(clamped.toFixed(1));
  }, []);

  const handleRatingTap = useCallback(() => {
    setIsEditing(true);
    setRatingInput(rating > 0 ? rating.toFixed(1) : '');
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [rating]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const handleLike = async () => {
    if (!userId || !item) return;
    const newLiked = !liked;
    setLiked(newLiked);
    await (supabase as any).from('user_rankings').upsert({
      user_id: userId, item_id: item.id, liked: newLiked,
      title: item.title, artist: item.artist, artwork_url: item.artwork, item_type: item.type,
    }, { onConflict: 'user_id,item_id' });
  };

  const handleListenLater = async () => {
    if (!userId || !item) return;
    const newLater = !listenLater;
    setListenLater(newLater);
    await (supabase as any).from('user_rankings').upsert({
      user_id: userId, item_id: item.id, listen_later: newLater,
      title: item.title, artist: item.artist, artwork_url: item.artwork, item_type: item.type,
    }, { onConflict: 'user_id,item_id' });
  };

  const handleSave = async () => {
    if (!userId || !item || rating === 0) return;
    setSaving(true);
    const { error } = await (supabase as any).from('user_rankings').upsert({
      user_id: userId, item_id: item.id, rating,
      note: note.trim() || null, tags: selectedTags.length > 0 ? selectedTags : null,
      title: item.title, artist: item.artist,
      artwork_url: item.artwork, item_type: item.type,
      liked, listen_later: listenLater,
      ranked_at: new Date().toISOString(),
    }, { onConflict: 'user_id,item_id' });
    setSaving(false);
    if (!error) { setSaved(true); onSaved?.(); setTimeout(onClose, 800); }
  };

  const handleRemove = async () => {
    if (!userId || !item) return;
    await (supabase as any).from('user_rankings').delete().eq('user_id', userId).eq('item_id', item.id);
    onSaved?.(); onClose();
  };

  if (!open || !item) return null;
  const col = rating > 0 ? ratingColor(rating) : '#6C63FF';
  const searchQ = encodeURIComponent(`${item.title} ${item.artist}`);
  const itunesId = item.id.replace('itunes:trk:', '').replace('itunes:alb:', '');
  const isAlbum = item.type === 'album';
  const appleMusicUrl = isAlbum ? `https://music.apple.com/album/${itunesId}` : `https://music.apple.com/song/${itunesId}`;

  return (
    <div ref={overlayRef} onClick={e => { if (e.target === overlayRef.current) onClose(); }}
      style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
      <style>{`
        .rm-sheet { max-height: 90vh; width: 100%; max-width: 520px; }
        @media (min-width: 769px) { .rm-sheet { align-self: center; border-radius: 24px !important; max-height: 85vh; } }
        .rm-pill:hover { background: rgba(255,255,255,0.1) !important; }
      `}</style>
      <div className="rm-sheet" style={{
        background: '#141414', borderTopLeftRadius: 24, borderTopRightRadius: 24,
        overflow: 'hidden', boxShadow: '0 -16px 60px rgba(0,0,0,0.6)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
        display: 'flex', flexDirection: 'column',
      }}>

        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10, paddingBottom: 4 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)' }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '8px 18px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', gap: 12 }}>
          <div style={{ width: 48, height: 48, borderRadius: 10, overflow: 'hidden', position: 'relative', flexShrink: 0, cursor: onOpenAlbum ? 'pointer' : 'default', border: onOpenAlbum ? '1.5px solid #6C63FF' : 'none' }}
            onClick={() => onOpenAlbum && item && onOpenAlbum(item)}>
            {item.artwork && <Image src={item.artwork} alt={item.title} fill style={{ objectFit: 'cover' }} unoptimized sizes="48px" />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.2px' }}>{item.title}</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>{item.artist}</p>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>×</button>
        </div>

        {/* Friend ratings */}
        {friendRatings.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px 4px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>Friends:</span>
            {friendRatings.map((fr, i) => (
              <span key={`fr-${i}-${fr.handle}`} style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '4px 8px', borderRadius: 12,
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
              }}>
                {fr.avatar_url
                  ? <img src={fr.avatar_url} style={{ width: 16, height: 16, borderRadius: 8, objectFit: 'cover' }} alt="" />
                  : <span style={{ width: 16, height: 16, borderRadius: 8, background: '#6C63FF44', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, color: '#6C63FF' }}>{fr.handle[0]?.toUpperCase()}</span>}
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>@{fr.handle}</span>
                <span style={{ fontSize: 12, fontWeight: 800, color: ratingColor(fr.rating) }}>{(fr.rating ?? 0).toFixed(1)}</span>
              </span>
            ))}
          </div>
        )}

        {/* Scrollable body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '0 18px' }}>

          {/* Rating zone — tap to edit */}
          <div onClick={handleRatingTap} style={{
            textAlign: 'center', padding: '28px 0', marginTop: 8, borderRadius: 16,
            background: 'rgba(255,255,255,0.03)', cursor: 'pointer', position: 'relative', overflow: 'hidden',
            transition: 'background 0.15s',
          }}>
            {rating > 0 && <div style={{ position: 'absolute', inset: 0, background: col, opacity: 0.06, borderRadius: 16 }} />}
            <div style={{ position: 'relative' }}>
              {isEditing ? (
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 3 }}>
                  <input ref={inputRef} type="text" inputMode="decimal" maxLength={4}
                    value={ratingInput}
                    onChange={e => {
                      const v = e.target.value;
                      if (v === '' || /^\d*\.?\d*$/.test(v)) {
                        setRatingInput(v);
                        const n = parseFloat(v);
                        if (!isNaN(n) && n >= 1 && n <= 10) {
                          setRating(Math.round(n * 10) / 10);
                        }
                      }
                    }}
                    onBlur={() => commitRating(ratingInput)}
                    onKeyDown={e => { if (e.key === 'Enter') { commitRating(ratingInput); inputRef.current?.blur(); } }}
                    style={{
                      fontSize: 58, fontWeight: 900, color: col, background: 'none', border: 'none',
                      outline: 'none', textAlign: 'center', width: 120, letterSpacing: '-2px',
                      fontFamily: 'inherit', lineHeight: 1,
                    }}
                    autoFocus
                  />
                  <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.2)', fontWeight: 500 }}>/ 10</span>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 3 }}>
                  <span style={{ fontSize: 58, fontWeight: 900, color: col, letterSpacing: '-2px', lineHeight: 1, transition: 'color 0.15s' }}>
                    {rating === 0 ? '—' : rating.toFixed(1)}
                  </span>
                  <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.2)', fontWeight: 500 }}>/ 10</span>
                </div>
              )}
              <p style={{ fontSize: 12, fontWeight: 600, marginTop: 6, color: rating > 0 ? col : 'rgba(255,255,255,0.25)', letterSpacing: 0.2, transition: 'color 0.15s' }}>
                {getRatingLabel(rating)}
              </p>
            </div>
          </div>

          {/* Slider */}
          <div style={{ padding: '12px 4px 0' }}>
            <input type="range" min={1} max={10} step={0.1} value={rating || 5}
              onChange={e => { const v = parseFloat(e.target.value); setRating(v); setRatingInput(v.toFixed(1)); }}
              style={{ width: '100%', cursor: 'pointer', accentColor: col, height: 4 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', fontWeight: 700 }}>1.0</span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', fontWeight: 700 }}>5.0</span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', fontWeight: 700 }}>10.0</span>
            </div>
          </div>

          {/* Action pills — always visible, functional when logged in */}
          <div style={{ display: 'flex', gap: 6, paddingTop: 14, paddingBottom: 8 }}>
            <button className="rm-pill" onClick={userId ? handleLike : undefined} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              padding: '8px 4px', borderRadius: 14, cursor: userId ? 'pointer' : 'default',
              border: liked ? '1px solid #FF3B6F' : '1px solid rgba(255,255,255,0.08)',
              background: liked ? 'rgba(255,59,111,0.08)' : 'rgba(255,255,255,0.03)',
              color: liked ? '#FF3B6F' : 'rgba(255,255,255,0.45)',
              fontSize: 11, fontWeight: 600, transition: 'all 0.15s',
              opacity: userId ? 1 : 0.4,
            }}>
              <span style={{ fontSize: 15 }}>{liked ? '❤️' : '🤍'}</span>
              {liked ? 'Liked' : 'Like'}
            </button>
            <button className="rm-pill" onClick={userId ? handleListenLater : undefined} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              padding: '8px 4px', borderRadius: 14, cursor: userId ? 'pointer' : 'default',
              border: listenLater ? '1px solid #4A9EFF' : '1px solid rgba(255,255,255,0.08)',
              background: listenLater ? 'rgba(74,158,255,0.08)' : 'rgba(255,255,255,0.03)',
              color: listenLater ? '#4A9EFF' : 'rgba(255,255,255,0.45)',
              fontSize: 11, fontWeight: 600, transition: 'all 0.15s',
              opacity: userId ? 1 : 0.4,
            }}>
              <span style={{ fontSize: 15 }}>🕐</span>
              {listenLater ? 'Saved' : 'Later'}
            </button>
            <button className="rm-pill" style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              padding: '8px 4px', borderRadius: 14, cursor: userId ? 'pointer' : 'default',
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.03)',
              color: 'rgba(255,255,255,0.45)',
              fontSize: 11, fontWeight: 600, transition: 'all 0.15s',
              opacity: userId ? 1 : 0.4,
            }}>
              <span style={{ fontSize: 15 }}>📋</span>
              List
            </button>
            <button className="rm-pill" onClick={() => setTagsExpanded(v => !v)} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              padding: '8px 4px', borderRadius: 14, cursor: 'pointer',
              border: tagsExpanded ? '1px solid #6C63FF' : '1px solid rgba(255,255,255,0.08)',
              background: tagsExpanded ? 'rgba(108,99,255,0.08)' : 'rgba(255,255,255,0.03)',
              color: tagsExpanded ? '#6C63FF' : 'rgba(255,255,255,0.45)',
              fontSize: 11, fontWeight: 600, transition: 'all 0.15s',
            }}>
              <span style={{ fontSize: 15 }}>🏷️</span>
              Tags{selectedTags.length > 0 ? ` (${selectedTags.length})` : ''}
            </button>
            <button className="rm-pill" onClick={() => setCreditsOpen(v => !v)} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              padding: '8px 4px', borderRadius: 14, cursor: 'pointer',
              border: creditsOpen ? '1px solid #6C63FF' : '1px solid rgba(255,255,255,0.08)',
              background: creditsOpen ? 'rgba(108,99,255,0.08)' : 'rgba(255,255,255,0.03)',
              color: creditsOpen ? '#6C63FF' : 'rgba(255,255,255,0.45)',
              fontSize: 11, fontWeight: 600, transition: 'all 0.15s',
            }}>
              <span style={{ fontSize: 15 }}>🎼</span>
              Credits
            </button>
          </div>

          {/* Tags */}
          {tagsExpanded && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingBottom: 8 }}>
              {RATING_TAGS.map((tag, i) => (
                <button key={`tag-${i}-${tag}`} onClick={() => toggleTag(tag)}
                  style={{
                    padding: '5px 12px', borderRadius: 14, cursor: 'pointer',
                    border: selectedTags.includes(tag) ? '1px solid #6C63FF' : '1px solid rgba(255,255,255,0.08)',
                    background: selectedTags.includes(tag) ? 'rgba(108,99,255,0.12)' : 'rgba(255,255,255,0.03)',
                    color: selectedTags.includes(tag) ? '#6C63FF' : 'rgba(255,255,255,0.45)',
                    fontSize: 11, fontWeight: 500, transition: 'all 0.15s',
                  }}>
                  {tag}
                </button>
              ))}
            </div>
          )}

          {/* Credits */}
          {creditsOpen && (
            <div style={{ padding: '8px 0 12px' }}>
              {creditsLoading ? (
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '12px 0' }}>Loading credits…</p>
              ) : credits.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {credits.map((c, i) => (
                    <div key={`cred-${i}`} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '10px 14px' }}>
                      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>{c.label}</p>
                      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>{c.names.join(', ')}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', textAlign: 'center', padding: '8px 0' }}>No credits found</p>
              )}
            </div>
          )}

          {/* Streaming links */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, paddingTop: 10, paddingBottom: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', fontWeight: 500 }}>Listen on</span>
            <StreamLink icon="🍎" label="Apple Music" url={appleMusicUrl} />
            <StreamLink icon="🟢" label="Spotify" url={`https://open.spotify.com/search/${searchQ}`} />
            <StreamLink icon="▶️" label="YouTube" url={`https://www.youtube.com/results?search_query=${searchQ}`} />
            <StreamLink icon="🎵" label="YT Music" url={`https://music.youtube.com/search?q=${searchQ}`} />
            <StreamLink icon="🌊" label="Tidal" url={`https://tidal.com/search?q=${searchQ}`} />
          </div>

          {/* Notes */}
          <textarea value={note} onChange={e => setNote(e.target.value)}
            placeholder="Why this rating?"
            rows={2}
            style={{
              width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12, padding: '12px 14px', fontSize: 14, color: 'rgba(255,255,255,0.85)',
              outline: 'none', resize: 'none' as const, boxSizing: 'border-box' as const,
              marginTop: 10, fontFamily: 'inherit', lineHeight: '20px',
            }} />
          {note.length > 0 && <p style={{ textAlign: 'right', fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 2 }}>{note.length}/200</p>}
        </div>

        {/* Footer — pinned at bottom */}
        <div style={{ padding: '12px 18px 20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {/* Remove rating */}
          {existing && userId && (
            <button onClick={handleRemove} style={{
              display: 'block', width: '100%', marginBottom: 10, padding: '6px 0',
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 12, color: 'rgba(255,69,58,0.5)', fontWeight: 600, transition: 'color 0.15s',
            }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,69,58,0.9)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,69,58,0.5)')}>
              Remove rating
            </button>
          )}

          {userId ? (
            <button onClick={handleSave} disabled={saving || saved || rating === 0}
              style={{
                width: '100%', padding: '14px 0', borderRadius: 12, border: 'none',
                background: saved ? '#16a34a' : rating === 0 ? 'rgba(108,99,255,0.3)' : '#6C63FF',
                color: '#fff', fontSize: 14, fontWeight: 800, cursor: saving || saved || rating === 0 ? 'default' : 'pointer',
                transition: 'all 0.2s', opacity: saving ? 0.7 : 1,
              }}>
              {saved ? '✓ Saved!' : saving ? 'Saving…' : rating > 0 ? `Save Rating · ${rating.toFixed(1)}` : 'Tap score to rate'}
            </button>
          ) : (
            <a href="/login" style={{
              display: 'block', width: '100%', padding: '14px 0', borderRadius: 12,
              background: '#6C63FF', color: '#fff', fontSize: 14, fontWeight: 800,
              textDecoration: 'none', textAlign: 'center', boxSizing: 'border-box',
            }}>
              Sign in to Rate
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
