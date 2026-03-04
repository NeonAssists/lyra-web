'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import AppShell from '@/components/AppShell';
import RatingModal, { type ModalItem } from '@/components/RatingModal';
import { supabase } from '@/lib/supabase';
import { ratingColor } from '@/lib/ratingColor';

function isAlbumId(id: string) { return id?.startsWith('itunes:alb:'); }

export default function FriendsPicksPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [sort, setSort] = useState<'high' | 'low'>('high');
  const [search, setSearch] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      setUserId(data.user.id);
      const { data: follows } = await (supabase as any).from('follows').select('followee_id').eq('follower_id', data.user.id);
      if (!follows?.length) { setLoading(false); return; }
      const ids = follows.map((f: any) => f.followee_id);
      const { data: rankings } = await (supabase as any).from('user_rankings').select('item_id, title, artist, artwork_url, rating, user_id')
        .in('user_id', ids).gte('rating', 7).not('title', 'is', null).order('rating', { ascending: false }).limit(100);
      setItems(rankings ?? []);
      setLoading(false);
    });
  }, []);

  const sorted = [...items]
    .filter(i => !search || i.title?.toLowerCase().includes(search.toLowerCase()) || i.artist?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sort === 'high' ? b.rating - a.rating : a.rating - b.rating);

  return (
    <AppShell>
      <div className="lyra-page" style={{ padding: '32px 28px 80px', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}>
        <div style={{ marginBottom: 28 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>Social</p>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px', marginBottom: 6 }}>Friends' Picks</h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>Highly rated music from people you follow</p>
        </div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <svg style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.35, pointerEvents: 'none' }} width="14" height="14" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…" style={{ width: '100%', background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 100, padding: '9px 14px 9px 40px', fontSize: 14, color: '#fff', outline: 'none', boxSizing: 'border-box' as const }} />
          </div>
          <div style={{ display: 'flex', gap: 4, background: '#1a1a1a', borderRadius: 100, padding: 4 }}>
            {(['high', 'low'] as const).map(d => (
              <button key={d} onClick={() => setSort(d)} style={{ padding: '6px 14px', borderRadius: 100, fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', background: sort === d ? '#6C63FF' : 'transparent', color: sort === d ? '#fff' : 'rgba(255,255,255,0.4)' }}>
                {d === 'high' ? '↑ Highest' : '↓ Lowest'}
              </button>
            ))}
          </div>
        </div>
        <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden' }}>
          {loading ? [...Array(6)].map((_, i) => <div key={i} style={{ height: 64, margin: '4px 16px', borderRadius: 10, background: '#1a1a1a' }} />)
            : sorted.length === 0 ? <p style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>Follow people on the Social tab to see their picks</p>
            : sorted.map((item, i) => {
              const col = ratingColor(item.rating);
              return (
                <button key={`fp-${i}`} onClick={() => { setModal({ id: item.item_id, title: item.title, artist: item.artist, artwork: item.artwork_url ?? '', type: isAlbumId(item.item_id) ? 'album' : 'song' }); setModalOpen(true); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', padding: '10px 16px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s', borderBottom: i < sorted.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <span style={{ width: 28, textAlign: 'right', fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,0.2)', flexShrink: 0 }}>{i + 1}</span>
                  <div style={{ width: 46, height: 46, borderRadius: 8, overflow: 'hidden', background: '#1c1c1e', flexShrink: 0, position: 'relative' }}>
                    {item.artwork_url && <Image src={item.artwork_url} alt={item.title} fill style={{ objectFit: 'cover' }} unoptimized sizes="46px" />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>{item.title}</p>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.artist}</p>
                  </div>
                  <div style={{ flexShrink: 0, padding: '4px 12px', borderRadius: 8, background: col + '18', border: `1px solid ${col}30`, color: col, fontSize: 14, fontWeight: 900 }}>{(item.rating ?? 0).toFixed(1)}</div>
                </button>
              );
            })}
        </div>
      </div>
      <RatingModal open={modalOpen} onClose={() => setModalOpen(false)} item={modal} userId={userId} />
    </AppShell>
  );
}
