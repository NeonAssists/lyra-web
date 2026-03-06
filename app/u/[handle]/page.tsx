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
        .profile-tabs { justify-content: center !important; }
        @media (max-width: 768px) {
          .profile-wrap { padding: 24px 20px 100px !important; max-width: 100% !important; }
          .profile-header { flex-direction: column !important; align-items: center !important; text-align: center; gap: 16px !important; }
          .profile-header > div:last-child { width: 100% !important; }
          .profile-actions { flex-direction: column !important; align-items: center !important; gap: 12px !important; }
          .profile-stats { justify-content: center !important; gap: 20px !important; flex-wrap: wrap !important; }
          .profile-rank-num { width: 28px !important; font-size: 13px !important; }
          .profile-rank-art { width: 56px !important; height: 56px !important; }
          .profile-rank-title { font-size: 14px !important; }
        }
        @media (min-width: 769px) {
          .profile-rank-item { padding: 14px 20px !important; border-radius: 16px !important; }
          .profile-rank-num { width: 40px !important; font-size: 16px !important; }
          .profile-rank-art { width: 72px !important; height: 72px !important; border-radius: 12px !important; }
          .profile-rank-title { font-size: 16px !important; }
          .profile-rank-artist { font-size: 13px !important; }
          .profile-rank-badge { font-size: 15px !important; padding: 8px 14px !important; border-radius: 10px !important; }
        }
        .profile-tabs::-webkit-scrollbar { display: none; }
      `}</style>
      <div className="profile-wrap" style={{ width: '100%', maxWidth: 1080, padding: '40px 48px 100px', boxSizing: 'border-box' }}>
        {loading ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-full bg-[#141414] animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-6 bg-[#141414] rounded animate-pulse w-1/3" />
                <div className="h-4 bg-[#141414] rounded animate-pulse w-1/4" />
              </div>
            </div>
          </div>
        ) : !profile ? (
          <div className="py-20 text-center text-[#8E8E93]">User not found.</div>
        ) : (
          <>
            {/* Profile header card */}
            <div className="profile-header flex items-center gap-7 mb-8" style={{
              background: 'linear-gradient(135deg, rgba(108,99,255,0.1) 0%, rgba(108,99,255,0.03) 50%, transparent 100%)',
              border: '1px solid rgba(108,99,255,0.15)',
              borderRadius: 20,
              padding: '28px 32px',
            }}>
              <Avatar src={profile.avatar_url} alt={profile.display_name} initials={initials} size={120} />
              <div className="flex-1 min-w-0">
                <div className="profile-actions flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h1 style={{ fontSize: 26, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px', lineHeight: 1.2 }}>{profile.display_name}</h1>
                    <p style={{ fontSize: 14, color: '#8E8E93', marginTop: 4 }}>@{profile.handle}</p>
                    {profile.plan === 'beta' && (
                      <span style={{ display: 'inline-block', marginTop: 8, fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 100, background: 'rgba(108,99,255,0.15)', color: '#6C63FF', border: '1px solid rgba(108,99,255,0.3)' }}>
                        BETA
                      </span>
                    )}
                  </div>
                  {me && me.id !== profile.id && (
                    <button onClick={handleFollow} style={{
                      flexShrink: 0, padding: '10px 24px', borderRadius: 100, fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
                      background: isFollowing ? 'rgba(255,255,255,0.06)' : '#6C63FF',
                      color: isFollowing ? '#8E8E93' : '#fff',
                      border: isFollowing ? '1px solid rgba(255,255,255,0.1)' : 'none',
                    }}>
                      {isFollowing ? 'Following' : 'Follow'}
                    </button>
                  )}
                  {me && me.id === profile.id && (
                    <Link href="/settings" style={{ flexShrink: 0, padding: '10px 20px', borderRadius: 100, fontSize: 14, fontWeight: 600, background: 'rgba(255,255,255,0.06)', color: '#8E8E93', border: '1px solid rgba(255,255,255,0.08)', textDecoration: 'none', transition: 'color 0.15s' }}>
                      Edit Profile
                    </Link>
                  )}
                </div>
                {/* Stats row */}
                <div className="profile-stats flex gap-6">
                  {[
                    { value: rankings.length, label: 'Ranked' },
                    { value: followerCount, label: 'Followers' },
                    { value: followingCount, label: 'Following' },
                    { value: avgRating.toFixed(1), label: 'Avg Rating', color: ratingColor(avgRating) },
                  ].map(({ value, label, color }) => (
                    <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: 22, fontWeight: 900, color: color ?? '#fff', lineHeight: 1 }}>{value}</span>
                      <span style={{ fontSize: 11, color: '#8E8E93', marginTop: 4, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Tabs — centered */}
            <div className="profile-tabs flex gap-2 mb-6" style={{ paddingBottom: 4 }}>
              {(['top', 'songs', 'albums'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className="transition-colors"
                  style={{
                    padding: '9px 20px', borderRadius: 100, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                    background: tab === t ? '#6C63FF' : 'rgba(255,255,255,0.07)',
                    color: tab === t ? '#fff' : '#8E8E93',
                    border: tab === t ? 'none' : '1px solid rgba(255,255,255,0.1)',
                  }}>
                  {t === 'top' ? 'Top Ranked' : t === 'songs' ? 'Songs' : 'Albums'}
                  <span style={{ opacity: 0.6, fontSize: 12, marginLeft: 6 }}>
                    {t === 'top' ? Math.min(rankings.length, 20) : t === 'songs' ? songs.length : albums.length}
                  </span>
                </button>
              ))}
            </div>

            {/* Rankings list */}
            {displayed.length === 0 ? (
              <div style={{ padding: '64px 0', textAlign: 'center', color: '#8E8E93' }}>No rankings yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingBottom: 100 }}>
                {displayed.map((item, i) => {
                  const col = ratingColor(item.rating);
                  return (
                    <button key={`up-${i}-${item.id}`} onClick={() => openModal(item)}
                      className="profile-rank-item flex items-center gap-4 w-full text-left group"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '10px 12px', borderRadius: 12, transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                      <span className="profile-rank-num" style={{ fontWeight: 900, color: '#48484A', textAlign: 'right', flexShrink: 0 }}>{i + 1}</span>
                      <div className="profile-rank-art relative rounded-lg overflow-hidden flex-none" style={{ background: '#141414' }}>
                        {item.artwork_url
                          ? <Image src={item.artwork_url} alt={item.title} fill className="object-cover" unoptimized sizes="72px" />
                          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#48484A' }}>♪</div>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p className="profile-rank-title" style={{ fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</p>
                        <p className="profile-rank-artist" style={{ fontSize: 12, color: '#8E8E93', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>{item.artist}</p>
                        {item.note && <p style={{ fontSize: 11, color: '#48484A', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>&ldquo;{item.note}&rdquo;</p>}
                      </div>
                      <div className="profile-rank-badge flex-none" style={{ fontWeight: 900, background: col + '22', color: col, border: `1px solid ${col}44`, borderRadius: 8, padding: '6px 12px', fontSize: 14 }}>
                        {(item.rating ?? 0).toFixed(1)}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
      <RatingModal open={modalOpen} onClose={() => setModalOpen(false)} item={modalItem} userId={me?.id ?? null} />
    </AppShell>
  );
}
