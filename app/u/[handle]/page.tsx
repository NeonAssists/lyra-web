'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
// Avatar helper — falls back to initials if image fails to load
function Avatar({ src, alt, initials, size = 80 }: { src: string | null; alt: string; initials: string; size?: number }) {
  const [err, setErr] = useState(false);
  if (src && !err) {
    return (
      <img
        src={src} alt={alt}
        onError={() => setErr(true)}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
    );
  }
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: 'linear-gradient(135deg, #6C63FF, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.28, fontWeight: 900, color: '#fff', flexShrink: 0 }}>
      {initials}
    </div>
  );
}
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ratingColor } from '@/lib/ratingColor';
import AppShell from '@/components/AppShell';
import RatingModal, { type ModalItem } from '@/components/RatingModal';

type Profile = { id: string; handle: string; display_name: string; avatar_url: string | null; plan?: string };
type RankedItem = { id: string; item_id: string; rating: number; note?: string; title: string; artist: string; artwork_url: string; ranked_at?: string };

export default function UserProfilePage() {
  const { handle } = useParams<{ handle: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [me, setMe] = useState<Profile | null>(null);
  const [rankings, setRankings] = useState<RankedItem[]>([]);
  const [tab, setTab] = useState<'top' | 'songs' | 'albums'>('top');
  const [sortMode] = useState<'rating'>('rating');
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalItem, setModalItem] = useState<ModalItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!handle) return;

    // Load current user
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        const { data: p } = await supabase.from('profiles').select('id, handle, display_name, avatar_url').eq('id', data.user.id).single();
        setMe(p as Profile);
      }
    });

    // Load profile
    supabase.from('profiles').select('id, handle, display_name, avatar_url, plan').eq('handle', handle).single()
      .then(async ({ data: p }) => {
        if (!p) { setLoading(false); return; }
        setProfile(p as Profile);

        // Load rankings
        const { data: r } = await supabase.from('user_rankings')
          .select('id, item_id, rating, note, title, artist, artwork_url, ranked_at')
          .eq('user_id', p.id).not('title', 'is', null)
          .order('rating', { ascending: false }).limit(100);
        setRankings((r ?? []) as RankedItem[]);

        // Follow counts
        const [{ count: fc }, { count: fwc }] = await Promise.all([
          supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', p.id),
          supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', p.id),
        ]);
        setFollowerCount(fc ?? 0);
        setFollowingCount(fwc ?? 0);

        setLoading(false);
      });
  }, [handle]);

  // Check if I follow this person
  useEffect(() => {
    if (!me || !profile) return;
    supabase.from('follows').select('*', { count: 'exact', head: true })
      .eq('follower_id', me.id).eq('following_id', profile.id)
      .then(({ count }) => setIsFollowing((count ?? 0) > 0));
  }, [me, profile]);

  const handleFollow = async () => {
    if (!me || !profile) return;
    if (isFollowing) {
      await supabase.from('follows').delete().eq('follower_id', me.id).eq('following_id', profile.id);
      setFollowerCount(c => c - 1);
    } else {
      await supabase.from('follows').insert({ follower_id: me.id, following_id: profile.id });
      setFollowerCount(c => c + 1);
    }
    setIsFollowing(!isFollowing);
  };

  const songs = rankings.filter(r => !r.item_id.startsWith('itunes:alb:') && (r.rating ?? 0) > 0);
  const albums = rankings.filter(r => r.item_id.startsWith('itunes:alb:') && (r.rating ?? 0) > 0);
  const topRanked = [...rankings].filter(r => (r.rating ?? 0) > 0).sort((a, b) => b.rating - a.rating);
  const displayed = tab === 'top' ? topRanked.slice(0, 20) : tab === 'songs' ? songs : albums;
  const avgRating = rankings.length ? (rankings.reduce((s, r) => s + r.rating, 0) / rankings.length) : 0;

  const openModal = (item: RankedItem) => {
    setModalItem({ id: item.item_id, title: item.title, artist: item.artist, artwork: item.artwork_url, type: item.item_id.startsWith('itunes:alb:') ? 'album' : 'song' });
    setModalOpen(true);
  };

  const initials = profile ? (profile.display_name ?? profile.handle).slice(0, 2).toUpperCase() : '';

  return (
    <AppShell>
      <style>{`
        .profile-wrap { margin-left: auto !important; margin-right: auto !important; }
        /* Desktop: two-column layout */
        .profile-layout { display: grid; grid-template-columns: 260px 1fr; gap: 28px; align-items: start; }
        .profile-left { position: sticky; top: 24px; }
        /* Mobile overrides */
        @media (max-width: 768px) {
          .profile-wrap { padding: 20px 16px 100px !important; max-width: 100% !important; }
          .profile-layout { display: block !important; }
          .profile-left { position: static !important; margin-bottom: 20px; }
          .profile-card { padding: 20px !important; }
          .profile-card-avatar { display: flex !important; justify-content: center !important; margin-bottom: 12px !important; }
          .profile-card-name { text-align: center !important; }
          .profile-card-stats { grid-template-columns: repeat(4, 1fr) !important; }
          .profile-card-stat { align-items: center !important; }
          .profile-tabs { justify-content: center !important; }
          .profile-tab-btn { padding: 6px 14px !important; font-size: 12px !important; }
          .profile-rank-num { width: 24px !important; font-size: 12px !important; }
          .profile-rank-art { width: 52px !important; height: 52px !important; }
          .profile-rank-title { font-size: 14px !important; }
          .profile-rank-badge { font-size: 13px !important; padding: 5px 10px !important; }
        }
        .profile-tabs::-webkit-scrollbar { display: none; }
      `}</style>
      <div className="profile-wrap" style={{ width: '100%', maxWidth: 1200, padding: '36px 40px 100px', boxSizing: 'border-box' }}>
        {loading ? (
          <div style={{ display: 'flex', gap: 24 }}>
            <div style={{ width: 260, height: 400, background: '#141414', borderRadius: 20 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[...Array(6)].map((_, i) => <div key={i} style={{ height: 80, background: '#141414', borderRadius: 14 }} />)}
            </div>
          </div>
        ) : !profile ? (
          <div style={{ padding: '80px 0', textAlign: 'center', color: '#8E8E93' }}>User not found.</div>
        ) : (
          <div className="profile-layout">

            {/* ── LEFT: Sticky profile card ── */}
            <div className="profile-left">
              <div className="profile-card" style={{
                background: 'linear-gradient(160deg, rgba(108,99,255,0.13) 0%, rgba(108,99,255,0.04) 50%, rgba(0,0,0,0) 100%)',
                border: '1px solid rgba(108,99,255,0.18)',
                borderRadius: 20,
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                gap: 0,
              }}>
                {/* Avatar */}
                <div className="profile-card-avatar" style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                  <Avatar src={profile.avatar_url} alt={profile.display_name} initials={initials} size={120} />
                </div>

                {/* Name / handle / badge */}
                <div className="profile-card-name" style={{ textAlign: 'center', marginBottom: 16 }}>
                  <h1 style={{ fontSize: 20, fontWeight: 900, color: '#fff', letterSpacing: '-0.3px', lineHeight: 1.2, margin: 0 }}>{profile.display_name}</h1>
                  <p style={{ fontSize: 13, color: '#8E8E93', marginTop: 4 }}>@{profile.handle}</p>
                  {profile.plan === 'beta' && (
                    <span style={{ display: 'inline-block', marginTop: 8, fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 100, background: 'rgba(108,99,255,0.15)', color: '#6C63FF', border: '1px solid rgba(108,99,255,0.3)' }}>
                      BETA
                    </span>
                  )}
                </div>

                {/* Follow / Edit */}
                {me && me.id !== profile.id && (
                  <button onClick={handleFollow} style={{
                    width: '100%', padding: '11px 0', borderRadius: 100, fontSize: 14, fontWeight: 700, cursor: 'pointer',
                    background: isFollowing ? 'rgba(255,255,255,0.06)' : '#6C63FF',
                    color: isFollowing ? '#8E8E93' : '#fff',
                    border: isFollowing ? '1px solid rgba(255,255,255,0.1)' : 'none',
                    marginBottom: 20,
                  }}>
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                )}
                {me && me.id === profile.id && (
                  <Link href="/settings" style={{
                    display: 'block', width: '100%', padding: '11px 0', borderRadius: 100, fontSize: 14, fontWeight: 600, textAlign: 'center',
                    background: 'rgba(255,255,255,0.06)', color: '#8E8E93', border: '1px solid rgba(255,255,255,0.08)', textDecoration: 'none', marginBottom: 20,
                  }}>
                    Edit Profile
                  </Link>
                )}

                {/* Stats 2×2 grid */}
                <div className="profile-card-stats" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 10px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 18 }}>
                  {[
                    { value: rankings.length, label: 'Ranked' },
                    { value: followerCount, label: 'Followers' },
                    { value: followingCount, label: 'Following' },
                    { value: avgRating.toFixed(1), label: 'Avg Rating', color: ratingColor(avgRating) },
                  ].map(({ value, label, color }) => (
                    <div className="profile-card-stat" key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: 20, fontWeight: 900, color: color ?? '#fff', lineHeight: 1 }}>{value}</span>
                      <span style={{ fontSize: 10, color: '#8E8E93', marginTop: 3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── RIGHT: Tabs + ranked list ── */}
            <div>
              {/* Tabs */}
              <div className="profile-tabs flex gap-2 mb-5" style={{ paddingBottom: 4 }}>
                {(['top', 'songs', 'albums'] as const).map(t => (
                  <button key={t} onClick={() => setTab(t)}
                    className="profile-tab-btn"
                    style={{
                      padding: '9px 20px', borderRadius: 100, fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                      background: tab === t ? '#6C63FF' : 'rgba(255,255,255,0.07)',
                      color: tab === t ? '#fff' : '#8E8E93',
                      border: tab === t ? 'none' : '1px solid rgba(255,255,255,0.1)',
                    }}>
                    {t === 'top' ? 'Top Ranked' : t === 'songs' ? 'Songs' : 'Albums'}
                    <span style={{ opacity: 0.55, fontSize: 12, marginLeft: 6 }}>
                      {t === 'top' ? Math.min(rankings.length, 20) : t === 'songs' ? songs.length : albums.length}
                    </span>
                  </button>
                ))}
              </div>

              {/* Rankings list */}
              {displayed.length === 0 ? (
                <div style={{ padding: '64px 0', textAlign: 'center', color: '#8E8E93' }}>No rankings yet.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {displayed.map((item, i) => {
                    const col = ratingColor(item.rating);
                    return (
                      <button key={`up-${i}-${item.id}`} onClick={() => openModal(item)}
                        className="profile-rank-item flex items-center gap-4 w-full text-left"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '12px 14px', borderRadius: 14, transition: 'background 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                        <span className="profile-rank-num" style={{ fontWeight: 900, color: '#3a3a3c', textAlign: 'right', flexShrink: 0, width: 36, fontSize: 15 }}>{i + 1}</span>
                        <div className="profile-rank-art relative overflow-hidden flex-none" style={{ background: '#141414', borderRadius: 10, width: 64, height: 64 }}>
                          {item.artwork_url
                            ? <Image src={item.artwork_url} alt={item.title} fill className="object-cover" unoptimized sizes="64px" />
                            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#48484A', fontSize: 20 }}>♪</div>}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p className="profile-rank-title" style={{ fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 15 }}>{item.title}</p>
                          <p className="profile-rank-artist" style={{ fontSize: 13, color: '#8E8E93', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 3 }}>{item.artist}</p>
                          {item.note && <p style={{ fontSize: 11, color: '#48484A', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>&ldquo;{item.note}&rdquo;</p>}
                        </div>
                        <div className="profile-rank-badge flex-none" style={{ fontWeight: 900, background: col + '22', color: col, border: `1px solid ${col}44`, borderRadius: 9, padding: '7px 13px', fontSize: 15, letterSpacing: '-0.3px' }}>
                          {(item.rating ?? 0).toFixed(1)}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}
      </div>
      <RatingModal open={modalOpen} onClose={() => setModalOpen(false)} item={modalItem} userId={me?.id ?? null} />
    </AppShell>
  );
}
