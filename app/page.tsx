'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) router.replace('/app');
    });
  }, []);

  return (
    <div className="bg-black text-white overflow-x-hidden" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif' }}>

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
          <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#6C63FF', color: '#fff', fontWeight: 600, fontSize: 16, padding: '14px 32px', borderRadius: 100, textDecoration: 'none', letterSpacing: '-0.2px' }}>
            Join the Beta
          </Link>
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

      {/* Bottom CTA — Nike energy */}
      <section style={{ padding: '160px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(3rem, 9vw, 6rem)', fontWeight: 900, letterSpacing: '-2px', lineHeight: 1.0, marginBottom: 40 }}>
            Your taste.<br />
            <span style={{ color: 'rgba(255,255,255,0.25)' }}>Defined.</span>
          </h2>
          <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: '#fff', color: '#000', fontWeight: 700, fontSize: 17, padding: '16px 40px', borderRadius: 100, textDecoration: 'none', letterSpacing: '-0.3px' }}>
            Start Ranking Free →
          </Link>
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
