'use client';
import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ratingColor } from '@/lib/ratingColor';
import AppShell from '@/components/AppShell';
import RatingModal, { type ModalItem } from '@/components/RatingModal';
import AlbumView from '@/components/AlbumView';
import { useModals } from '@/hooks/useModals';

type RankedItem = { id: string; item_id: string; rating: number; note?: string; title: string; artist: string; artwork_url: string; ranked_at?: string };
type SortMode = 'rating' | 'recent' | 'alpha';
type Tab = 'songs' | 'albums';

export default function RankedPage() {
  const router = useRouter();
  const [items, setItems] = useState<RankedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('songs');
  const [sort, setSort] = useState<SortMode>('rating');
  const [search, setSearch] = useState('');
  const { modalItem, modalOpen, closeModal, albumView, albumOpen, closeAlbum, openItem, onAlbumSongClick, onAlbumRecClick, onModalAlbumClick } = useModals();

  const fetchRankings = async (uid: string) => {
    const { data, error } = await supabase.from('user_rankings' as any)
      .select('id, item_id, rating, note, title, artist, artwork_url, ranked_at')
      .eq('user_id', uid).not('title', 'is', null).gt('rating', 0)
      .order('rating', { ascending: false });
    console.log('[Ranked] fetchRankings uid:', uid, 'count:', data?.length, 'error:', error?.message);
    setItems((data ?? []) as RankedItem[]);
    setLoading(false);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (ev, session) => {
      if (ev === 'SIGNED_OUT' || !session?.user) { setUserId(null); setItems([]); setLoading(false); return; }
      setUserId(session.user.id);
      await fetchRankings(session.user.id);
    });
    return () => subscription.unsubscribe();
  }, []);

  const songs = useMemo(() => items.filter(i => !i.item_id.startsWith('itunes:alb:')), [items]);
  const albums = useMemo(() => items.filter(i => i.item_id.startsWith('itunes:alb:')), [items]);
  const avgRating = items.length ? (items.filter(i => i.rating > 0).reduce((s, i) => s + i.rating, 0) / items.filter(i => i.rating > 0).length) : 0;

  const base = activeTab === 'albums' ? albums : songs;
  const filtered = base.filter(i =>
    !search || i.title.toLowerCase().includes(search.toLowerCase()) || i.artist.toLowerCase().includes(search.toLowerCase())
  );
  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'rating') return b.rating - a.rating;
    if (sort === 'recent') return new Date(b.ranked_at ?? 0).getTime() - new Date(a.ranked_at ?? 0).getTime();
    return a.title.localeCompare(b.title);
  });

  const openModal = (item: RankedItem) => {
    openItem({ id: item.item_id, title: item.title, artist: item.artist, artwork: item.artwork_url, type: item.item_id.startsWith('itunes:alb:') ? 'album' : 'song' });
  };

  return (
    <AppShell>
      <div className="lyra-page" style={{ padding: '32px 28px 80px', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}>

        {/* Page header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-1px', color: '#fff', marginBottom: 6 }}>My Rankings</h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>
            {items.filter(i => i.rating > 0).length} rated · avg {avgRating > 0 ? avgRating.toFixed(1) : '—'}
          </p>
        </div>

        {/* Stats row */}
        {items.length > 0 && (
          <div className="lyra-grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 32 }}>
            {[
              { label: 'Total Ranked', value: items.filter(i => i.rating > 0).length },
              { label: 'Songs', value: songs.length },
              { label: 'Albums', value: albums.length },
              { label: 'Avg Score', value: avgRating > 0 ? avgRating.toFixed(1) : '—' },
            ].map(s => (
              <div key={s.label} style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '16px 20px' }}>
                <p style={{ fontSize: 24, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>{s.value}</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4, fontWeight: 500 }}>{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Top 3 podium cards */}
        {!loading && sorted.length >= 3 && (
          <div className="lyra-grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
            {sorted.slice(0, 3).map((item, i) => {
              const col = ratingColor(item.rating);
              const sizes = [1.05, 1, 0.95];
              return (
                <button key={`pod-${i}`} onClick={() => openModal(item)}
                  style={{ background: '#111', border: `1px solid ${col}30`, borderRadius: 18, padding: 20, textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s', transform: `scale(${sizes[i]})`, transformOrigin: 'center bottom' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#1a1a1a'; (e.currentTarget as HTMLElement).style.transform = `scale(${sizes[i] + 0.02})`; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#111'; (e.currentTarget as HTMLElement).style.transform = `scale(${sizes[i]})`; }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <div style={{ width: 56, height: 56, borderRadius: 12, overflow: 'hidden', background: '#1c1c1e', flexShrink: 0, position: 'relative' }}>
                      {item.artwork_url ? <Image src={item.artwork_url} alt={item.title} fill style={{ objectFit: 'cover' }} unoptimized sizes="56px" /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555' }}>♪</div>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 15, fontWeight: 800, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</p>
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.artist}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, textTransform: 'uppercase' }}>#{i + 1}</span>
                    <span style={{ fontSize: 22, fontWeight: 900, color: col, letterSpacing: '-0.5px' }}>{(item.rating ?? 0).toFixed(1)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          {/* Tab toggle */}
          <div style={{ display: 'flex', gap: 4, background: '#111', borderRadius: 100, padding: 4, border: '1px solid rgba(255,255,255,0.06)' }}>
            {(['songs', 'albums'] as Tab[]).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                padding: '6px 18px', borderRadius: 100, fontSize: 13, fontWeight: 600,
                background: activeTab === tab ? '#6C63FF' : 'transparent',
                color: activeTab === tab ? '#fff' : 'rgba(255,255,255,0.4)',
                border: 'none', cursor: 'pointer', transition: 'all 0.15s', textTransform: 'capitalize'
              }}>
                {tab} <span style={{ opacity: 0.6, fontSize: 11 }}>({tab === 'songs' ? songs.length : albums.length})</span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div style={{ flex: 1, minWidth: 180, position: 'relative' }}>
            <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} width="14" height="14" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
              style={{ width: '100%', background: '#111', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 100, padding: '8px 14px 8px 34px', fontSize: 13, color: '#fff', outline: 'none', boxSizing: 'border-box' }} />
          </div>

          {/* Sort */}
          <select value={sort} onChange={e => setSort(e.target.value as SortMode)} style={{
            background: '#111', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)',
            borderRadius: 100, padding: '8px 14px', fontSize: 13, outline: 'none', cursor: 'pointer'
          }}>
            <option value="rating">Highest Rated</option>
            <option value="recent">Most Recent</option>
            <option value="alpha">A–Z</option>
          </select>
        </div>

        {/* Main 2-col: list + stats sidebar */}
        <div className="lyra-ranked-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, alignItems: 'start' }}>
        <div>
        {/* List */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[...Array(8)].map((_, i) => (
              <div key={i} style={{ height: 68, background: '#111', borderRadius: 16, opacity: 0.6 }} />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'rgba(255,255,255,0.3)' }}>
            <p style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{search ? 'No results' : 'Nothing ranked yet'}</p>
            <p style={{ fontSize: 14 }}>{search ? 'Try a different search' : 'Head to Music to start rating.'}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {sorted.map((item, i) => {
              const col = ratingColor(item.rating);
              return (
                <button key={`ri-${i}-${item.id}`} onClick={() => openModal(item)}
                  style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', padding: '10px 12px', borderRadius: 14, background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  {/* Rank */}
                  <span style={{ width: 28, textAlign: 'right', fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,0.2)', flexShrink: 0 }}>{i + 1}</span>
                  {/* Artwork */}
                  <div style={{ width: 50, height: 50, borderRadius: 10, overflow: 'hidden', background: '#1c1c1e', flexShrink: 0, position: 'relative' }}>
                    {item.artwork_url
                      ? <Image src={item.artwork_url.replace('{w}', '100').replace('{h}', '100')} alt={item.title} fill style={{ objectFit: 'cover' }} unoptimized sizes="50px" />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 18 }}>♪</div>}
                  </div>
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 15, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>{item.title}</p>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.artist}</p>
                    {item.note && <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>&ldquo;{item.note}&rdquo;</p>}
                  </div>
                  {/* Rating badge */}
                  <div style={{ flexShrink: 0, padding: '5px 12px', borderRadius: 10, background: col + '18', border: `1px solid ${col}33`, color: col, fontSize: 15, fontWeight: 900, letterSpacing: '-0.3px' }}>
                    {(item.rating ?? 0).toFixed(1)}
                  </div>
                </button>
              );
            })}
          </div>
        )}
        </div>
        {/* RIGHT sidebar — rating breakdown */}
        <div style={{ position: 'sticky', top: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 20 }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 10 }}>Breakdown</p>
            {[{label:'Perfect (9–10)', min:9,max:10},{label:'Great (7–8.9)', min:7,max:8.9},{label:'Good (5–6.9)', min:5,max:6.9},{label:'Mid (1–4.9)', min:1,max:4.9}].map(tier => {
              const count = base.filter(i => i.rating >= tier.min && i.rating <= tier.max).length;
              const pct = base.length > 0 ? Math.round(count / base.length * 100) : 0;
              const col = ratingColor(tier.min + 0.5);
              return (
                <div key={tier.label} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{tier.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{count}</span>
                  </div>
                  <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 4 }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: col, borderRadius: 4, transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
          {/* Recent activity box */}
          <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 20 }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 12 }}>Recently Rated</p>
            {[...base].sort((a,b) => new Date(b.ranked_at ?? 0).getTime() - new Date(a.ranked_at ?? 0).getTime()).slice(0,5).map((item,i) => {
              const col = ratingColor(item.rating);
              return (
                <button key={`rec-${i}`} onClick={() => openModal(item)} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', marginBottom: 10, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, overflow: 'hidden', background: '#1c1c1e', flexShrink: 0, position: 'relative' }}>
                    {item.artwork_url ? <Image src={item.artwork_url} alt={item.title} fill style={{ objectFit: 'cover' }} unoptimized sizes="36px" /> : null}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</p>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.artist}</p>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 900, color: col, flexShrink: 0 }}>{(item.rating ?? 0).toFixed(1)}</span>
                </button>
              );
            })}
          </div>
        </div>
        </div>
        </div>

      <AlbumView open={albumOpen} onClose={closeAlbum}
        albumId={albumView?.id ?? ''} albumTitle={albumView?.title ?? ''} albumArtist={albumView?.artist ?? ''} albumArtwork={albumView?.artwork ?? ''}
        userId={userId} onOpenSong={onAlbumSongClick} onOpenAlbum={onAlbumRecClick} />
      <RatingModal open={modalOpen} onClose={closeModal} item={modalItem} userId={userId}
        onSaved={() => { if (userId) fetchRankings(userId); }} onOpenAlbum={onModalAlbumClick} />
    </AppShell>
  );
}
