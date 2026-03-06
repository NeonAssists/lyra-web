'use client';
import { useEffect, useState } from 'react';

const WELCOME_KEY = 'lyra_welcomed_v5';

const TIER_COLORS: Record<number, { color: string; label: string }> = {
  1: { color: '#dc2626', label: 'Skip' },
  2: { color: '#ea580c', label: 'Weak' },
  3: { color: '#f59e0b', label: 'Meh' },
  4: { color: '#a3912a', label: 'Below Avg' },
  5: { color: '#84a332', label: 'Average' },
  6: { color: '#22863a', label: 'Decent' },
  7: { color: '#059669', label: 'Good' },
  8: { color: '#0891b2', label: 'Great' },
  9: { color: '#3b82f6', label: 'Elite' },
  10: { color: '#8b5cf6', label: 'Masterpiece' },
};

type SlideData = {
  title: string;
  body: string;
  content?: React.ReactNode;
  hideSkip?: boolean;
};

const SLIDES: SlideData[] = [
  {
    title: 'Your music. Ranked.',
    body: 'Build your personal music canon. Every song, album, and artist you love — rated and ranked. This is what separates a 10.0 from a 9.8.',
    content: (
      <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[
          { rank: 1, title: 'Voodoo', artist: 'D\'Angelo', rating: 10.0, color: '#8b5cf6', label: 'MASTERPIECE' },
          { rank: 2, title: 'DUCKWORTH.', artist: 'Kendrick Lamar', rating: 9.8, color: '#3b82f6', label: 'ELITE' },
          { rank: 3, title: 'Blinding Lights', artist: 'The Weeknd', rating: 8.7, color: '#0891b2', label: 'GREAT' },
          { rank: 4, title: 'The Art of Loving', artist: 'Olivia Dean', rating: 7.4, color: '#059669', label: 'GOOD' },
        ].map(item => (
          <div key={item.rank} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.3)', width: 20, textAlign: 'right' }}>#{item.rank}</span>
            <div style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.08)', borderRadius: 4 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#fff', margin: '0 0 2px 0' }}>{item.title}</p>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', margin: 0 }}>{item.artist}</p>
            </div>
            <div style={{ background: item.color + '1a', border: `1px solid ${item.color}30`, borderRadius: 6, padding: '4px 8px', textAlign: 'center', flexShrink: 0 }}>
              <p style={{ fontSize: 10, fontWeight: 900, color: item.color, margin: '0 0 1px 0' }}>{item.rating.toFixed(1)}</p>
              <p style={{ fontSize: 7, fontWeight: 700, color: item.color, letterSpacing: 0.5, margin: 0 }}>{item.label}</p>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: 'Not stars. Not likes. Decimals.',
    body: 'Lyra gives you a precise 10-tier scale. Your 8.7 and your 9.2 actually mean something different. Granular. Intentional. Yours.',
    content: (
      <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Large 8.7 display */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: 48, fontWeight: 900, color: '#0891b2' }}>8.7</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#0891b2', letterSpacing: 1 }}>GREAT</div>
        </div>
        {/* 10-tier grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(tier => {
            const { color, label } = TIER_COLORS[tier];
            return (
              <div key={tier} style={{ padding: '8px 12px', borderRadius: 8, background: color + '1a', border: `1px solid ${color}30`, textAlign: 'center' }}>
                <p style={{ fontSize: 9, fontWeight: 900, color, margin: 0 }}>{tier}</p>
                <p style={{ fontSize: 9, fontWeight: 600, color, margin: '2px 0 0 0' }}>{label}</p>
              </div>
            );
          })}
        </div>
      </div>
    ),
  },
  {
    title: 'Swipe Packs.',
    body: 'Swipe right on artists you love. Swipe left to skip. Lyra builds your Personalization Pack from every swipe — music picked specifically for you. The more you swipe, the sharper it gets.',
    content: (
      <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Hint row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
          <span style={{ color: '#ef4444' }}>← Not My Style</span>
          <span>Swipe artists you know</span>
          <span style={{ color: '#F59E0B' }}>My Style →</span>
        </div>

        {/* Artist card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{
            height: 100,
            background: 'rgba(139,92,246,0.2)',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 32,
          }}>
            🎵
          </div>

          <div>
            <div style={{ fontSize: 9, color: '#8b5cf6', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>R&B / SOUL</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>D'Angelo</div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{
              flex: 1,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12,
              padding: '10px',
              color: 'rgba(255,255,255,0.5)',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: 12,
            }}>
              ✕ Skip
            </button>
            <button style={{
              flex: 1,
              background: '#F59E0B',
              borderRadius: 12,
              padding: '10px',
              color: '#000',
              fontWeight: 800,
              cursor: 'pointer',
              fontSize: 12,
              border: 'none',
            }}>
              ✓ My Style
            </button>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: 'Head to Head.',
    body: "Can't choose between two 9s? Head to Head settles it. Battle songs, albums, or artists until one champion rises. Find it in the Ranked tab.",
    content: (
      <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Mode tabs */}
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 12 }}>
          {['Songs', 'Albums', 'Artists'].map(mode => (
            <button
              key={mode}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 600,
                border: 'none',
                background: mode === 'Songs' ? '#F59E0B' : 'rgba(255,255,255,0.06)',
                color: mode === 'Songs' ? '#000' : 'rgba(255,255,255,0.5)',
                cursor: 'pointer',
              }}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* VS cards */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Left card */}
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 12, textAlign: 'center' }}>
            <div style={{ height: 60, background: 'rgba(255,255,255,0.08)', borderRadius: 8, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>♪</div>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#fff', margin: '0 0 2px 0' }}>DUCKWORTH.</p>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#3b82f6', margin: 0 }}>9.8 Elite</p>
          </div>

          {/* VS badge */}
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#000', flexShrink: 0 }}>
            VS
          </div>

          {/* Right card */}
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 12, textAlign: 'center' }}>
            <div style={{ height: 60, background: 'rgba(255,255,255,0.08)', borderRadius: 8, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>♪</div>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#fff', margin: '0 0 2px 0' }}>Blinding Lights</p>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#0891b2', margin: 0 }}>8.7 Great</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: 'Music tastes better together.',
    body: 'See what friends are rating. Compare tastes. Find your people. The feed gets better every time you rate.',
    hideSkip: true,
    content: (
      <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[
          { name: 'A', song: 'Voodoo', rating: 10.0, label: 'Masterpiece', color: '#8b5cf6' },
          { name: 'B', song: 'Blinding Lights', rating: 8.7, label: 'Great', color: '#0891b2' },
          { name: 'C', song: 'DUCKWORTH.', rating: 9.8, label: 'Elite', color: '#3b82f6' },
        ].map((item, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: item.color + '30', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: item.color, flexShrink: 0 }}>
              {item.name}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', margin: 0 }}>just rated</p>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#fff', margin: '2px 0 0 0' }}>{item.song}</p>
            </div>
            <div style={{ background: item.color + '1a', border: `1px solid ${item.color}30`, borderRadius: 6, padding: '4px 8px', textAlign: 'center', flexShrink: 0 }}>
              <p style={{ fontSize: 10, fontWeight: 900, color: item.color, margin: '0 0 1px 0' }}>{item.rating.toFixed(1)}</p>
              <p style={{ fontSize: 7, fontWeight: 700, color: item.color, letterSpacing: 0.5, margin: 0 }}>{item.label}</p>
            </div>
          </div>
        ))}
      </div>
    ),
  },
];

export default function WelcomeOnboarding() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const welcomed = localStorage.getItem(WELCOME_KEY);
    if (!welcomed) {
      setShow(true);
      setStep(0);
    }
  }, []);

  if (!show) return null;

  const slide = SLIDES[step];
  const isLast = step === SLIDES.length - 1;

  const handleSkip = () => {
    localStorage.setItem(WELCOME_KEY, 'true');
    setShow(false);
    window.location.href = '/music';
  };

  const handleNext = () => {
    if (isLast) {
      localStorage.setItem(WELCOME_KEY, 'true');
      setShow(false);
      window.location.href = '/packs';
    } else {
      setStep(step + 1);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      background: '#080808',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
    }}>
      {/* Modal */}
      <div style={{
        position: 'relative',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 20,
        padding: '44px 32px 32px',
        width: '100%',
        maxWidth: 420,
        textAlign: 'center',
        maxHeight: '90vh',
        overflowY: 'auto',
      }}>
        {/* LYRA wordmark */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 16, fontWeight: 900, color: '#F59E0B', letterSpacing: '-0.3px', margin: 0 }}>LYRA</p>
        </div>

        {/* Progress dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 28 }}>
          {SLIDES.map((_, i) => (
            <div
              key={i}
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: i <= step ? '#F59E0B' : 'rgba(255,255,255,0.15)',
                transition: 'background 0.3s',
              }}
            />
          ))}
        </div>

        {/* Content */}
        <h2 style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px', marginBottom: 12, margin: 0 }}>
          {slide.title}
        </h2>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, marginBottom: slide.content ? 12 : 28 }}>
          {slide.body}
        </p>

        {slide.content && <div style={{ marginBottom: 28 }}>{slide.content}</div>}

        {/* Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 32 }}>
          <button
            onClick={handleNext}
            style={{
              width: '100%',
              background: '#F59E0B',
              color: '#000',
              border: 'none',
              borderRadius: 12,
              padding: '16px 0',
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s',
              height: 56,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isLast ? "Let's go →" : 'Next'}
          </button>
          {!slide.hideSkip && (
            <button
              onClick={handleSkip}
              style={{
                width: '100%',
                background: 'transparent',
                color: 'rgba(255,255,255,0.4)',
                border: 'none',
                borderRadius: 12,
                padding: '14px',
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              Skip for now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
