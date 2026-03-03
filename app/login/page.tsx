'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

type Mode = 'login' | 'signup';

function Field({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '13px 16px' }}>
      <span style={{ color: 'rgba(255,255,255,0.35)', flexShrink: 0 }}>{icon}</span>
      {children}
    </div>
  );
}

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [handle, setHandle] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const inputStyle: React.CSSProperties = { flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 15, color: '#fff', fontFamily: 'inherit' };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(''); setLoading(true);
    try {
      if (mode === 'login') {
        const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) { setError(error.message); setLoading(false); return; }
        // Small delay to let session persist to localStorage
        await new Promise(r => setTimeout(r, 200));
        window.location.href = '/app';
      } else {
        if (handle.length < 2) { setError('Handle must be at least 2 characters'); setLoading(false); return; }
        if (password.length < 6) { setError('Password must be at least 6 characters'); setLoading(false); return; }
        const { data, error: err } = await supabase.auth.signUp({ email, password });
        if (err) { setError(err.message); setLoading(false); return; }
        if (data.user) {
          await supabase.from('profiles' as any).upsert({
            id: data.user.id,
            handle: handle.toLowerCase().replace(/[^a-z0-9_]/g, ''),
            display_name: displayName || handle,
            plan: 'free',
          });
        }
        await new Promise(r => setTimeout(r, 200));
        window.location.href = '/app';
      }
    } catch (e: any) {
      setError(e?.message || 'Something went wrong. Try again.');
      setLoading(false);
    }
  };

  const handleForgot = async () => {
    if (!email.trim()) { setError('Enter your email first'); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    if (error) { setError(error.message); return; }
    setResetSent(true); setError('');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif', position: 'relative', overflow: 'hidden' }}>

      {/* Ambient glow bg */}
      <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 600, height: 600, background: 'radial-gradient(circle, rgba(108,99,255,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Card */}
      <div style={{ width: '100%', maxWidth: 420, background: 'rgba(16,16,16,0.9)', backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 28, overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)' }}>

        {/* Logo header */}
        <div style={{ padding: '36px 32px 28px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(108,99,255,0.15)', border: '1px solid rgba(108,99,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <svg width="28" height="28" fill="none" stroke="#6C63FF" strokeWidth="2" viewBox="0 0 24 24"><circle cx="8" cy="18" r="3"/><circle cx="18" cy="16" r="3"/><path d="M11 18V6l10-2v10"/></svg>
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: '#fff', letterSpacing: '-1px', marginBottom: 6 }}>Lyra</h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>Your music, ranked.</p>
        </div>

        {/* Form */}
        <div style={{ padding: '28px 32px 32px' }}>

          {/* Mode toggle */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: 4, marginBottom: 24, border: '1px solid rgba(255,255,255,0.06)' }}>
            {(['login', 'signup'] as Mode[]).map(m => (
              <button key={m} onClick={() => { setMode(m); setError(''); }}
                style={{ flex: 1, padding: '10px 0', borderRadius: 11, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.15s', background: mode === m ? 'rgba(255,255,255,0.1)' : 'transparent', color: mode === m ? '#fff' : 'rgba(255,255,255,0.4)' }}>
                {m === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {mode === 'signup' && (
              <>
                <Field icon={<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}>
                  <input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Display name" style={{ ...inputStyle, '::placeholder': { color: 'rgba(255,255,255,0.3)' } } as any} />
                </Field>
                <Field icon={<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"/></svg>}>
                  <input value={handle} onChange={e => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} placeholder="Handle (e.g. lyrafan)" style={inputStyle} autoCapitalize="none" required />
                </Field>
              </>
            )}
            <Field icon={<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>}>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" style={inputStyle} autoCapitalize="none" required />
            </Field>
            <Field icon={<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}>
              <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" style={inputStyle} minLength={6} required />
              <button type="button" onClick={() => setShowPw(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', padding: 0, flexShrink: 0 }}>
                {showPw ? <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                : <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
              </button>
            </Field>

            {error && <div style={{ background: 'rgba(255,59,48,0.1)', border: '1px solid rgba(255,59,48,0.2)', borderRadius: 12, padding: '10px 14px' }}><p style={{ fontSize: 13, color: '#FF453A', fontWeight: 500 }}>{error}</p></div>}

            <button type="submit" disabled={loading}
              style={{ marginTop: 6, padding: '14px 0', borderRadius: 16, background: '#6C63FF', color: '#fff', fontSize: 15, fontWeight: 800, border: 'none', cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.7 : 1, transition: 'opacity 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {loading ? <div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                : <>{mode === 'login' ? 'Sign In' : 'Create Account'} <svg width="16" height="16" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></>}
            </button>

            {mode === 'login' && (
              <div style={{ textAlign: 'center', marginTop: 4 }}>
                {resetSent
                  ? <p style={{ fontSize: 13, color: '#34C759' }}>Reset link sent — check your email</p>
                  : <button type="button" onClick={handleForgot} style={{ fontSize: 13, color: '#6C63FF', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Forgot password?</button>}
              </div>
            )}
          </form>

          <p style={{ textAlign: 'center', fontSize: 14, color: 'rgba(255,255,255,0.4)', marginTop: 20 }}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }} style={{ color: '#6C63FF', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>
              {mode === 'login' ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
