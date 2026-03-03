'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function WaitlistModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) { setError('Both fields are required.'); return; }
    setLoading(true);
    setError('');
    const { error: err } = await (supabase as any).from('waitlist').insert({ name: name.trim(), email: email.trim().toLowerCase() });
    setLoading(false);
    if (err) {
      if (err.code === '23505') setError("You've already signed up!");
      else setError('Something went wrong. Try again.');
    } else {
      setDone(true);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={onClose}>
      {/* Backdrop */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)' }} />
      {/* Card */}
      <div style={{ position: 'relative', background: 'rgba(18,18,18,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 28, padding: '48px 40px', width: '100%', maxWidth: 420, textAlign: 'center' }}
        onClick={e => e.stopPropagation()}>
        {/* Close */}
        <button onClick={onClose} style={{ position: 'absolute', top: 18, right: 20, background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>×</button>

        {done ? (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎵</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px', marginBottom: 12 }}>You're in!</h2>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: 6 }}>We'll email you the moment the app is ready to download.</p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', lineHeight: 1.5 }}>You'll be one of the first to rate, rank, and build your music taste profile.</p>
            <button onClick={onClose} style={{ marginTop: 28, background: '#6C63FF', color: '#fff', border: 'none', borderRadius: 100, padding: '12px 32px', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Done</button>
          </>
        ) : (
          <>
            {/* Ambient glow */}
            <div style={{ position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)', width: 300, height: 200, background: 'radial-gradient(ellipse, rgba(108,99,255,0.25) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <h2 style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px', marginBottom: 8 }}>Create Account</h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', marginBottom: 32, lineHeight: 1.5 }}>Sign up to start rating music. No spam — just the drop.</p>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={e => setName(e.target.value)}
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '14px 16px', fontSize: 15, color: '#fff', outline: 'none', width: '100%', boxSizing: 'border-box' }}
              />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '14px 16px', fontSize: 15, color: '#fff', outline: 'none', width: '100%', boxSizing: 'border-box' }}
              />
              {error && <p style={{ fontSize: 13, color: '#ef4444', margin: 0 }}>{error}</p>}
              <button type="submit" disabled={loading}
                style={{ background: '#6C63FF', color: '#fff', border: 'none', borderRadius: 100, padding: '14px', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginTop: 4 }}>
                {loading ? 'Creating…' : 'Sign Up →'}
              </button>
            </form>
            <p style={{ marginTop: 16, fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>No spam. Unsubscribe anytime.</p>
          </>
        )}
      </div>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [showWaitlist, setShowWaitlist] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) router.replace('/app');
    });
  }, []);

  const openWaitlist = () => setShowWaitlist(true);

  return (
    <div className="bg-black text-white overflow-x-hidden" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif' }}>

      {showWaitlist && <WaitlistModal onClose={() => setShowWaitlist(false)} />}

      {/* Nav — Apple minimal */}
      <nav className="fixed top-0 left-0 right-0 z-50" style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'saturate(180%) blur(20px)', WebkitBackdropFilter: 'saturate(180%) blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ maxWidth: 980, margin: '0 auto', padding: '0 22px', height: 44, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 21, fontWeight: 700, letterSpacing: '-0.5px' }}>Lyra</span>
          <Link href="/login" style={{ fontSize: 13, fontWeight: 500, color: '#6C63FF', textDecoration: 'none', padding: '6px 16px', borderRadius: 20, border: '1px solid rgba(108,99,255,0.4)', transition: 'all 0.2s' }}>
            Sign In
          </Link>
        </div>
      </nav>

      {/* Hero — full viewport, Apple style */}
      <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '120px 24px 80px' }}>
        <p style={{ fontSize: 13, fontWeight: 600, letterSpacing: 3, textTransform: 'uppercase', color: '#6C63FF', marginBottom: 24 }}>Now in Beta</p>
        <h1 style={{ fontSize: 'clamp(3rem, 10vw, 7rem)', fontWeight: 800, lineHeight: 1.02, letterSpacing: '-2px', margin: '0 0 28px', maxWidth: 900 }}>
          Rate music.<br />
          Build taste.<br />
          <span style={{ color: '#6C63FF' }}>Share it.</span>
        </h1>
        <p style={{ fontSize: 'clamp(1rem, 2vw, 1.3rem)', color: 'rgba(255,255,255,0.55)', maxWidth: 540, lineHeight: 1.6, marginBottom: 48, fontWeight: 400 }}>
          Decimal scores. Real opinions. No algorithm telling you what to like.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button onClick={openWaitlist} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#6C63FF', color: '#fff', fontWeight: 600, fontSize: 16, padding: '14px 32px', borderRadius: 100, border: 'none', cursor: 'pointer', letterSpacing: '-0.2px' }}>
            Sign Up Free
          </button>
          <Link href="/u/nate7" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.8)', fontWeight: 600, fontSize: 16, padding: '14px 32px', borderRadius: 100, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.1)' }}>
            See Example Profile
          </Link>
        </div>
      </section>

      {/* Divider stat bar */}
      <section style={{ borderTop: '1px solid rgba(255,255,255,0.08)', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '40px 24px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, textAlign: 'center' }}>
          {[
            { val: '10.0', label: 'Rating ceiling' },
            { val: '0.1', label: 'Step precision' },
            { val: '∞', label: 'Songs to rank' },
            { val: 'Zero', label: 'Algorithms' },
          ].map(({ val, label }) => (
            <div key={label}>
              <div style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 800, letterSpacing: '-1px', color: '#fff' }}>{val}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4, fontWeight: 500 }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Feature 1 — Rate Anything */}
      <section style={{ padding: '120px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: 13, fontWeight: 600, letterSpacing: 3, textTransform: 'uppercase', color: '#6C63FF', marginBottom: 20 }}>Precision</p>
          <h2 style={{ fontSize: 'clamp(2.2rem, 6vw, 4rem)', fontWeight: 800, letterSpacing: '-1.5px', lineHeight: 1.06, marginBottom: 24 }}>
            Rate anything.<br />Down to the decimal.
          </h2>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, maxWidth: 520, margin: '0 auto' }}>
            Songs, albums, EPs. Score from 1.0 to 10.0 in 0.1 increments. Add notes. Build a catalog that actually reflects your taste.
          </p>
        </div>
      </section>

      {/* Feature 2 — Social */}
      <section style={{ padding: '120px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: 13, fontWeight: 600, letterSpacing: 3, textTransform: 'uppercase', color: '#6C63FF', marginBottom: 20 }}>Social</p>
          <h2 style={{ fontSize: 'clamp(2.2rem, 6vw, 4rem)', fontWeight: 800, letterSpacing: '-1.5px', lineHeight: 1.06, marginBottom: 24 }}>
            See what your<br />friends actually like.
          </h2>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, maxWidth: 520, margin: '0 auto' }}>
            Follow friends, see their ratings in real time. Community Picks shows you what people you trust are rating 8+. The best music filter is taste you respect.
          </p>
        </div>
      </section>

      {/* Feature 2b — Friend Features with app mockups */}
      <section style={{ padding: '80px 24px 100px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(108,99,255,0.03)' }}>
        <style>{`
          .friend-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; }
          @media (max-width: 768px) { .friend-grid { grid-template-columns: 1fr; max-width: 340px; margin: 0 auto; } }
        `}</style>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div className="friend-grid">

            {/* Mock 1: Friend Activity Feed */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, overflow: 'hidden', padding: '0', marginBottom: 20 }}>
                <div style={{ padding: '16px 16px 8px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>Activity</p>
                  <p style={{ fontSize: 16, fontWeight: 800, color: '#fff', letterSpacing: '-0.3px' }}>Friend Ratings</p>
                </div>
                {[
                  { handle: 'maya', name: 'Maya Chen', song: 'luther', artist: 'Kendrick Lamar', rating: 9.2, color: '#22c55e' },
                  { handle: 'ari', name: 'Ari M', song: 'Birds of a Feather', artist: 'Billie Eilish', rating: 8.7, color: '#4ade80' },
                  { handle: 'ethan', name: 'Ethan S', song: 'Fortnight', artist: 'Taylor Swift', rating: 7.4, color: '#eab308' },
                  { handle: 'turbo', name: 'Turbo', song: 'Not Like Us', artist: 'Kendrick Lamar', rating: 9.8, color: '#a855f7' },
                ].map((item, i) => (
                  <div key={`feed-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${item.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: item.color }}>{item.handle[0].toUpperCase()}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>@{item.handle} rated <span style={{ color: 'rgba(255,255,255,0.5)' }}>{item.song}</span></p>
                      <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{item.artist}</p>
                    </div>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: `${item.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 14, fontWeight: 900, color: item.color }}>{item.rating}</span>
                    </div>
                  </div>
                ))}
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: '#fff', marginBottom: 8, letterSpacing: '-0.3px' }}>See what friends are rating</h3>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>Real-time feed. No algorithm, just taste you trust.</p>
            </div>

            {/* Mock 2: Following / People */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, overflow: 'hidden', padding: '0', marginBottom: 20 }}>
                <div style={{ padding: '16px 16px 8px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>Social</p>
                  <p style={{ fontSize: 16, fontWeight: 800, color: '#fff', letterSpacing: '-0.3px' }}>People on Lyra</p>
                </div>
                {[
                  { handle: 'maya_c', name: 'Maya Chen', ratings: 142, following: true, accent: '#6C63FF' },
                  { handle: 'jpark', name: 'Jonathan P', ratings: 87, following: false, accent: '#6C63FF' },
                  { handle: 'musicsnob', name: 'musicsnob17', ratings: 231, following: true, accent: '#6C63FF' },
                  { handle: 'cole', name: 'Cole H', ratings: 64, following: false, accent: '#6C63FF' },
                ].map((u, i) => (
                  <div key={`ppl-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(108,99,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#6C63FF' }}>{u.name[0]}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{u.name}</p>
                      <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>@{u.handle} · {u.ratings} ratings</p>
                    </div>
                    <div style={{
                      padding: '5px 14px', borderRadius: 20, fontSize: 11, fontWeight: 700, flexShrink: 0,
                      background: u.following ? 'rgba(108,99,255,0.12)' : '#6C63FF',
                      color: u.following ? '#6C63FF' : '#fff',
                      border: u.following ? '1px solid rgba(108,99,255,0.3)' : 'none',
                    }}>
                      {u.following ? 'Following' : 'Follow'}
                    </div>
                  </div>
                ))}
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: '#fff', marginBottom: 8, letterSpacing: '-0.3px' }}>Follow music lovers you trust</h3>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>Build your circle. Curators, friends, critics.</p>
            </div>

            {/* Mock 3: Shared List */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, overflow: 'hidden', padding: '0', marginBottom: 20 }}>
                <div style={{ padding: '16px 16px 8px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>Collab</p>
                  <p style={{ fontSize: 16, fontWeight: 800, color: '#fff', letterSpacing: '-0.3px' }}>Summer 2026 🔥</p>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>by @nate7 + @ari + @ethan</p>
                </div>
                {[
                  { rank: 1, title: 'luther', artist: 'Kendrick Lamar', scores: ['9.2', '8.8', '9.5'], avgColor: '#22c55e' },
                  { rank: 2, title: 'Birds of a Feather', artist: 'Billie Eilish', scores: ['8.7', '9.1', '7.9'], avgColor: '#4ade80' },
                  { rank: 3, title: 'Espresso', artist: 'Sabrina Carpenter', scores: ['7.5', '8.2', '8.0'], avgColor: '#eab308' },
                  { rank: 4, title: 'Not Like Us', artist: 'Kendrick Lamar', scores: ['9.8', '9.4', '9.6'], avgColor: '#a855f7' },
                ].map((s, i) => (
                  <div key={`list-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ fontSize: 14, fontWeight: 900, color: 'rgba(255,255,255,0.2)', width: 20, textAlign: 'center', flexShrink: 0 }}>{s.rank}</span>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</p>
                      <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{s.artist}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
                      {s.scores.map((sc, j) => (
                        <span key={`sc-${i}-${j}`} style={{ fontSize: 10, fontWeight: 800, color: s.avgColor, background: `${s.avgColor}15`, padding: '2px 5px', borderRadius: 6 }}>{sc}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: '#fff', marginBottom: 8, letterSpacing: '-0.3px' }}>Build shared lists together</h3>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>Collab lists with friends. Compare scores side by side.</p>
            </div>

          </div>
        </div>
      </section>

      {/* Feature 3 — Discovery */}
      <section style={{ padding: '120px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: 13, fontWeight: 600, letterSpacing: 3, textTransform: 'uppercase', color: '#6C63FF', marginBottom: 20 }}>Discovery</p>
          <h2 style={{ fontSize: 'clamp(2.2rem, 6vw, 4rem)', fontWeight: 800, letterSpacing: '-1.5px', lineHeight: 1.06, marginBottom: 24 }}>
            Music that fits<br />your taste. Exactly.
          </h2>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, maxWidth: 520, margin: '0 auto' }}>
            Swipe through Discovery Packs built around your ratings. Lyra learns what you love — and finds more of it. Underground artists included.
          </p>
        </div>
      </section>

      {/* Bottom CTA */}
      <section style={{ padding: '160px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(3rem, 9vw, 6rem)', fontWeight: 900, letterSpacing: '-2px', lineHeight: 1.0, marginBottom: 40 }}>
            Your taste.<br />
            <span style={{ color: 'rgba(255,255,255,0.25)' }}>Defined.</span>
          </h2>
          <button onClick={openWaitlist} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: '#fff', color: '#000', fontWeight: 700, fontSize: 17, padding: '16px 40px', borderRadius: 100, border: 'none', cursor: 'pointer', letterSpacing: '-0.3px' }}>
            Create Account →
          </button>
          <p style={{ marginTop: 20, fontSize: 13, color: 'rgba(255,255,255,0.25)', fontWeight: 500 }}>No credit card. No algorithm. Just music.</p>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '32px 24px' }}>
        <div style={{ maxWidth: 980, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <span style={{ fontSize: 15, fontWeight: 700 }}>Lyra</span>
          <div style={{ display: 'flex', gap: 24 }}>
            <Link href="/privacy" style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>Privacy Policy</Link>
            <a href="https://github.com/NeonAssists/lyra-web" target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>GitHub</a>
          </div>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>© 2026 Lyra</span>
        </div>
      </footer>
    </div>
  );
}
