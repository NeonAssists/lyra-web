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
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.05]"
        style={{ background: 'rgba(10,10,10,0.85)', backdropFilter: 'blur(16px)' }}>
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-base font-black tracking-tight">Lyra</span>
          <div className="flex items-center gap-3">
            <Link href="#features" className="text-sm text-[#8E8E93] hover:text-white transition-colors hidden sm:block">Features</Link>
            <Link href="#how" className="text-sm text-[#8E8E93] hover:text-white transition-colors hidden sm:block">How it works</Link>
            <Link href="/login"
              className="text-sm font-semibold bg-[#6C63FF] text-white px-4 py-1.5 rounded-full hover:opacity-90 transition-opacity">
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-36 pb-24 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-bold tracking-widest text-[#6C63FF] uppercase mb-5">Now in Beta</p>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black leading-[1.05] tracking-tight mb-6">
            Rate music.<br />
            Build taste.<br />
            <span className="text-[#8E8E93]">Share it.</span>
          </h1>
          <p className="text-lg text-[#8E8E93] max-w-xl mx-auto mb-10 leading-relaxed">
            The music ranking app for people who actually care about what they listen to. Decimal scores. Real taste. No algorithm.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link href="/login"
              className="inline-flex items-center gap-2 bg-[#6C63FF] text-white font-bold px-7 py-3.5 rounded-full text-base hover:opacity-90 transition-opacity">
              Join the Beta
              <svg width="16" height="16" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </Link>
            <Link href="/u/nate7"
              className="inline-flex items-center gap-2 text-white/70 font-semibold px-6 py-3.5 rounded-full border border-white/10 text-base hover:border-white/20 hover:text-white transition-all">
              See Example Profile
            </Link>
          </div>
          <p className="text-sm text-[#48484a] mt-6">Free to use · No algorithms · Real opinions</p>
        </div>
      </section>

      {/* Social proof strip */}
      <section className="py-6 border-y border-white/[0.05]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-center gap-8 flex-wrap text-center">
            {[
              { val: '10.0', label: 'Rating scale' },
              { val: '0.1', label: 'Step precision' },
              { val: '∞', label: 'Songs to rank' },
              { val: '100%', label: 'Taste-driven' },
            ].map(({ val, label }) => (
              <div key={label} className="flex flex-col items-center">
                <span className="text-2xl font-black text-white">{val}</span>
                <span className="text-xs text-[#636366] font-medium mt-0.5">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-bold tracking-widest text-[#6C63FF] uppercase mb-4">What you get</p>
            <h2 className="text-3xl sm:text-4xl font-black">Everything you need to rank what matters.</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: '⭐', title: 'Rate Anything', desc: 'Songs, albums, EPs. Decimal scores 1.0–10.0. Your taste, precisely calibrated.' },
              { icon: '👥', title: 'See What Friends Rate', desc: 'Follow friends, see their picks, discover music through people you trust.' },
              { icon: '📋', title: 'Build Lists', desc: 'Create ranked lists, share them, collaborate. Your definitive albums of the decade.' },
              { icon: '🔥', title: 'Community Picks', desc: 'See what\'s rated 8+ by the people you follow. The best filter in music.' },
              { icon: '🎵', title: 'Discovery Packs', desc: 'Swipe-based music discovery that learns your taste and finds underground artists.' },
              { icon: '🌍', title: 'World Music Weekly', desc: 'A curated regional spotlight — new genre and region every week.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="bg-[#1c1c1e] border border-white/[0.06] rounded-2xl p-6 hover:border-white/10 transition-colors">
                <div className="text-2xl mb-4">{icon}</div>
                <h3 className="text-base font-bold text-white mb-2">{title}</h3>
                <p className="text-sm text-[#8E8E93] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-24 px-6 border-t border-white/[0.05]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-bold tracking-widest text-[#6C63FF] uppercase mb-4">Get started</p>
            <h2 className="text-3xl sm:text-4xl font-black">Three steps to start ranking.</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { n: '01', title: 'Search', desc: 'Find any song or album in the Lyra catalog, powered by Apple Music.' },
              { n: '02', title: 'Rate', desc: 'Give it a decimal score from 1.0 to 10.0. Add notes. Tag it.' },
              { n: '03', title: 'Share', desc: 'Your profile updates instantly. Share your taste with friends.' },
            ].map(({ n, title, desc }) => (
              <div key={n} className="flex flex-col items-center text-center">
                <span className="text-5xl font-black text-[#6C63FF] mb-4 leading-none">{n}</span>
                <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
                <p className="text-sm text-[#8E8E93] leading-relaxed max-w-xs">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA bottom */}
      <section className="py-24 px-6 text-center border-t border-white/[0.05]">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-black mb-4">
            Your music.<br />Your ratings.<br />
            <span className="text-[#8E8E93]">Shared.</span>
          </h2>
          <p className="text-[#8E8E93] text-base mb-8 leading-relaxed">
            Free to use. No algorithms. Just real people sharing real opinions about the music they love.
          </p>
          <Link href="/login"
            className="inline-flex items-center gap-2 bg-[#6C63FF] text-white font-bold px-8 py-4 rounded-full text-base hover:opacity-90 transition-opacity">
            Join the Beta →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.05] py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm font-black text-white">Lyra</span>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="text-xs text-[#636366] hover:text-white transition-colors">Privacy Policy</Link>
            <a href="https://github.com/NeonAssists/lyra-web" target="_blank" rel="noopener noreferrer"
              className="text-xs text-[#636366] hover:text-white transition-colors">GitHub</a>
          </div>
          <span className="text-xs text-[#48484a]">© 2026 Lyra. Made for music obsessives.</span>
        </div>
      </footer>
    </div>
  );
}
