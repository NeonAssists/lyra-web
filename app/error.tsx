'use client';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div style={{
      minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif', padding: 24, textAlign: 'center',
    }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 12 }}>Something went wrong</h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 24, maxWidth: 400 }}>
          {error?.message || 'An unexpected error occurred.'}
        </p>
        <button onClick={reset} style={{
          padding: '12px 28px', borderRadius: 100, background: '#6C63FF', color: '#fff',
          fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer',
        }}>
          Try Again
        </button>
      </div>
    </div>
  );
}
