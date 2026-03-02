'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/app');
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] px-4">
      <Link href="/" className="mb-10 text-3xl font-black tracking-tight text-white">
        Lyra
      </Link>
      <div className="w-full max-w-sm rounded-3xl border border-white/[0.08] bg-[#141414] p-8">
        <h1 className="mb-1 text-xl font-black text-white">Sign in</h1>
        <p className="mb-6 text-sm text-[#8E8E93]">Welcome back</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#8E8E93]">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full rounded-xl border border-white/[0.08] bg-[#1c1c1e] px-4 py-3 text-sm text-white placeholder-[#48484A] outline-none transition-colors focus:border-[#6C63FF]/60"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#8E8E93]">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full rounded-xl border border-white/[0.08] bg-[#1c1c1e] px-4 py-3 text-sm text-white placeholder-[#48484A] outline-none transition-colors focus:border-[#6C63FF]/60"
            />
          </div>

          {error && (
            <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#6C63FF] py-3 text-sm font-bold text-white transition-opacity disabled:opacity-60 hover:opacity-90"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#8E8E93]">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="font-semibold text-[#6C63FF] hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
