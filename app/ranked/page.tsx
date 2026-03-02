'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ratingColor } from '@/lib/ratingColor';
import AppShell from '@/components/AppShell';
import RatingModal, { type ModalItem } from '@/components/RatingModal';

type RankedItem = { id: string; item_id: string; rating: number; note?: string; title: string; artist: string; artwork_url: string; ranked_at?: string };
type SortMode = 'rating' | 'recent' | 'alpha';

export default function RankedPage() {
  const router = useRouter();
  const [items, setItems] = useState<RankedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'songs' | 'albums'>('songs');
  const [sort, setSort] = useState<SortMode>('rating');
  const [modalItem, setModalItem] = useState<ModalItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchRankings = async (uid: string) => {
    const { data } = await supabase.from('user_rankings')
      .select('id, item_id, rating, note, title, artist, artwork_url, ranked_at')
      .eq('user_id', uid).not('title', 'is', null)
      .order('rating', { ascending: false });
    setItems((data ?? []) as RankedItem[]);
    setLoading(false);
  };

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/login'); return; }
      setUserId(data.user.id);
      await fetchRankings(data.user.id);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (ev, session) => {
      if (session?.user) { setUserId(session.user.id); fetchRankings(session.user.id); }
      else router.push('/login');
    });
    return () => subscription.unsubscribe();
  }, []);

  const songs = items.filter(i => !i.item_id.startsWith('itunes:alb:'));
  const albums = items.filter(i => i.item_id.startsWith('itunes:alb:'));
  const base = activeTab === 'albums' ? albums : songs;

  const sorted = [...base].sort((a, b) => {
    if (sort === 'rating') return b.rating - a.rating;
    if (sort === 'recent') return new Date(b.ranked_at ?? 0).getTime() - new Date(a.ranked_at ?? 0).getTime();
    return a.title.localeCompare(b.title);
  });

  const avgRating = items.length ? (items.reduce((s, i) => s + i.rating, 0) / items.length) : 0;

  const openModal = (item: RankedItem) => {
    setModalItem({ id: item.item_id, title: item.title, artist: item.artist, artwork: item.artwork_url, type: item.item_id.startsWith('itunes:alb:') ? 'album' : 'song' });
    setModalOpen(true);
  };

  return (
    <AppShell>
      <div className="px-4 py-6 max-w-3xl mx-auto">
        <h1 className="text-2xl font-black mb-4">My Rankings</h1>

        {/* Stats bar */}
        {items.length > 0 && (
          <div className="flex gap-3 mb-6">
            {[
              { label: 'Total', value: items.length },
              { label: 'Songs', value: songs.length },
              { label: 'Albums', value: albums.length },
              { label: 'Avg Rating', value: avgRating.toFixed(1) },
            ].map(s => (
              <div key={s.label} className="flex-1 bg-[#141414] border border-white/[0.06] rounded-xl px-3 py-3 text-center">
                <p className="text-lg font-black text-white">{s.value}</p>
                <p className="text-[10px] text-[#8E8E93] mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tabs + Sort */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex gap-2">
            {(['songs', 'albums'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors capitalize ${activeTab === tab ? 'bg-[#6C63FF] text-white' : 'bg-[#141414] text-[#8E8E93] hover:text-white'}`}>
                {tab} <span className="opacity-60 text-xs ml-0.5">({tab === 'songs' ? songs.length : albums.length})</span>
              </button>
            ))}
          </div>
          <select value={sort} onChange={e => setSort(e.target.value as SortMode)}
            className="bg-[#141414] border border-white/[0.08] text-[#8E8E93] text-xs rounded-lg px-2.5 py-1.5 outline-none">
            <option value="rating">By Rating</option>
            <option value="recent">Most Recent</option>
            <option value="alpha">A–Z</option>
          </select>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => <div key={i} className="h-16 bg-[#141414] rounded-xl animate-pulse" />)}
          </div>
        ) : sorted.length === 0 ? (
          <div className="py-20 text-center text-[#8E8E93]">
            Nothing ranked yet.<br /><span className="text-sm">Head to Music to start rating.</span>
          </div>
        ) : (
          <div className="space-y-1">
            {sorted.map((item, i) => {
              const col = ratingColor(item.rating);
              return (
                <button key={`ri-${i}-${item.id}`} onClick={() => openModal(item)}
                  className="flex items-center gap-3 w-full px-3 py-3 hover:bg-white/[0.03] rounded-xl transition-colors text-left group">
                  <span className="text-sm font-black text-[#48484A] w-7 text-right flex-none">{i + 1}</span>
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-[#141414] flex-none">
                    {item.artwork_url
                      ? <Image src={item.artwork_url} alt={item.title} fill className="object-cover" unoptimized sizes="48px" />
                      : <div className="w-full h-full flex items-center justify-center text-[#48484A]">♪</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate group-hover:text-[#6C63FF] transition-colors">{item.title}</p>
                    <p className="text-xs text-[#8E8E93] truncate">{item.artist}</p>
                    {item.note && <p className="text-[11px] text-[#48484A] truncate italic mt-0.5">&ldquo;{item.note}&rdquo;</p>}
                  </div>
                  <div className="flex-none">
                    <div className="rounded-lg px-2.5 py-1 text-sm font-black" style={{ backgroundColor: col + '22', color: col, border: `1px solid ${col}44` }}>
                      {item.rating.toFixed(1)}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
      <RatingModal open={modalOpen} onClose={() => setModalOpen(false)} item={modalItem} userId={userId}
        onSaved={() => { if (userId) fetchRankings(userId); }} />
    </AppShell>
  );
}
