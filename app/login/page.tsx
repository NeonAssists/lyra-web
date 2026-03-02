'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [handle, setHandle] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setError(error.message); setLoading(false); return; }
      router.push('/app');
    } else {
      if (handle.length < 2) { setError('Handle must be at least 2 characters'); setLoading(false); return; }
      const { data, error: signupError } = await supabase.auth.signUp({ email, password });
      if (signupError) { setError(signupError.message); setLoading(false); return; }
      if (data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          handle: handle.toLowerCase().replace(/[^a-z0-9_]/g, ''),
          display_name: displayName || handle,
          plan: 'free',
        });
      }
      router.push('/app');
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) { setError('Enter your email first'); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    if (error) { setError(error.message); return; }
    setResetSent(true);
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#000000] flex flex-col items-center justify-center px-7 py-12">

      {/* Logo section — matches app */}
      <div className="flex flex-col items-center mb-12">
        <div className="w-20 h-20 rounded-full bg-[#6C63FF]/15 border border-[#6C63FF]/25 flex items-center justify-center mb-4">
          <svg width="36" height="36" fill="none" stroke="#6C63FF" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="8" cy="18" r="3"/><circle cx="18" cy="16" r="3"/><path d="M11 18V6l10-2v10"/>
          </svg>
        </div>
        <h1 className="text-[40px] font-extrabold tracking-[-2px] text-white leading-none">Lyra</h1>
        <p className="text-[16px] text-[#8E8E93] mt-1.5">Your music, ranked.</p>
      </div>

      <div className="w-full max-w-[380px]">
        {/* Mode toggle — matches app's pill switch */}
        <div className="flex bg-[#1c1c1e] rounded-[16px] p-1 border border-white/[0.08] mb-6">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); }}
            className={`flex-1 py-3 rounded-[13px] text-[15px] font-semibold transition-all ${mode === 'login' ? 'bg-[#2c2c2e] text-white' : 'text-[#636366]'}`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setError(''); }}
            className={`flex-1 py-3 rounded-[13px] text-[15px] font-semibold transition-all ${mode === 'signup' ? 'bg-[#2c2c2e] text-white' : 'text-[#636366]'}`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'signup' && (
            <>
              {/* Display name */}
              <div className="flex items-center bg-[#1c1c1e] rounded-[16px] px-4 py-3.5 gap-3 border border-white/[0.08]">
                <svg width="18" height="18" fill="none" stroke="#636366" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <input
                  value={displayName} onChange={e => setDisplayName(e.target.value)}
                  placeholder="Display Name"
                  className="flex-1 bg-transparent text-[16px] text-white placeholder-[#636366] outline-none"
                />
              </div>
              {/* Handle */}
              <div className="flex items-center bg-[#1c1c1e] rounded-[16px] px-4 py-3.5 gap-3 border border-white/[0.08]">
                <svg width="18" height="18" fill="none" stroke="#636366" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"/></svg>
                <input
                  value={handle} onChange={e => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="Handle (e.g. lyrafan)"
                  className="flex-1 bg-transparent text-[16px] text-white placeholder-[#636366] outline-none"
                  autoCapitalize="none"
                  required
                />
              </div>
            </>
          )}

          {/* Email */}
          <div className="flex items-center bg-[#1c1c1e] rounded-[16px] px-4 py-3.5 gap-3 border border-white/[0.08]">
            <svg width="18" height="18" fill="none" stroke="#636366" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="Email"
              className="flex-1 bg-transparent text-[16px] text-white placeholder-[#636366] outline-none"
              autoCapitalize="none"
              required
            />
          </div>

          {/* Password */}
          <div className="flex items-center bg-[#1c1c1e] rounded-[16px] px-4 py-3.5 gap-3 border border-white/[0.08]">
            <svg width="18" height="18" fill="none" stroke="#636366" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <input
              type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              className="flex-1 bg-transparent text-[16px] text-white placeholder-[#636366] outline-none"
              minLength={6}
              required
            />
            <button type="button" onClick={() => setShowPassword(v => !v)} className="text-[#636366] flex-none">
              {showPassword
                ? <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                : <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
            </button>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-[14px] px-4 py-3">
              <p className="text-[13px] text-red-400 font-medium">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button type="submit" onClick={handleSubmit as any} disabled={loading}
            className="w-full bg-[#6C63FF] rounded-[18px] py-4 flex items-center justify-center gap-2 text-[17px] font-bold text-white mt-2 active:opacity-80 disabled:opacity-60 transition-opacity">
            {loading
              ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <>
                  <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
                  <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </>}
          </button>

          {/* Forgot password */}
          {mode === 'login' && (
            <div className="text-center mt-2">
              {resetSent
                ? <p className="text-[13px] text-green-400">Reset link sent — check your email</p>
                : <button type="button" onClick={handleForgotPassword} className="text-[13px] text-[#6C63FF] underline">
                    Forgot password?
                  </button>}
            </div>
          )}
        </form>

        <p className="text-center text-[14px] text-[#8E8E93] mt-6">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button type="button" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
            className="font-semibold text-[#6C63FF]">
            {mode === 'login' ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  );
}
