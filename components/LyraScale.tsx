'use client';

const TIERS = [
  { min: 1.0, max: 1.9, label: "Skip",      color: "#ef4444" },
  { min: 2.0, max: 2.9, label: "Weak",      color: "#f97316" },
  { min: 3.0, max: 3.9, label: "Meh",       color: "#f59e0b" },
  { min: 4.0, max: 4.9, label: "Below avg", color: "#eab308" },
  { min: 5.0, max: 5.9, label: "Average",   color: "#84cc16" },
  { min: 6.0, max: 6.9, label: "Decent",    color: "#22c55e" },
  { min: 7.0, max: 7.9, label: "Good",      color: "#10b981" },
  { min: 8.0, max: 8.9, label: "Great",     color: "#06b6d4" },
  { min: 9.0, max: 9.9, label: "Elite",     color: "#6366f1" },
  { min: 10.0, max: 10.0, label: "Masterpiece", color: "#8b5cf6" },
];

function isActive(tier: typeof TIERS[number], rating?: number) {
  if (rating == null || rating <= 0) return false;
  return rating >= tier.min && rating <= tier.max;
}

function CompactScale({ currentRating }: { currentRating?: number }) {
  return (
    <div style={{ padding: '12px 0 8px' }}>
      <div style={{ display: 'flex', gap: 4, overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
        {TIERS.map(tier => {
          const active = isActive(tier, currentRating);
          return (
            <div key={tier.min} style={{
              minWidth: 52, height: 48, borderRadius: 10,
              background: active ? tier.color + '30' : tier.color + '18',
              border: `1.5px solid ${active ? tier.color : tier.color + '30'}`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
              opacity: active ? 1 : 0.4,
              transform: active ? 'scale(1.05)' : 'scale(1)',
              transition: 'all 0.15s',
              flexShrink: 0,
            }}>
              <span style={{
                fontSize: 14, fontWeight: active ? 900 : 700,
                color: active ? '#fff' : tier.color,
                lineHeight: 1,
              }}>
                {tier.min === 10 ? '10' : Math.floor(tier.min)}
              </span>
              <span style={{
                fontSize: 8, fontWeight: active ? 700 : 500,
                color: active ? '#fff' : tier.color,
                lineHeight: 1, textTransform: 'uppercase', letterSpacing: 0.3,
              }}>
                {tier.label}
              </span>
            </div>
          );
        })}
      </div>
      <p style={{
        fontSize: 11, color: 'rgba(255,255,255,0.2)', fontStyle: 'italic',
        textAlign: 'center', marginTop: 8, lineHeight: 1.4,
      }}>
        Every decimal matters. There&apos;s a real difference between a 7.3 and a 7.8.
      </p>
    </div>
  );
}

function FullScale({ currentRating }: { currentRating?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '8px 0' }}>
      {TIERS.map(tier => {
        const active = isActive(tier, currentRating);
        const widthPct = (tier.min / 10) * 100;
        return (
          <div key={tier.min} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            opacity: active ? 1 : 0.6,
            transition: 'opacity 0.15s',
          }}>
            <span style={{
              width: 22, textAlign: 'right', fontSize: 12, fontWeight: 800,
              color: active ? '#fff' : 'rgba(255,255,255,0.4)', flexShrink: 0,
            }}>
              {tier.min === 10 ? '10' : Math.floor(tier.min)}
            </span>
            <div style={{
              flex: 1, height: 24 + (tier.min / 10) * 8,
              background: tier.color + (active ? '40' : '20'),
              borderRadius: 6, position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                width: `${widthPct}%`, height: '100%',
                background: tier.color, borderRadius: 6,
                opacity: active ? 1 : 0.7,
                transition: 'opacity 0.15s',
              }} />
            </div>
            <span style={{
              fontSize: 11, fontWeight: active ? 800 : 600, minWidth: 60,
              color: active ? tier.color : 'rgba(255,255,255,0.35)',
            }}>
              {tier.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function LyraScale({ size = "compact", currentRating }: { size?: "compact" | "full"; currentRating?: number }) {
  return size === "compact" ? <CompactScale currentRating={currentRating} /> : <FullScale currentRating={currentRating} />;
}
