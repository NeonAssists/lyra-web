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
        @media (max-width: 768px) {
          .profile-wrap { padding-left: 20px !important; padding-right: 20px !important; padding-top: 24px !important; max-width: 100% !important; }
          .profile-header { flex-direction: column !important; align-items: center !important; text-align: center; gap: 16px !important; }
          .profile-header > div:last-child { width: 100% !important; }
          .profile-actions { flex-direction: column !important; align-items: center !important; gap: 12px !important; }
          .profile-stats { justify-content: center !important; gap: 24px !important; flex-wrap: wrap !important; }
        }
        .profile-tabs::-webkit-scrollbar { display: none; }
      `}</style>
      <div className="profile-wrap" style={{ width: '100%', maxWidth: 900, padding: '40px 48px 100px', boxSizing: 'border-box' }}>
        {loading ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-[#141414] animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-[#141414] rounded animate-pulse w-1/3" />
                <div className="h-3.5 bg-[#141414] rounded animate-pulse w-1/4" />
              </div>
            </div>
          </div>
        ) : !profile ? (
          <div className="py-20 text-center text-[#8E8E93]">User not found.</div>
        ) : (
          <>
            {/* Profile header */}
            <div className="profile-header flex items-start gap-5 mb-6">
              <Avatar src={profile.avatar_url} alt={profile.display_name} initials={initials} size={112} />
              <div className="flex-1 min-w-0">
                <div className="profile-actions flex items-start justify-between gap-3">
                  <div>
                    <h1 className="text-xl font-black text-white">{profile.display_name}</h1>
                    <p className="text-sm text-[#8E8E93]">@{profile.handle}</p>
                    {profile.plan === 'beta' && (
                      <span className="inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#6C63FF]/20 text-[#6C63FF] border border-[#6C63FF]/30">
                        BETA
                      </span>
                    )}
                  </div>
                  {me && me.id !== profile.id && (
                    <button onClick={handleFollow}
                      className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors flex-none ${isFollowing ? 'bg-[#1c1c1e] text-[#8E8E93] border border-white/[0.08] hover:text-red-400' : 'bg-[#6C63FF] text-white hover:bg-[#5a52e0]'}`}>
                      {isFollowing ? 'Following' : 'Follow'}
                    </button>
                  )}
                  {me && me.id === profile.id && (
                    <Link href="/settings" className="px-4 py-2 rounded-full text-sm font-semibold bg-[#141414] text-[#8E8E93] border border-white/[0.08] hover:text-white transition-colors">
                      Edit
                    </Link>
                  )}
                </div>

                {/* Stats */}
                <div className="profile-stats flex gap-5 mt-4">
                  <div className="text-center">
                    <p className="text-base font-black text-white">{rankings.length}</p>
                    <p className="text-[11px] text-[#8E8E93]">Ranked</p>
                  </div>
                  <div className="text-center">
                    <p className="text-base font-black text-white">{followerCount}</p>
                    <p className="text-[11px] text-[#8E8E93]">Followers</p>
                  </div>
                  <div className="text-center">
                    <p className="text-base font-black text-white">{followingCount}</p>
                    <p className="text-[11px] text-[#8E8E93]">Following</p>
                  </div>
                  <div className="text-center">
                    <p className="text-base font-black" style={{ color: ratingColor(avgRating) }}>{avgRating.toFixed(1)}</p>
                    <p className="text-[11px] text-[#8E8E93]">Avg Rating</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="profile-tabs flex gap-2 mb-5" style={{ overflowX: "auto", paddingBottom: 4, WebkitOverflowScrolling: "touch" as any, msOverflowStyle: "none" as any, scrollbarWidth: "none" as any }}>
              {(['top', 'songs', 'albums'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold capitalize transition-colors ${tab === t ? 'bg-[#6C63FF] text-white' : 'text-[#8E8E93] hover:text-white'}`}
                  style={tab !== t ? { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)' } : {}}>
                  {t === 'top' ? 'Top Ranked' : t}
                  <span className="opacity-60 text-xs ml-1">
                    ({t === 'top' ? Math.min(rankings.length, 20) : t === 'songs' ? songs.length : albums.length})
                  </span>
                </button>
              ))}
            </div>

            {/* Rankings list */}
            {displayed.length === 0 ? (
              <div className="py-16 text-center text-[#8E8E93]">No rankings yet.</div>
            ) : (
              <div className="space-y-1" style={{ paddingBottom: 100 }}>
                {displayed.map((item, i) => {
                  const col = ratingColor(item.rating);
                  return (
                    <button key={`up-${i}-${item.id}`} onClick={() => openModal(item)}
                      className="flex items-center gap-3 w-full px-3 py-3.5 hover:bg-white/[0.03] rounded-xl transition-colors text-left group">
                      <span className="text-sm font-black text-[#48484A] w-7 text-right flex-none">{i + 1}</span>
                      <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-[#141414] flex-none">
                        {item.artwork_url
                          ? <Image src={item.artwork_url} alt={item.title} fill className="object-cover" unoptimized sizes="56px" />
                          : <div className="w-full h-full flex items-center justify-center text-[#48484A]">♪</div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate group-hover:text-[#6C63FF] transition-colors">{item.title}</p>
                        <p className="text-xs text-[#8E8E93] truncate">{item.artist}</p>
                        {item.note && <p className="text-[11px] text-[#48484A] italic truncate">&ldquo;{item.note}&rdquo;</p>}
                      </div>
                      <div className="flex-none rounded-lg px-2.5 py-1 text-sm font-black" style={{ backgroundColor: col + '22', color: col, border: `1px solid ${col}44` }}>
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
