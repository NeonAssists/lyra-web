'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import AppShell from '@/components/AppShell';
import RatingModal, { type ModalItem } from '@/components/RatingModal';
import { supabase } from '@/lib/supabase';

function getHiRes(url: string) { return url?.replace('100x100bb', '600x600bb') ?? ''; }
function toItemId(id: string) { return `itunes:trk:${id}`; }

function SongTile({ artwork, title, artist, rank, onClick }: { artwork: string; title: string; artist: string; rank: number; onClick: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: hov ? '#1c1c1e' : 'transparent', border: 'none', cursor: 'pointer', padding: 10, borderRadius: 12, textAlign: 'left', width: '100%', transition: 'background 0.15s' }}>
      <div style={{ position: 'relative', width: '100%', aspectRatio: '1', borderRadius: 10, overflow: 'hidden', background: '#1c1c1e', marginBottom: 8 }}>
        {artwork && <Image src={artwork} alt={title} fill style={{ objectFit: 'cover' }} unoptimized sizes="180px" />}
        <div style={{ position: 'absolute', top: 6, left: 6, background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 5 }}>#{rank}</div>
      </div>
      <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>{title}</p>
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{artist}</p>
    </button>
  );
}

export default function NewMusicPage() {
  const [songs, setSongs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => { setUserId(session?.user?.id ?? null); }); return () => subscription.unsubscribe();
    fetch('https://itunes.apple.com/us/rss/newmusic/limit=50/json').then(r => r.json()).then(d => {
      setSongs((d?.feed?.entry ?? []).map((e: any) => ({ id: e.id?.attributes?.['im:id'] ?? '', title: e['im:name']?.label ?? '', artist: e['im:artist']?.label ?? '', artwork: getHiRes(e['im:image']?.[2]?.label ?? '') })));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <AppShell>
      <div className="lyra-page" style={{ padding: '32px 28px 80px', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}>
        <div style={{ marginBottom: 28 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>Just Released</p>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px', marginBottom: 6 }}>New Music</h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>The latest releases — tap to rate</p>
        </div>
        {loading
          ? <div className="lyra-grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>{[...Array(10)].map((_, i) => <div key={i} style={{ aspectRatio: '1', background: '#1c1c1e', borderRadius: 10 }} />)}</div>
          : <div className="lyra-grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
              {songs.map((s, i) => (
                <SongTile key={i} artwork={s.artwork} title={s.title} artist={s.artist} rank={i + 1}
                  onClick={() => { setModal({ id: toItemId(s.id), title: s.title, artist: s.artist, artwork: s.artwork, type: 'song' }); setModalOpen(true); }} />
              ))}
            </div>}
      </div>
      <RatingModal open={modalOpen} onClose={() => setModalOpen(false)} item={modal} userId={userId} />
    </AppShell>
  );
}
