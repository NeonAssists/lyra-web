'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { ratingColor } from '@/lib/ratingColor';
import AppShell from '@/components/AppShell';
import RatingModal, { type ModalItem } from '@/components/RatingModal';

type Profile = { id: string; handle: string; display_name: string; avatar_url: string | null };
type Activity = {
  item_id: string; title: string; artist: string; artwork_url: string;
  rating: number; note?: string; ranked_at: string;
  user_id: string; handle: string; display_name: string; avatar_url: string | null;
};

function Avatar({ user, size = 36 }: { user: Profile; size?: number }) {
  const initials = (user.display_name ?? user.handle).slice(0, 2).toUpperCase();
  return user.avatar_url ? (
    <div className="relative rounded-full overflow-hidden flex-none" style={{ width: size, height: size }}>
      <Image src={user.avatar_url} alt={user.display_name} fill className="object-cover" unoptimized />
    </div>
  ) : (
    <div className="rounded-full bg-gradient-to-br from-[#6C63FF] to-[#4f46e5] flex items-center justify-center font-bold text-white flex-none text-xs" style={{ width: size, height: size }}>
      {initials}
    </div>
  );
}

export default function SocialPage() {
  const [me, setMe] = useState<Profile | null>(null);
  const [feed, setFeed] = useState<Activity[]>([]);
  const [people, setPeople] = useState<Profile[]>([]);
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<'feed' | 'people'>('feed');
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [modalItem, setModalItem] = useState<ModalItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        const { data: p } = await supabase.from('profiles').select('id, handle, display_name, avatar_url').eq('id', data.user.id).single();
        setMe(p as Profile);
        // load who I follow
        const { data: f } = await supabase.from('follows').select('following_id').eq('follower_id', data.user.id);
        setFollowing(new Set((f ?? []).map((x: any) => x.following_id)));
      }
    });
  }, []);

  useEffect(() => {
    // Community activity feed
    supabase.from('user_rankings')
      .select('item_id, title, artist, artwork_url, rating, note, ranked_at, user_id')
      .not('title', 'is', null).order('ranked_at', { ascending: false }).limit(40)
      .then(async ({ data }) => {
        if (!data?.length) { setLoadingFeed(false); return; }
        const uids = [...new Set(data.map((r: any) => r.user_id))];
        const { data: profiles } = await supabase.from('profiles').select('id, handle, display_name, avatar_url').in('id', uids);
        const pMap: Record<string, any> = {};
        for (const p of (profiles ?? [])) pMap[p.id] = p;
        const mapped: Activity[] = data.map((r: any) => ({
          ...r,
          handle: pMap[r.user_id]?.handle ?? '',
          display_name: pMap[r.user_id]?.display_name ?? '',
          avatar_url: pMap[r.user_id]?.avatar_url ?? null,
        }));
        setFeed(mapped);
        setLoadingFeed(false);
      });
  }, []);

  useEffect(() => {
    supabase.from('profiles').select('id, handle, display_name, avatar_url').limit(30)
      .then(({ data }) => { if (data) setPeople(data as Profile[]); });
  }, []);

  const handleFollow = async (uid: string) => {
    if (!me) return;
    if (following.has(uid)) {
      await supabase.from('follows').delete().eq('follower_id', me.id).eq('following_id', uid);
      setFollowing(prev => { const n = new Set(prev); n.delete(uid); return n; });
    } else {
      await supabase.from('follows').insert({ follower_id: me.id, following_id: uid });
      setFollowing(prev => new Set([...prev, uid]));
    }
  };

  const timeAgo = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-black mb-5">Social</h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(['feed', 'people'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-full text-sm font-semibold capitalize transition-colors ${tab === t ? 'bg-[#6C63FF] text-white' : 'bg-[#141414] text-[#8E8E93] hover:text-white'}`}>
              {t === 'feed' ? 'Recent Activity' : 'People on Lyra'}
            </button>
          ))}
        </div>

        {tab === 'feed' && (
          loadingFeed ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-[#141414] rounded-2xl animate-pulse" />)}
            </div>
          ) : feed.length === 0 ? (
            <div className="py-20 text-center text-[#8E8E93]">No activity yet.</div>
          ) : (
            <div className="space-y-2">
              {feed.map((item, i) => {
                const col = ratingColor(item.rating);
                const isAlbum = item.item_id?.startsWith('itunes:alb:');
                return (
                  <div key={`act-${i}`} className="flex items-start gap-3 p-3.5 bg-[#0d0d0d] hover:bg-[#111] rounded-2xl border border-white/[0.05] transition-colors">
                    <Link href={`/u/${item.handle}`} className="flex-none mt-0.5">
                      <Avatar user={{ id: item.user_id, handle: item.handle, display_name: item.display_name, avatar_url: item.avatar_url }} size={36} />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#8E8E93] mb-1.5">
                        <Link href={`/u/${item.handle}`} className="font-semibold text-white hover:text-[#6C63FF] transition-colors">@{item.handle}</Link>
                        {' '}rated{' '}
                        <button
                          onClick={() => { setModalItem({ id: item.item_id, title: item.title, artist: item.artist, artwork: item.artwork_url, type: isAlbum ? 'album' : 'song' }); setModalOpen(true); }}
                          className="font-semibold text-white hover:text-[#6C63FF] transition-colors"
                        >
                          {item.title}
                        </button>
                        {' '}
                        <span className="font-black" style={{ color: col }}>{item.rating.toFixed(1)}</span>
                        <span className="text-[11px] text-[#48484A] ml-1.5">{timeAgo(item.ranked_at)}</span>
                      </p>
                      <div className="flex items-center gap-2">
                        {item.artwork_url && (
                          <button onClick={() => { setModalItem({ id: item.item_id, title: item.title, artist: item.artist, artwork: item.artwork_url, type: isAlbum ? 'album' : 'song' }); setModalOpen(true); }}
                            className="relative w-10 h-10 rounded-lg overflow-hidden bg-[#141414] flex-none">
                            <Image src={item.artwork_url} alt={item.title} fill className="object-cover" unoptimized sizes="40px" />
                          </button>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-white truncate">{item.title}</p>
                          <p className="text-[11px] text-[#8E8E93] truncate">{item.artist}</p>
                          {item.note && <p className="text-[11px] text-[#48484A] italic truncate">&ldquo;{item.note}&rdquo;</p>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {tab === 'people' && (
          <div className="space-y-2">
            {people.filter(p => p.id !== me?.id).map(user => (
              <div key={user.id} className="flex items-center gap-3 p-3.5 bg-[#0d0d0d] rounded-2xl border border-white/[0.05]">
                <Link href={`/u/${user.handle}`} className="flex-none">
                  <Avatar user={user} size={44} />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/u/${user.handle}`}>
                    <p className="text-sm font-semibold text-white hover:text-[#6C63FF] transition-colors">{user.display_name}</p>
                    <p className="text-xs text-[#8E8E93]">@{user.handle}</p>
                  </Link>
                </div>
                {me && (
                  <button
                    onClick={() => handleFollow(user.id)}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${following.has(user.id) ? 'bg-[#1c1c1e] text-[#8E8E93] hover:text-red-400' : 'bg-[#6C63FF] text-white hover:bg-[#5a52e0]'}`}
                  >
                    {following.has(user.id) ? 'Following' : 'Follow'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <RatingModal open={modalOpen} onClose={() => setModalOpen(false)} item={modalItem} userId={me?.id ?? null} />
    </AppShell>
  );
}
