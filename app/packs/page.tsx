'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const LASTFM_KEY = '7b3ef80111877bb34f01fe2d7163d6ba';
const GENRE_QUERIES = [
  { genre: 'Hip-Hop/Rap', id: '18' },
  { genre: 'R&B/Soul', id: '15' },
  { genre: 'Pop', id: '14' },
  { genre: 'Rock', id: '21' },
];

type Artist = {
  name: string;
  genre: string;
  artwork: string;
};

async function generatePersonalizationPack(userId: string, likedArtists: string[]) {
  const allSongs: any[] = [];
  const seenIds = new Set<string>();
  const seeds = likedArtists.slice(0, 5);

  for (const artistName of seeds) {
    try {
      const lfRes = await fetch(
        `https://ws.audioscrobbler.com/2.0/?method=artist.getSimilar&artist=${encodeURIComponent(artistName)}&api_key=${LASTFM_KEY}&format=json&limit=5`
      );
      const lfData = await lfRes.json();
      const similar: string[] = (lfData?.similarartists?.artist ?? []).map((a: any) => a.name);

      for (const simArtist of similar.slice(0, 3)) {
        try {
          const itRes = await fetch(
            `https://itunes.apple.com/search?term=${encodeURIComponent(simArtist)}&entity=song&limit=3&country=us`
          );
          const itData = await itRes.json();
          for (const track of itData.results ?? []) {
            if (!seenIds.has(String(track.trackId))) {
              seenIds.add(String(track.trackId));
              allSongs.push({
                item_id: String(track.trackId),
                item_type: 'song',
                title: track.trackName,
                artist: track.artistName,
                artwork_url: track.artworkUrl100?.replace('100x100', '300x300') ?? '',
              });
            }
          }
        } catch {
          /* silent */
        }
      }
    } catch {
      /* silent */
    }
  }

  if (allSongs.length === 0) return;

  const items = allSongs.slice(0, 30);

  try {
    const { data: existing } = await supabase
      .from('lists')
      .select('id')
      .eq('user_id', userId)
      .ilike('name', '%personalization pack%')
      .maybeSingle();

    if (existing?.id) {
      await supabase.from('lists').update({ items }).eq('id', existing.id);
    } else {
      await supabase.from('lists').insert({
        user_id: userId,
        name: 'Personalization Pack',
        items,
        collaborator_ids: [],
      });
    }
  } catch {
    /* silent */
  }

  localStorage.setItem('lyra_packs_done', 'true');
}

export default function PacksPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeCount, setSwipeCount] = useState(0);
  const [likedArtists, setLikedArtists] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Auth check
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push('/login');
      } else {
        setUser({ id: data.user.id });
      }
    });
  }, []);

  // Already completed check
  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('lyra_packs_done')) {
      router.push('/music');
    }
  }, []);

  // Fetch artists from iTunes
  useEffect(() => {
    if (!user) return;

    (async () => {
      try {
        const allArtists: Artist[] = [];

        for (const { genre, id } of GENRE_QUERIES) {
          try {
            const res = await fetch(
              `https://itunes.apple.com/us/rss/topalbums/limit=20/genre=${id}/json`
            );
            const data = await res.json();
            const entries = data?.feed?.entry ?? [];

            for (const entry of entries) {
              const artistName = entry['im:artist']?.label;
              const artwork = entry['im:image']?.[2]?.label;
              if (artistName && artwork) {
                allArtists.push({
                  name: artistName,
                  genre,
                  artwork,
                });
              }
            }
          } catch {
            /* silent */
          }
        }

        // Shuffle using a simple Fisher-Yates
        const shuffled = [...allArtists];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        setArtists(shuffled);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load artists:', err);
        setLoading(false);
      }
    })();
  }, [user]);

  const handleSkip = () => {
    if (currentIndex < artists.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSwipeCount(swipeCount + 1);
    } else {
      finishPacks();
    }
  };

  const handleMyStyle = () => {
    const currentArtist = artists[currentIndex]?.name;
    if (currentArtist) {
      setLikedArtists([...likedArtists, currentArtist]);
    }

    if (currentIndex < artists.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSwipeCount(swipeCount + 1);
    } else {
      finishPacks();
    }
  };

  const finishPacks = async () => {
    if (swipeCount >= 10 || currentIndex >= artists.length - 1) {
      setCompleted(true);
      setGenerating(true);

      if (user && likedArtists.length > 0) {
        await generatePersonalizationPack(user.id, likedArtists);
      } else {
        localStorage.setItem('lyra_packs_done', 'true');
      }

      setGenerating(false);
    }
  };

  const handleStartRanking = () => {
    window.location.href = '/music?from=onboarding';
  };

  if (!user || loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#080808', color: '#fff' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>🎵</div>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>Loading artists…</p>
        </div>
      </div>
    );
  }

  if (completed) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#080808',
        color: '#fff',
        padding: 24,
      }}>
        <div style={{ textAlign: 'center', maxWidth: 420 }}>
          <div style={{ fontSize: 64, marginBottom: 24, display: 'flex', justifyContent: 'center' }}>✓</div>
          <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.5px', marginBottom: 12 }}>
            Your taste is locked in.
          </h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, marginBottom: 32 }}>
            {generating ? "We're building your Personalization Pack..." : 'Time to start ranking.'}
          </p>
          <button
            onClick={handleStartRanking}
            disabled={generating}
            style={{
              width: '100%',
              background: '#F59E0B',
              color: '#000',
              border: 'none',
              borderRadius: 100,
              padding: '14px',
              fontSize: 15,
              fontWeight: 700,
              cursor: generating ? 'not-allowed' : 'pointer',
              opacity: generating ? 0.5 : 1,
              transition: 'all 0.15s',
            }}
          >
            {generating ? 'Building pack…' : 'Start Ranking →'}
          </button>
        </div>
      </div>
    );
  }

  const currentArtist = artists[currentIndex];
  const nextArtist = artists[currentIndex + 1];
  const hasReachedTen = swipeCount >= 10;

  if (hasReachedTen) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#080808',
        color: '#fff',
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>Finishing up…</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      background: '#080808',
      color: '#fff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 24px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Packs</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: 0 }}>
          {swipeCount} / 10 swiped
        </p>
      </div>

      {/* Progress bar */}
      <div style={{
        height: 4,
        background: 'rgba(255,255,255,0.08)',
        margin: 0,
      }}>
        <div
          style={{
            height: '100%',
            background: '#F59E0B',
            width: `${(swipeCount / 10) * 100}%`,
            transition: 'width 0.3s ease',
          }}
        />
      </div>

      {/* Main content */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '40px 24px',
        position: 'relative',
      }}>
        {/* Hint row */}
        <div style={{
          width: '100%',
          maxWidth: 340,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 12,
          color: 'rgba(255,255,255,0.5)',
          marginBottom: 32,
          paddingBottom: 16,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}>
          <span style={{ color: '#ef4444' }}>← Not My Style</span>
          <span>Swipe artists you know</span>
          <span style={{ color: '#F59E0B' }}>My Style →</span>
        </div>

        {/* Card stack */}
        <div style={{ position: 'relative', width: '100%', maxWidth: 340, height: 380 }}>
          {/* Current card */}
          {currentArtist && (
            <div
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 20,
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                zIndex: 2,
                transition: 'transform 0.15s, opacity 0.15s',
              }}
            >
              {/* Artwork placeholder */}
              <div
                style={{
                  flex: 1,
                  background: `linear-gradient(135deg, rgba(139,92,246,0.2), rgba(245,158,11,0.1))`,
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12,
                  backgroundImage: currentArtist.artwork ? `url(${currentArtist.artwork})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                {!currentArtist.artwork && <span style={{ fontSize: 48 }}>🎵</span>}
              </div>

              {/* Info */}
              <div style={{ marginBottom: 16 }}>
                <div style={{
                  fontSize: 10,
                  color: '#8b5cf6',
                  fontWeight: 700,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  marginBottom: 6,
                }}>
                  {currentArtist.genre}
                </div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>
                  {currentArtist.name}
                </div>
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handleSkip}
                  style={{
                    flex: 1,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12,
                    padding: '12px',
                    color: 'rgba(255,255,255,0.5)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: 13,
                    transition: 'all 0.15s',
                  }}
                >
                  ✕ Skip
                </button>
                <button
                  onClick={handleMyStyle}
                  style={{
                    flex: 1,
                    background: '#F59E0B',
                    borderRadius: 12,
                    padding: '12px',
                    color: '#000',
                    fontWeight: 800,
                    cursor: 'pointer',
                    fontSize: 13,
                    border: 'none',
                    transition: 'all 0.15s',
                  }}
                >
                  ✓ My Style
                </button>
              </div>
            </div>
          )}

          {/* Next card peeking */}
          {nextArtist && (
            <div
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 20,
                padding: 16,
                zIndex: 1,
                transform: 'translateY(12px) scale(0.96)',
                opacity: 0.5,
                pointerEvents: 'none',
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
