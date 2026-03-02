'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ratingColor } from '@/lib/ratingColor';
import AppShell from '@/components/AppShell';
import RatingModal, { type ModalItem } from '@/components/RatingModal';

type RankedItem = { id: string; item_id: string; rating: number; title: string; artist: string; artwork_url: string };

export default function RankedPage() {
  const router = useRouter();
  const [items, setItems] = useState<RankedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'songs' | 'albums'>('songs');
  const [modalItem, setModalItem] = useState<ModalItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchRankings = async (uid: string) => {
    const { data } = await supabase.from('user_rankings')
      .select('id, item_id, rating, title, artist, artwork_url')
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
  }, []);

  const filtered = items.filter(i =>
    activeTab === 'albums' ? i.item_id.startsWith('itunes:alb:') : !i.item_id.startsWith('itunes:alb:')
  );

  return (
    <AppShell>
      <div className="px-4 py-6 max-w-5xl mx-auto">
        <div className="flex items-baseline justify-between mb-6">
          <h1 className="text-2xl font-black">Ranked</h1>
          <p className="text-sm text-[#8E8E93]">{items.length} total</p>
        </div>

        <div className="flex gap-2 mb-6">
          {(['songs', 'albums'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors capitalize ${activeTab === tab ? 'bg-[#6C63FF] text-white' : 'bg-[#1c1c1e] text-[#8E8E93]'}`}>
              {tab}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{[...Array(8)].map((_, i) => <div key={i} className="bg-[#141414] rounded-2xl aspect-square animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-[#8E8E93]">
            Nothing ranked yet.<br /><span className="text-sm">Head to Music to start rating.</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filtered.map((item, i) => {
              const col = ratingColor(item.rating);
              return (
                <button key={item.id}
                  onClick={() => { setModalItem({ id: item.item_id, title: item.title, artist: item.artist, artwork: item.artwork_url, type: item.item_id.startsWith('itunes:alb:') ? 'album' : 'song' }); setModalOpen(true); }}
                  className="group text-left bg-[#141414] border border-white/[0.06] rounded-2xl overflow-hidden hover:border-[#6C63FF]/40 transition-all hover:scale-[1.02]">
                  <div className="relative aspect-square bg-[#1c1c1e]">
                    {item.artwork_url && <Image src={item.artwork_url} alt={item.title} fill className="object-cover" unoptimized sizes="200px" />}
                    <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{i + 1}</div>
                    <div className="absolute top-2 right-2 rounded-lg px-2 py-1" style={{ backgroundColor: col }}>
                      <span className="text-xs font-black text-white">{item.rating.toFixed(1)}</span>
                    </div>
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-semibold truncate text-white">{item.title}</p>
                    <p className="text-[11px] text-[#8E8E93] truncate">{item.artist}</p>
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
