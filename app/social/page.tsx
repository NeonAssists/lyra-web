'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ratingColor } from '@/lib/ratingColor';
import AppShell from '@/components/AppShell';
import SectionHeader from '@/components/SectionHeader';

type Profile = { id: string; handle: string; display_name: string; avatar_url: string | null };

export default function SocialPage() {
  const router = useRouter();
  const [me, setMe] = useState<Profile | null>(null);
  const [people, setPeople] = useState<Profile[]>([]);
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [recentRankings, setRecentRankings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/login'); return; }
      const { data: p } = await supabase.from('profiles')
        .select('id, handle, display_name, avatar_url').eq('id', data.user.id).single();
      setMe(p as Profile);

      const [{ data: allPeople }, { data: follows }, { data: recent }] = await Promise.all([
        supabase.from('profiles').select('id, handle, display_name, avatar_url').neq('id', data.user.id).limit(20),
        supabase.from('follows').select('following_id').eq('follower_id', data.user.id),
        supabase.from('user_rankings').select('item_id, title, artist, artwork_url, rating, profiles(handle, display_name, avatar_url)')
          .not('title', 'is', null).order('ranked_at', { ascending: false }).limit(20),
      ]);

      setPeople((allPeople ?? []) as Profile[]);
      setFollowing(new Set((follows ?? []).map((f: any) => f.following_id)));
      setRecentRankings((recent ?? []) as any[]);
      setLoading(false);
    });
  }, []);

  const toggleFollow = async (targetId: string) => {
    if (!me) return;
    if (following.has(targetId)) {
      await supabase.from('follows').delete().eq('follower_id', me.id).eq('following_id', targetId);
      setFollowing(prev => { const n = new Set(prev); n.delete(targetId); return n; });
    } else {
      await supabase.from('follows').insert({ follower_id: me.id, following_id: targetId });
      setFollowing(prev => new Set([...prev, targetId]));
    }
  };

  return (
    <AppShell>
      <div className="px-4 py-6 max-w-3xl mx-auto">
        <h1 className="text-2xl font-black mb-6">Social</h1>

        {/* Recent community rankings */}
        {recentRankings.length > 0 && (
          <section className="mb-10">
            <SectionHeader title="Recent Rankings" subtitle="What people are rating" />
            <div className="space-y-3">
              {recentRankings.slice(0, 10).map((r: any, i: number) => {
                const profile = r.profiles as any;
                const col = ratingColor(r.rating);
                return (
                  <div key={`rr-${i}`} className="flex items-center gap-3 bg-[#141414] border border-white/[0.06] rounded-2xl p-3">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-[#1c1c1e]">
                      {r.artwork_url && <Image src={r.artwork_url} alt={r.title} fill className="object-cover" unoptimized sizes="48px" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{r.title}</p>
                      <p className="text-xs text-[#8E8E93] truncate">{r.artist}</p>
                      <Link href={`/u/${profile?.handle}`} className="text-xs text-[#6C63FF] mt-0.5 block truncate">
                        @{profile?.handle}
                      </Link>
                    </div>
                    <div className="rounded-lg px-2.5 py-1.5 flex-shrink-0" style={{ backgroundColor: col }}>
                      <span className="text-sm font-black text-white">{r.rating.toFixed(1)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* People on Lyra */}
        <section>
          <SectionHeader title="People on Lyra" />
          {loading ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="bg-[#141414] rounded-2xl h-16 animate-pulse" />)}</div>
          ) : (
            <div className="space-y-2">
              {people.map(person => (
                <div key={person.id} className="flex items-center gap-3 bg-[#141414] border border-white/[0.06] rounded-2xl px-4 py-3">
                  <Link href={`/u/${person.handle}`} className="flex items-center gap-3 flex-1 min-w-0">
                    {person.avatar_url ? (
                      <div className="relative w-9 h-9 rounded-full overflow-hidden flex-shrink-0">
                        <Image src={person.avatar_url} alt={person.display_name} fill className="object-cover" unoptimized />
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-[#6C63FF] flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {(person.display_name ?? person.handle).slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{person.display_name}</p>
                      <p className="text-xs text-[#8E8E93] truncate">@{person.handle}</p>
                    </div>
                  </Link>
                  {me && (
                    <button
                      onClick={() => toggleFollow(person.id)}
                      className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
                        following.has(person.id)
                          ? 'bg-white/[0.08] text-[#8E8E93]'
                          : 'bg-[#6C63FF] text-white'
                      }`}
                    >
                      {following.has(person.id) ? 'Following' : 'Follow'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
