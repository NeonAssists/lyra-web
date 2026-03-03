'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import AppShell from '@/components/AppShell';
import RatingModal, { type ModalItem } from '@/components/RatingModal';
import { supabase } from '@/lib/supabase';

type ChartTab = 'us-songs' | 'us-albums' | 'global-songs' | 'global-albums';

function getHiRes(url: string) { return url?.replace('100x100bb', '600x600bb') ?? ''; }
function toItemId(id: string, type: 'song' | 'album') { return type === 'album' ? `itunes:alb:${id}` : `itunes:trk:${id}`; }

const TABS: { key: ChartTab; label: string; icon: string }[] = [
  { key: 'us-songs', label: 'US Songs', icon: '🇺🇸' },
  { key: 'us-albums', label: 'US Albums', icon: '🇺🇸' },
  { key: 'global-songs', label: 'Global Songs', icon: '🌍' },
  { key: 'global-albums', label: 'Global Albums', icon: '🌍' },
];

function ListRow({ artwork, title, artist, rank, onClick }: { artwork: string; title: string; artist: string; rank: number; onClick: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '8px 20px', background: hov ? 'rgba(255,255,255,0.04)' : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s' }}>
      <span style={{ width: 28, textAlign: 'right', fontSize: 13, fontWeight: 700, color: rank <= 3 ? '#6C63FF' : 'rgba(255,255,255,0.25)', flexShrink: 0 }}>{rank}</span>
      <div style={{ width: 44, height: 44, borderRadius: 8, overflow: 'hidden', background: '#1c1c1e', flexShrink: 0, position: 'relative' }}>
        {artwork
          ? <Image src={artwork} alt={title} fill style={{ objectFit: 'cover' }} unoptimized sizes="44px" />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3a3a3c', fontSize: 16 }}>♪</div>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 1 }}>{title}</p>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{artist}</p>
      </div>
    </button>
  );
}

export default function ChartsPage() {
  const [tab, setTab] = useState<ChartTab>('us-songs');
  const [data, setData] = useState<Record<ChartTab, any[]>>({ 'us-songs': [], 'us-albums': [], 'global-songs': [], 'global-albums': [] });
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'high' | 'low'>('high');
  const [modalItem, setModalItem] = useState<ModalItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const open = (item: ModalItem) => { setModalItem(item); setModalOpen(true); };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });
  }, []);

  useEffect(() => {
    const map = (e: any) => ({
      id: e.id?.attributes?.['im:id'] ?? '',
      title: e['im:name']?.label ?? '',
      artist: e['im:artist']?.label ?? '',
      artwork: getHiRes(e['im:image']?.[2]?.label ?? ''),
    });
    const safeFetch = (url: string) => fetch(url).then(r => { if (!r.ok) return { feed: { entry: [] } }; return r.json(); }).catch(() => ({ feed: { entry: [] } }));
    Promise.all([
      safeFetch('https://itunes.apple.com/us/rss/topsongs/limit=50/json'),
      safeFetch('https://itunes.apple.com/us/rss/topalbums/limit=50/json'),
      safeFetch('https://itunes.apple.com/gb/rss/topsongs/limit=50/json'),
      safeFetch('https://itunes.apple.com/gb/rss/topalbums/limit=50/json'),
    ]).then(([usSongs, usAlbums, gbSongs, gbAlbums]) => {
      setData({
        'us-songs': (usSongs?.feed?.entry ?? []).map(map),
        'us-albums': (usAlbums?.feed?.entry ?? []).map(map),
        'global-songs': (gbSongs?.feed?.entry ?? []).map(map),
        'global-albums': (gbAlbums?.feed?.entry ?? []).map(map),
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const isAlbum = tab.includes('albums');
  const rawItems = data[tab];
  const items = sortDir === 'low' ? [...rawItems].reverse() : rawItems;
  const tabInfo = TABS.find(t => t.key === tab)!;

  return (
    <AppShell>
      <div style={{ padding: '32px 32px 80px', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}>

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px', marginBottom: 6 }}>Charts</h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>What the world is listening to right now</p>
        </div>

        {/* 4 tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 28, flexWrap: 'wrap' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{
                padding: '8px 18px', borderRadius: 24, fontSize: 13, fontWeight: 700,
                border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                background: tab === t.key ? '#6C63FF' : 'rgba(255,255,255,0.06)',
                color: tab === t.key ? '#fff' : 'rgba(255,255,255,0.45)',
              }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, padding: '0 20px' }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>
              {isAlbum ? 'Albums' : 'Songs'}
            </p>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.3px', margin: 0 }}>
              {tabInfo.icon} Top 50 {tabInfo.label}
            </h2>
          </div>
          <div style={{ display: 'flex', gap: 4, background: '#1a1a1a', borderRadius: 8, padding: 3 }}>
            {(['high', 'low'] as const).map(d => (
              <button key={d} onClick={() => setSortDir(d)}
                style={{ padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'all 0.15s', background: sortDir === d ? '#6C63FF' : 'transparent', color: sortDir === d ? '#fff' : 'rgba(255,255,255,0.4)' }}>
                {d === 'high' ? '↑ High' : '↓ Low'}
              </button>
            ))}
          </div>
        </div>

        {/* List view */}
        <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden' }}>
          {loading ? (
            [...Array(15)].map((_, i) => (
              <div key={`sk-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 20px' }}>
                <div style={{ width: 28 }} />
                <div style={{ width: 44, height: 44, background: '#1c1c1e', borderRadius: 8 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ width: '60%', height: 12, background: '#1c1c1e', borderRadius: 4, marginBottom: 6 }} />
                  <div style={{ width: '40%', height: 10, background: '#1c1c1e', borderRadius: 4 }} />
                </div>
              </div>
            ))
          ) : (
            items.map((item: any, i: number) => (
              <ListRow key={`c-${tab}-${i}-${item.id}`} artwork={item.artwork} title={item.title} artist={item.artist} rank={sortDir === 'high' ? i + 1 : rawItems.length - i}
                onClick={() => open({ id: toItemId(item.id, isAlbum ? 'album' : 'song'), title: item.title, artist: item.artist, artwork: item.artwork, type: isAlbum ? 'album' : 'song' })} />
            ))
          )}
        </div>
      </div>

      <RatingModal open={modalOpen} onClose={() => setModalOpen(false)} item={modalItem} userId={userId} />
    </AppShell>
  );
}
