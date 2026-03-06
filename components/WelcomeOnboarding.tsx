'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const WELCOME_KEY = 'lyra_welcomed_v4';

const WELCOME_SCALE_TIERS = [
  { score: 1,  label: 'Skip',        color: '#dc2626' },
  { score: 2,  label: 'Weak',        color: '#ea580c' },
  { score: 3,  label: 'Meh',         color: '#f59e0b' },
  { score: 4,  label: 'Below avg',   color: '#a3912a' },
  { score: 5,  label: 'Average',     color: '#84a332' },
  { score: 6,  label: 'Decent',      color: '#22863a' },
  { score: 7,  label: 'Good',        color: '#059669' },
  { score: 8,  label: 'Great',       color: '#0891b2' },
  { score: 9,  label: 'Elite',       color: '#3b82f6' },
  { score: 10, label: 'Masterpiece', color: '#8b5cf6' },
];

function WelcomeRatingCard() {
  const [rating, setRating] = useState(8.7);
  const tier = [...WELCOME_SCALE_TIERS].reverse().find(t => rating >= t.score) ?? WELCOME_SCALE_TIERS[0];
  const pct = ((rating - 1) / 9) * 100;
  return (
    <div style={{ background: 'rgba(20,16,12,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 20, boxShadow: `0 20px 60px ${tier.color}33` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Blinding Lights</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>The Weeknd</div>
        </div>
        <div style={{ background: `${tier.color}18`, borderRadius: 12, padding: '6px 12px', textAlign: 'center' as const }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: tier.color, lineHeight: 1 }}>{rating.toFixed(1)}</div>
          <div style={{ fontSize: 9, fontWeight: 700, color: tier.color, textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>{tier.label}</div>
        </div>
      </div>
      <div style={{ position: 'relative', marginBottom: 12 }}>
        <style>{`.lw-slider{-webkit-appearance:none;appearance:none;width:100%;height:28px;background:transparent;outline:none;cursor:pointer;position:relative;z-index:1}.lw-slider::-webkit-slider-thumb{-webkit-appearance:none;width:22px;height:22px;border-radius:50%;background:#fff;border:3px solid var(--lw-accent,#8b5cf6);box-shadow:0 2px 8px rgba(0,0,0,0.4);transition:border-color 0.2s}.lw-slider::-moz-range-thumb{width:22px;height:22px;border-radius:50%;background:#fff;border:3px solid var(--lw-accent,#8b5cf6)}`}</style>
        <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', transform: 'translateY(-50%)' }} />
        <div style={{ position: 'absolute', top: '50%', left: 0, width: `${pct}%`, height: 6, borderRadius: 3, background: tier.color, transform: 'translateY(-50%)', transition: 'width 0.05s, background 0.2s' }} />
        <input className="lw-slider" type="range" min="1" max="10" step="0.1" value={rating}
          style={{ '--lw-accent': tier.color } as React.CSSProperties}
          onChange={e => setRating(parseFloat(e.target.value))} />
      </div>
      {/* Bar chart — same as marketing page */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 64 }}>
        {WELCOME_SCALE_TIERS.map(t => {
          const h = 10 + (t.score / 10) * 90;
          return (
            <div key={t.score} style={{ flex: 1, height: '100%', position: 'relative' }}>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '3px 3px 0 0' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${h}%`, background: t.color, borderRadius: '3px 3px 0 0', opacity: 0.85 }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function WelcomeOnboarding() {
  const [show, setShow] = useState(false);
  const [welcomeStep, setWelcomeStep] = useState<1|2|3|4|5>(1);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user && !localStorage.getItem(WELCOME_KEY)) {
        setShow(true);
        setWelcomeStep(1);
      }
    });
    // Also check immediately on mount (handles page refresh while logged in)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && !localStorage.getItem(WELCOME_KEY)) {
        setShow(true);
        setWelcomeStep(1);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  if (!show) return null;

  return (() => {
        const TOTAL = 5;
        const dismissWelcome = () => { setShow(false); localStorage.setItem('lyra_welcomed_v4', 'true'); };
        const goNext = () => setWelcomeStep(s => Math.min(s + 1, TOTAL) as any);
        const goBack = () => setWelcomeStep(s => Math.max(s - 1, 1) as any);

        const TIERS = [
          { score: 1,  label: 'Skip',        color: '#dc2626' },
          { score: 2,  label: 'Weak',        color: '#ea580c' },
          { score: 3,  label: 'Meh',         color: '#f59e0b' },
          { score: 4,  label: 'Below Avg',   color: '#a3912a' },
          { score: 5,  label: 'Average',     color: '#84a332' },
          { score: 6,  label: 'Decent',      color: '#22863a' },
          { score: 7,  label: 'Good',        color: '#059669' },
          { score: 8,  label: 'Great',       color: '#0891b2' },
          { score: 9,  label: 'Elite',       color: '#3b82f6' },
          { score: 10, label: 'Masterpiece', color: '#8b5cf6' },
        ];

        const MOCK_TRACKS = [
          { title: 'Voodoo',            artist: "D'Angelo",        rating: 10.0, tier: 'Masterpiece', color: '#8b5cf6' },
          { title: 'DUCKWORTH.',        artist: 'Kendrick Lamar',   rating: 9.2,  tier: 'Elite',       color: '#3b82f6' },
          { title: 'Blinding Lights',   artist: 'The Weeknd',       rating: 8.7,  tier: 'Great',       color: '#0891b2' },
          { title: 'The Art of Loving', artist: 'Olivia Dean',      rating: 7.4,  tier: 'Good',        color: '#059669' },
        ];

        const MOCK_FRIENDS = [
          { initials: 'AL', color: '#6C63FF', name: 'Alex',  track: 'Voodoo',          score: 10.0, tier: 'Masterpiece', tc: '#8b5cf6' },
          { initials: 'BN', color: '#0891b2', name: 'Ben',   track: 'Blinding Lights', score: 8.7,  tier: 'Great',       tc: '#0891b2' },
          { initials: 'CO', color: '#059669', name: 'Cole',  track: 'DUCKWORTH.',      score: 9.2,  tier: 'Elite',       tc: '#3b82f6' },
        ];

        const cardStyle: React.CSSProperties = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 16 };
        const rowStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 10 };
        const artStyle: React.CSSProperties = { width: 38, height: 38, borderRadius: 8, background: 'rgba(255,255,255,0.08)', flexShrink: 0 };

        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div style={{ background: 'linear-gradient(135deg, rgba(108,99,255,0.5) 0%, rgba(139,92,246,0.2) 50%, rgba(6,182,212,0.2) 100%)', padding: 1, borderRadius: 28, maxWidth: 480, width: '100%' }}>
              <div style={{ background: 'linear-gradient(160deg, #0f0f0f 0%, #0d0b1a 100%)', borderRadius: 28, padding: '24px 28px 28px' }}>

                {/* Progress dots */}
                <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 24 }}>
                  {([1,2,3,4,5] as const).map(s => (
                    <div key={s} style={{ width: welcomeStep === s ? 24 : 6, height: 6, borderRadius: 3, background: welcomeStep === s ? '#6C63FF' : 'rgba(255,255,255,0.12)', transition: 'width 0.2s' }} />
                  ))}
                </div>

                {/* ── Step 1: What is Lyra ── */}
                {welcomeStep === 1 && (
                  <>
                    <h2 style={{ fontSize: 24, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px', margin: '0 0 8px' }}>Your music, ranked.</h2>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.65, margin: '0 0 20px' }}>Lyra isn't just a music app. It's where you build your personal music canon — every song, album, and artist you've ever loved, rated and ranked in order.</p>
                    <div style={cardStyle}>
                      {MOCK_TRACKS.map((t, i) => (
                        <div key={i} style={{ ...rowStyle, paddingBlock: 9, borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                          <span style={{ fontSize: 11, fontWeight: 900, color: '#3a3a3c', width: 16, textAlign: 'right', flexShrink: 0 }}>{i+1}</span>
                          <div style={artStyle} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{t.artist}</div>
                          </div>
                          <div style={{ background: t.color + '18', borderRadius: 9, padding: '5px 9px', textAlign: 'center', flexShrink: 0 }}>
                            <div style={{ fontSize: 15, fontWeight: 900, color: t.color, lineHeight: 1 }}>{t.rating.toFixed(1)}</div>
                            <div style={{ fontSize: 7, fontWeight: 800, color: t.color, textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 2 }}>{t.tier}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button onClick={goNext} style={{ width: '100%', marginTop: 20, padding: 14, borderRadius: 100, background: 'linear-gradient(135deg, #6C63FF, #8b5cf6)', color: '#fff', fontSize: 15, fontWeight: 800, border: 'none', cursor: 'pointer' }}>Next →</button>
                    <button onClick={dismissWelcome} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'rgba(255,255,255,0.2)', marginTop: 10, display: 'block', width: '100%', textAlign: 'center' }}>Skip for now</button>
                  </>
                )}

                {/* ── Step 2: The Scale ── */}
                {welcomeStep === 2 && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <button onClick={goBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', fontSize: 20, padding: 0, lineHeight: 1 }}>←</button>
                      <h2 style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.4px', margin: 0 }}>10 tiers. 90 decimal points.</h2>
                    </div>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.65, margin: '0 0 16px' }}>Not a thumbs up. Not a star. Every tier has a name, a color, and a meaning. Drag the slider and feel the difference.</p>
                    {/* Tier chips */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
                      {TIERS.map(t => (
                        <div key={t.score} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 9px', borderRadius: 8, background: t.color + '16', border: '1px solid' + t.color + '35' }}>
                          <span style={{ fontSize: 11, fontWeight: 900, color: t.color }}>{t.score}</span>
                          <span style={{ fontSize: 10, fontWeight: 700, color: t.color }}>{t.label}</span>
                        </div>
                      ))}
                    </div>
                    <WelcomeRatingCard />
                    <button onClick={goNext} style={{ width: '100%', marginTop: 16, padding: 14, borderRadius: 100, background: 'linear-gradient(135deg, #6C63FF, #8b5cf6)', color: '#fff', fontSize: 15, fontWeight: 800, border: 'none', cursor: 'pointer' }}>Next →</button>
                    <button onClick={dismissWelcome} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'rgba(255,255,255,0.2)', marginTop: 10, display: 'block', width: '100%', textAlign: 'center' }}>Skip for now</button>
                  </>
                )}

                {/* ── Step 3: Packs ── */}
                {welcomeStep === 3 && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <button onClick={goBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', fontSize: 20, padding: 0, lineHeight: 1 }}>←</button>
                      <h2 style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.4px', margin: 0 }}>Rate more. Know your taste.</h2>
                    </div>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.65, margin: '0 0 16px' }}>Packs are themed sets of music built to get you rating fast. The more you rate, the sharper your Personalization Pack gets — music picked specifically for you.</p>
                    <div style={cardStyle}>
                      {/* Pack rows */}
                      {[{name:'Hip-Hop Classics',color:'#8b5cf6'},{name:'R&B Essentials',color:'#0891b2'},{name:'Pop Hits',color:'#ea580c'},{name:'Jazz & Soul',color:'#059669'}].map((p,i) => (
                        <div key={i} style={{ ...rowStyle, paddingBlock: 9, borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                          <div style={{ width: 36, height: 36, borderRadius: 8, background: p.color + '25', flexShrink: 0 }} />
                          <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#fff' }}>{p.name}</div>
                          <div style={{ fontSize: 11, color: p.color, fontWeight: 700 }}>Rate →</div>
                        </div>
                      ))}
                      {/* Personalization Pack */}
                      <div style={{ marginTop: 12, background: 'rgba(108,99,255,0.1)', borderRadius: 12, border: '1px solid rgba(108,99,255,0.3)', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 9, fontWeight: 800, color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 }}>✦ Your Style Pack</div>
                          <div style={{ fontSize: 14, fontWeight: 900, color: '#fff' }}>Built for you</div>
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Gets smarter every time you rate</div>
                        </div>
                        <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(108,99,255,0.25)', flexShrink: 0 }} />
                      </div>
                    </div>
                    <button onClick={goNext} style={{ width: '100%', marginTop: 16, padding: 14, borderRadius: 100, background: 'linear-gradient(135deg, #6C63FF, #8b5cf6)', color: '#fff', fontSize: 15, fontWeight: 800, border: 'none', cursor: 'pointer' }}>Next →</button>
                    <button onClick={dismissWelcome} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'rgba(255,255,255,0.2)', marginTop: 10, display: 'block', width: '100%', textAlign: 'center' }}>Skip for now</button>
                  </>
                )}

                {/* ── Step 4: Head 2 Head ── */}
                {welcomeStep === 4 && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <button onClick={goBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', fontSize: 20, padding: 0, lineHeight: 1 }}>←</button>
                      <h2 style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.4px', margin: 0 }}>Head 2 Head.</h2>
                    </div>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.65, margin: '0 0 16px' }}>Two songs both rated 9.0? Head 2 Head settles it. Pick between songs, albums, or artists — head to head — until one true champion remains.</p>
                    <div style={cardStyle}>
                      {/* Mode tabs */}
                      <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: 3, marginBottom: 14 }}>
                        {['Songs','Albums','Artists'].map((mo,i) => (
                          <div key={mo} style={{ flex: 1, padding: '6px 0', borderRadius: 8, background: i===0 ? 'rgba(255,255,255,0.1)' : 'transparent', textAlign: 'center', fontSize: 11, fontWeight: i===0 ? 800 : 600, color: i===0 ? '#fff' : 'rgba(255,255,255,0.4)' }}>{mo}</div>
                        ))}
                      </div>
                      {/* VS cards */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ flex: 1, background: 'rgba(108,99,255,0.1)', borderRadius: 14, border: '1px solid rgba(108,99,255,0.4)', padding: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 52, height: 52, borderRadius: 10, background: 'rgba(108,99,255,0.25)' }} />
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', textAlign: 'center' }}>DUCKWORTH.</div>
                          <div style={{ background: '#3b82f620', borderRadius: 8, padding: '4px 10px', textAlign: 'center' }}>
                            <div style={{ fontSize: 14, fontWeight: 900, color: '#3b82f6' }}>9.2</div>
                            <div style={{ fontSize: 7, fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase' }}>ELITE</div>
                          </div>
                        </div>
                        <div style={{ background: 'rgba(108,99,255,0.15)', borderRadius: 10, padding: '8px 10px', flexShrink: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 900, color: '#6C63FF' }}>VS</div>
                        </div>
                        <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.1)', padding: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 52, height: 52, borderRadius: 10, background: 'rgba(255,255,255,0.08)' }} />
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', textAlign: 'center' }}>Blinding Lights</div>
                          <div style={{ background: '#0891b220', borderRadius: 8, padding: '4px 10px', textAlign: 'center' }}>
                            <div style={{ fontSize: 14, fontWeight: 900, color: '#0891b2' }}>8.7</div>
                            <div style={{ fontSize: 7, fontWeight: 800, color: '#0891b2', textTransform: 'uppercase' }}>GREAT</div>
                          </div>
                        </div>
                      </div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', textAlign: 'center', marginTop: 12, fontWeight: 600 }}>← Tap to pick your favorite →</div>
                    </div>
                    <button onClick={goNext} style={{ width: '100%', marginTop: 16, padding: 14, borderRadius: 100, background: 'linear-gradient(135deg, #6C63FF, #8b5cf6)', color: '#fff', fontSize: 15, fontWeight: 800, border: 'none', cursor: 'pointer' }}>Next →</button>
                    <button onClick={dismissWelcome} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'rgba(255,255,255,0.2)', marginTop: 10, display: 'block', width: '100%', textAlign: 'center' }}>Skip for now</button>
                  </>
                )}

                {/* ── Step 5: Friends ── */}
                {welcomeStep === 5 && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <button onClick={goBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', fontSize: 20, padding: 0, lineHeight: 1 }}>←</button>
                      <h2 style={{ fontSize: 20, fontWeight: 900, color: '#fff', letterSpacing: '-0.3px', margin: 0 }}>The more you rank, the more Lyra is yours.</h2>
                    </div>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.65, margin: '0 0 16px' }}>Add friends and see what they're rating in real time. The more you and your friends rank, the more your feed, your picks, and your app revolve around your actual taste.</p>
                    <div style={cardStyle}>
                      {MOCK_FRIENDS.map((f,i) => (
                        <div key={i} style={{ ...rowStyle, paddingBlock: 10, borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                          <div style={{ width: 34, height: 34, borderRadius: 17, background: f.color + '30', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <span style={{ fontSize: 12, fontWeight: 900, color: f.color }}>{f.initials}</span>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{f.name} <span style={{ fontWeight: 400, color: 'rgba(255,255,255,0.4)' }}>just rated</span></div>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.track}</div>
                          </div>
                          <div style={{ background: f.tc + '18', borderRadius: 8, padding: '4px 9px', textAlign: 'center', flexShrink: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 900, color: f.tc, lineHeight: 1 }}>{f.score.toFixed(1)}</div>
                            <div style={{ fontSize: 7, fontWeight: 800, color: f.tc, textTransform: 'uppercase', letterSpacing: 0.4 }}>{f.tier}</div>
                          </div>
                        </div>
                      ))}
                      <div style={{ marginTop: 12, background: 'rgba(108,99,255,0.1)', borderRadius: 10, border: '1px solid rgba(108,99,255,0.3)', padding: '10px 14px', textAlign: 'center', fontSize: 13, fontWeight: 800, color: '#8b5cf6' }}>
                        + Add friends
                      </div>
                    </div>
                    <button onClick={dismissWelcome} style={{ width: '100%', marginTop: 16, padding: 14, borderRadius: 100, background: 'linear-gradient(135deg, #6C63FF, #8b5cf6)', color: '#fff', fontSize: 15, fontWeight: 800, border: 'none', cursor: 'pointer' }}>Let's go →</button>
                  </>
                )}

              </div>
            </div>
          </div>
        );

  })();
}
