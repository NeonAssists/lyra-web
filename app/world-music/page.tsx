'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import AppShell from '@/components/AppShell';
import RatingModal, { type ModalItem } from '@/components/RatingModal';
import { supabase } from '@/lib/supabase';

function getHiRes(url: string) { return url?.replace('100x100bb', '600x600bb') ?? ''; }
function toItemId(id: string, type: 'song' | 'album') { return type === 'album' ? `itunes:alb:${id}` : `itunes:trk:${id}`; }

type Tab = 'songs' | 'albums';

function ListRow({ artwork, title, artist, rank, onClick }: { artwork: string; title: string; artist: string; rank: number; onClick: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '8px 20px', background: hov ? 'rgba(255,255,255,0.04)' : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s' }}>
      <span style={{ width: 28, textAlign: 'right', fontSize: 13, fontWeight: 700, color: rank <= 3 ? '#6C63FF' : 'rgba(255,255,255,0.25)', flexShrink: 0 }}>{rank}</span>
      <div style={{ width: 44, height: 44, borderRadius: 8, overflow: 'hidden', background: '#1c1c1e', flexShrink: 0, position: 'relative' }}>
        {artwork ? <Image src={artwork} alt={title} fill style={{ objectFit: 'cover' }} unoptimized sizes="44px" />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3a3a3c', fontSize: 16 }}>♪</div>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 1 }}>{title}</p>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{artist}</p>
      </div>
    </button>
  );
}

export default function WorldMusicPage() {
  const [tab, setTab] = useState<Tab>('songs');
  const [songs, setSongs] = useState<any[]>([]);
  const [albums, setAlbums] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [modalItem, setModalItem] = useState<ModalItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const open = (item: ModalItem) => { setModalItem(item); setModalOpen(true); };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((ev, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => subscription.unsubscribe();
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
      safeFetch('https://itunes.apple.com/br/rss/topsongs/limit=50/json'),
      safeFetch('https://itunes.apple.com/br/rss/topalbums/limit=50/json'),
    ]).then(([s, a]) => {
      setSongs((s?.feed?.entry ?? []).map(map));
      setAlbums((a?.feed?.entry ?? []).map(map));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const items = tab === 'songs' ? songs : albums;

  return (
    <AppShell>
      <div style={{ padding: '32px 32px 80px', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}>

        <div style={{ marginBottom: 28 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: '#6C63FF', marginBottom: 6 }}>World Music Week</p>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px', marginBottom: 6 }}>🇧🇷 Brazil</h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
            This week's spotlight — discover what's trending in Brazil right now. From sertanejo to funk to MPB.
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
          {(['songs', 'albums'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{
                padding: '8px 18px', borderRadius: 24, fontSize: 13, fontWeight: 700,
                border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                background: tab === t ? '#6C63FF' : 'rgba(255,255,255,0.06)',
                color: tab === t ? '#fff' : 'rgba(255,255,255,0.45)',
                textTransform: 'capitalize',
              }}>
              Top {t}
            </button>
          ))}
        </div>

        {/* List */}
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
          ) : items.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.25)', fontSize: 14 }}>No results</p>
          ) : (
            items.map((item: any, i: number) => (
              <ListRow key={`wm-${tab}-${i}-${item.id}`} artwork={item.artwork} title={item.title} artist={item.artist} rank={i + 1}
                onClick={() => open({ id: toItemId(item.id, tab === 'albums' ? 'album' : 'song'), title: item.title, artist: item.artist, artwork: item.artwork, type: tab === 'albums' ? 'album' : 'song' })} />
            ))
          )}
        </div>
      </div>

      <RatingModal open={modalOpen} onClose={() => setModalOpen(false)} item={modalItem} userId={userId} />
    </AppShell>
  );
}
