'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { ratingColor } from '@/lib/ratingColor';
import AppShell from '@/components/AppShell';
import RatingModal, { type ModalItem } from '@/components/RatingModal';
import AlbumView from '@/components/AlbumView';
import { useModals } from '@/hooks/useModals';

type Profile = { id: string; handle: string; display_name: string; avatar_url: string | null };
type Activity = {
  item_id: string; title: string; artist: string; artwork_url: string;
  rating: number; note?: string; ranked_at: string;
  user_id: string; handle: string; display_name: string; avatar_url: string | null;
};

function Avatar({ user, size = 36 }: { user: Profile; size?: number }) {
  const initials = (user.display_name ?? user.handle ?? '?').slice(0, 2).toUpperCase();
  return user.avatar_url ? (
    <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
      <Image src={user.avatar_url} alt={user.display_name} fill style={{ objectFit: 'cover' }} unoptimized />
    </div>
  ) : (
    <div style={{ width: size, height: size, borderRadius: '50%', background: 'linear-gradient(135deg, #6C63FF, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: size * 0.35, flexShrink: 0 }}>
      {initials}
    </div>
  );
}

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function SocialPage() {
  const [me, setMe] = useState<Profile | null>(null);
  const [feed, setFeed] = useState<Activity[]>([]);
  const [people, setPeople] = useState<Profile[]>([]);
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [search, setSearch] = useState('');
  const { modalItem, modalOpen, closeModal, albumView, albumOpen, closeAlbum, openItem, onAlbumSongClick, onAlbumRecClick, onModalAlbumClick } = useModals();
  const open = (a: Activity) => {
    openItem({ id: a.item_id, title: a.title, artist: a.artist, artwork: a.artwork_url, type: a.item_id?.startsWith('itunes:alb:') ? 'album' : 'song' });
  };

  useEffect(() => {
    const loadUser = async (uid: string) => {
      const { data: p } = await supabase.from('profiles').select('id, handle, display_name, avatar_url').eq('id', uid).single();
      setMe(p as Profile);
      const { data: f } = await supabase.from('follows').select('followee_id').eq('follower_id', uid);
      setFollowing(new Set((f ?? []).map((x: any) => x.followee_id)));
    };
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (ev, session) => {
      if (session?.user) loadUser(session.user.id);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    supabase.from('user_rankings' as any)
      .select('item_id, title, artist, artwork_url, rating, note, ranked_at, user_id')
      .not('title', 'is', null).gt('rating', 0).order('ranked_at', { ascending: false }).limit(60)
      .then(async ({ data }: any) => {
        if (!data?.length) { setLoadingFeed(false); return; }
        const uids = [...new Set(data.map((r: any) => r.user_id))];
        const { data: profiles } = await supabase.from('profiles').select('id, handle, display_name, avatar_url').in('id', uids as string[]);
        const pMap: Record<string, any> = {};
        for (const p of (profiles ?? [])) pMap[p.id] = p;
        setFeed(data.map((r: any) => ({ ...r, handle: pMap[r.user_id]?.handle ?? '', display_name: pMap[r.user_id]?.display_name ?? '', avatar_url: pMap[r.user_id]?.avatar_url ?? null })));
        setLoadingFeed(false);
      });
  }, []);

  const [stats, setStats] = useState<Record<string, { ratings: number; followers: number }>>({});

  useEffect(() => {
    supabase.from('profiles').select('id, handle, display_name, avatar_url').limit(40)
      .then(async ({ data }) => {
        if (!data) return;
        setPeople(data as Profile[]);
        // Fetch rating counts and follower counts for each user
        const ids = data.map(p => p.id);
        const [ratingsRes, followsRes] = await Promise.all([
          (supabase as any).from('user_rankings').select('user_id').in('user_id', ids).gt('rating', 0),
          (supabase as any).from('follows').select('followee_id').in('followee_id', ids),
        ]);
        const rMap: Record<string, number> = {};
        const fMap: Record<string, number> = {};
        for (const r of (ratingsRes.data ?? [])) rMap[r.user_id] = (rMap[r.user_id] ?? 0) + 1;
        for (const f of (followsRes.data ?? [])) fMap[f.followee_id] = (fMap[f.followee_id] ?? 0) + 1;
        const s: Record<string, { ratings: number; followers: number }> = {};
        for (const id of ids) s[id] = { ratings: rMap[id] ?? 0, followers: fMap[id] ?? 0 };
        setStats(s);
      });
  }, []);

  const handleFollow = async (uid: string) => {
    if (!me) return;
    if (following.has(uid)) {
      await supabase.from('follows').delete().eq('follower_id', me.id).eq('followee_id', uid);
      setFollowing(prev => { const n = new Set(prev); n.delete(uid); return n; });
    } else {
      await supabase.from('follows').insert({ follower_id: me.id, followee_id: uid });
      setFollowing(prev => new Set([...prev, uid]));
    }
  };

  const filteredPeople = people.filter(p => p.id !== me?.id && (!search || p.handle?.toLowerCase().includes(search.toLowerCase()) || p.display_name?.toLowerCase().includes(search.toLowerCase())));

  return (
    <AppShell>
      <div className="lyra-page" style={{ padding: '32px 28px 80px', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px', marginBottom: 6 }}>Social</h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>See what everyone's listening to</p>
        </div>

        {/* Two-column layout */}
        <div className="lyra-ranked-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>

          {/* LEFT — Activity feed */}
          <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden' }}>
            {/* Feed header */}
            <div style={{ padding: '16px 20px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 3 }}>Live</p>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: 0 }}>Recent Activity</h2>
            </div>

            {loadingFeed ? (
              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[...Array(6)].map((_, i) => <div key={i} style={{ height: 76, background: '#1a1a1a', borderRadius: 12 }} />)}
              </div>
            ) : feed.length === 0 ? (
              <div style={{ padding: '60px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 14 }}>👥</div>
                <p style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 10, letterSpacing: '-0.5px' }}>No activity yet</p>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 24, lineHeight: 1.5 }}>Follow people to see what they're rating in real time. Find your friends below.</p>
                <a href="/social#people" style={{ display: 'inline-block', background: '#6C63FF', color: '#fff', fontWeight: 700, fontSize: 14, padding: '12px 28px', borderRadius: 100, textDecoration: 'none' }}>Find People →</a>
              </div>
            ) : (
              <div style={{ padding: '8px 0' }}>
                {feed.map((item, i) => {
                  const col = ratingColor(item.rating);
                  return (
                    <FeedItem key={`act-${i}-${item.user_id}-${item.item_id}`} item={item} col={col} onOpen={() => open(item)} />
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT — People panel (sticky) */}
          <div style={{ position: 'sticky', top: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Community stats */}
            <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '16px 20px', display: 'flex', gap: 16, justifyContent: 'space-around' }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>{people.length}</p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>Members</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>{Object.values(stats).reduce((s, v) => s + v.ratings, 0)}</p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>Total Ratings</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 20, fontWeight: 900, color: '#6C63FF' }}>{following.size}</p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>Following</p>
              </div>
            </div>

            {/* Search people */}
            <div style={{ position: 'relative' }}>
              <svg style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.35, pointerEvents: 'none' }} width="14" height="14" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Find people…"
                style={{ width: '100%', background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '11px 14px 11px 40px', fontSize: 14, color: '#fff', outline: 'none', boxSizing: 'border-box' }} />
            </div>

            {/* People box */}
            <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 3 }}>Community</p>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: 0 }}>People on Lyra</h2>
              </div>
              <div style={{ padding: '8px 0', maxHeight: 520, overflowY: 'auto' }}>
                {filteredPeople.map(user => (
                  <PersonRow key={user.id} user={user} isFollowing={following.has(user.id)} onFollow={() => handleFollow(user.id)} showFollow={!!me}
                    ratings={stats[user.id]?.ratings} followers={stats[user.id]?.followers} />
                ))}
                {filteredPeople.length === 0 && <p style={{ color: 'rgba(255,255,255,0.2)', textAlign: 'center', padding: '24px 0', fontSize: 13 }}>No users found</p>}
              </div>
            </div>
          </div>

        </div>
      </div>

      <AlbumView open={albumOpen} onClose={closeAlbum}
        albumId={albumView?.id ?? ''} albumTitle={albumView?.title ?? ''} albumArtist={albumView?.artist ?? ''} albumArtwork={albumView?.artwork ?? ''}
        userId={me?.id ?? null} onOpenSong={onAlbumSongClick} onOpenAlbum={onAlbumRecClick} />
      <RatingModal open={modalOpen} onClose={closeModal} item={modalItem} userId={me?.id ?? null} onOpenAlbum={onModalAlbumClick} />
    </AppShell>
  );
}

function FeedItem({ item, col, onOpen }: { item: Activity; col: string; onOpen: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 16px', background: hov ? 'rgba(255,255,255,0.03)' : 'transparent', transition: 'background 0.15s' }}>
      <Link href={`/u/${item.handle}`} style={{ flexShrink: 0 }}>
        <Avatar user={{ id: item.user_id, handle: item.handle, display_name: item.display_name, avatar_url: item.avatar_url }} size={38} />
      </Link>
      <button onClick={onOpen} style={{ width: 48, height: 48, borderRadius: 10, overflow: 'hidden', background: '#1c1c1e', flexShrink: 0, position: 'relative', border: 'none', cursor: 'pointer', padding: 0 }}>
        {item.artwork_url ? <Image src={item.artwork_url.replace('{w}','100').replace('{h}','100')} alt={item.title} fill style={{ objectFit: 'cover' }} unoptimized sizes="48px" /> : <span style={{ color: '#555', fontSize: 18 }}>♪</span>}
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <Link href={`/u/${item.handle}`} style={{ fontWeight: 700, color: '#fff', textDecoration: 'none' }}>@{item.handle}</Link>
          {' '}rated{' '}
          <button onClick={onOpen} style={{ fontWeight: 600, color: '#fff', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 13 }}>{item.title}</button>
        </p>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.artist} · {timeAgo(item.ranked_at)}</p>
      </div>
      <div style={{ flexShrink: 0, padding: '4px 10px', borderRadius: 8, background: col + '18', border: `1px solid ${col}30`, color: col, fontSize: 13, fontWeight: 900 }}>{(item.rating ?? 0).toFixed(1)}</div>
    </div>
  );
}

function PersonRow({ user, isFollowing, onFollow, showFollow, ratings, followers }: { user: Profile; isFollowing: boolean; onFollow: () => void; showFollow: boolean; ratings?: number; followers?: number }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: hov ? 'rgba(255,255,255,0.03)' : 'transparent', transition: 'background 0.15s' }}>
      <Link href={`/u/${user.handle}`} style={{ flexShrink: 0 }}>
        <Avatar user={user} size={42} />
      </Link>
      <div style={{ flex: 1, minWidth: 0 }}>
        <Link href={`/u/${user.handle}`} style={{ textDecoration: 'none' }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.display_name || user.handle}</p>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>@{user.handle}</p>
        </Link>
        <div style={{ display: 'flex', gap: 10, marginTop: 3 }}>
          {(ratings ?? 0) > 0 && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>★ {ratings} rated</span>}
          {(followers ?? 0) > 0 && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>{followers} followers</span>}
        </div>
      </div>
      {showFollow && (
        <button onClick={onFollow}
          style={{ flexShrink: 0, padding: '6px 16px', borderRadius: 100, fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'all 0.15s', background: isFollowing ? '#1c1c1e' : '#6C63FF', color: isFollowing ? 'rgba(255,255,255,0.5)' : '#fff' }}>
          {isFollowing ? 'Following' : 'Follow'}
        </button>
      )}
    </div>
  );
}
