'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.05]" style={{ background: 'rgba(10,10,10,0.8)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-base font-black tracking-tight">Lyra</span>
          <div className="flex items-center gap-6">
            <Link href="#features" className="text-sm text-[#8E8E93] hover:text-white transition-colors hidden sm:block">Features</Link>
            <Link href="#how" className="text-sm text-[#8E8E93] hover:text-white transition-colors hidden sm:block">How it works</Link>
            <Link href="/app" className="text-sm font-semibold bg-white text-black px-4 py-1.5 rounded-full hover:bg-white/90 transition-all">Open App</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <p className="text-xs font-semibold tracking-widest text-[#6C63FF] uppercase mb-6">Now in Beta</p>
            <h1 className="text-[clamp(2.5rem,8vw,5.5rem)] font-black leading-[1.05] tracking-tight mb-6 max-w-4xl mx-auto">
              Rate music.<br />Build taste.<br /><span style={{ color: '#8E8E93' }}>Share it.</span>
            </h1>
            <p className="text-lg text-[#8E8E93] leading-relaxed max-w-2xl mx-auto mb-12">
              The music ranking app built for people who actually care about what they listen to.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link 
                href="/app" 
                className="inline-flex items-center gap-2 bg-[#6C63FF] text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-[#5a52e0] transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Join the Beta
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
              <button 
                onClick={() => {
                  const phones = document.querySelector('[data-phones]');
                  phones?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                className="inline-flex items-center gap-2 text-sm font-semibold border border-white/[0.2] text-white px-6 py-3 rounded-xl hover:border-white/[0.4] transition-all"
              >
                See how it works
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
              </button>
            </div>
          </div>

          {/* iPhone Mockups */}
          <div data-phones className="relative h-[600px] lg:h-[550px] mb-20">
            <div className="flex items-center justify-center h-full relative">
              {/* Phone 1: Community Picks (Left) */}
              <div className="absolute left-0 lg:left-0 top-0 w-[280px]" style={{ transform: 'translateY(-20px)', zIndex: 3 }}>
                <div 
                  className="relative rounded-[55px] overflow-hidden border-[12px] border-black"
                  style={{
                    width: '280px',
                    background: '#111',
                    boxShadow: '0 0 40px rgba(108, 99, 255, 0.15), 0 40px 80px rgba(0,0,0,0.8)'
                  }}
                >
                  {/* Dynamic Island */}
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 w-32 h-7 rounded-full z-20" style={{ background: '#000' }} />
                  
                  {/* Screen */}
                  <div className="pt-12 pb-6 px-4" style={{ background: '#0a0a0a', minHeight: '580px' }}>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-6">
                        <span className="text-xs font-black">Community</span>
                        <span className="text-[10px] text-[#8E8E93]">Picks</span>
                      </div>
                      
                      {/* Song 1 */}
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg flex-shrink-0" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold truncate">HUMBLE.</p>
                          <p className="text-[10px] truncate text-[#8E8E93]">Kendrick Lamar</p>
                        </div>
                        <span className="text-xs font-black flex-shrink-0" style={{ color: '#6C63FF' }}>9.2</span>
                      </div>

                      {/* Song 2 */}
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg flex-shrink-0" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold truncate">CAIRO</p>
                          <p className="text-[10px] truncate text-[#8E8E93]">Travis Scott</p>
                        </div>
                        <span className="text-xs font-black flex-shrink-0" style={{ color: '#00B4DB' }}>8.7</span>
                      </div>

                      {/* Song 3 */}
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg flex-shrink-0" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold truncate">Snooze</p>
                          <p className="text-[10px] truncate text-[#8E8E93]">SZA</p>
                        </div>
                        <span className="text-xs font-black flex-shrink-0" style={{ color: '#34C759' }}>9.4</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Phone 2: Rating Modal (Center) */}
              <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-[280px]" style={{ zIndex: 5 }}>
                <div 
                  className="relative rounded-[55px] overflow-hidden border-[12px] border-black"
                  style={{
                    width: '280px',
                    background: '#111',
                    boxShadow: '0 0 60px rgba(108, 99, 255, 0.25), 0 60px 120px rgba(0,0,0,0.9)'
                  }}
                >
                  {/* Dynamic Island */}
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 w-32 h-7 rounded-full z-20" style={{ background: '#000' }} />
                  
                  {/* Screen */}
                  <div className="pt-12 pb-6 px-4" style={{ background: '#0a0a0a', minHeight: '580px' }}>
                    <div className="flex flex-col items-center justify-center h-full gap-4">
                      {/* Album Art */}
                      <div className="w-32 h-32 rounded-2xl flex-shrink-0 mb-4" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }} />
                      
                      {/* Song Info */}
                      <div className="text-center">
                        <p className="text-xs font-semibold">HUMBLE.</p>
                        <p className="text-[11px] text-[#8E8E93]">Kendrick Lamar</p>
                      </div>

                      {/* Rating Display */}
                      <div className="text-center py-4">
                        <span className="text-5xl font-black" style={{ color: '#6C63FF', letterSpacing: '-2px' }}>8.4</span>
                        <p className="text-[10px] text-[#8E8E93] mt-1">Excellent</p>
                      </div>

                      {/* Slider (visual only) */}
                      <div className="w-full">
                        <div className="h-1.5 rounded-full" style={{ background: '#1c1c1e' }}>
                          <div className="h-full rounded-full w-[84%]" style={{ background: '#6C63FF' }} />
                        </div>
                      </div>

                      {/* Button */}
                      <button className="w-full py-2.5 rounded-lg text-xs font-semibold mt-4" style={{ background: '#6C63FF', color: '#fff' }}>
                        Save Rating
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Phone 3: Profile (Right) */}
              <div className="absolute right-0 lg:right-0 top-12 w-[280px]" style={{ transform: 'translateY(40px)', zIndex: 1 }}>
                <div 
                  className="relative rounded-[55px] overflow-hidden border-[12px] border-black"
                  style={{
                    width: '280px',
                    background: '#111',
                    boxShadow: '0 0 40px rgba(108, 99, 255, 0.1), 0 40px 80px rgba(0,0,0,0.8)'
                  }}
                >
                  {/* Dynamic Island */}
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 w-32 h-7 rounded-full z-20" style={{ background: '#000' }} />
                  
                  {/* Screen */}
                  <div className="pt-12 pb-6 px-4" style={{ background: '#0a0a0a', minHeight: '580px' }}>
                    <div className="space-y-4">
                      {/* Profile Header */}
                      <div className="flex items-center gap-3 pb-4 border-b border-white/[0.1]">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black" style={{ background: '#6C63FF' }}>
                          N
                        </div>
                        <div>
                          <p className="text-xs font-semibold">nate7</p>
                          <p className="text-[10px] text-[#8E8E93]">Music obsessive</p>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-2 pb-4 border-b border-white/[0.1]">
                        <div className="text-center">
                          <p className="text-xs font-black">42</p>
                          <p className="text-[9px] text-[#8E8E93]">Ranked</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-black">8</p>
                          <p className="text-[9px] text-[#8E8E93]">Following</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-black">12</p>
                          <p className="text-[9px] text-[#8E8E93]">Followers</p>
                        </div>
                      </div>

                      {/* Top Songs */}
                      <div className="space-y-2">
                        {[
                          { title: 'HUMBLE.', rating: '9.2', color: '#6C63FF' },
                          { title: 'CAIRO', rating: '8.7', color: '#00B4DB' },
                          { title: 'Snooze', rating: '9.4', color: '#34C759' },
                        ].map((song, i) => (
                          <div key={i} className="flex items-center justify-between text-[10px]">
                            <span className="truncate font-semibold">{song.title}</span>
                            <span className="font-black flex-shrink-0" style={{ color: song.color }}>{song.rating}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-6 py-24 border-t border-white/[0.05]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold tracking-widest text-[#6C63FF] uppercase mb-4">The Music Rating Platform</p>
            <h2 className="text-4xl lg:text-5xl font-black tracking-tight mb-6">Everything you need to<br />rank what matters.</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                emoji: '🎵',
                title: 'Rate Anything',
                description: 'Songs, albums, EPs. Decimal scores 1.0–10.0. Your taste, precisely calibrated.'
              },
              {
                emoji: '👥',
                title: 'See What Friends Rate',
                description: 'Follow friends, see their picks, discover music through people you trust.'
              },
              {
                emoji: '📋',
                title: 'Build Lists',
                description: 'Create ranked lists, share them, collaborate. Your definitive albums of the decade.'
              },
              {
                emoji: '🔥',
                title: 'Community Picks',
                description: 'See what\'s rated 8+ by the people you follow. The best filter in music.'
              },
            ].map((feature, i) => (
              <div 
                key={i}
                className="p-8 rounded-2xl border border-white/[0.08] hover:border-white/[0.15] transition-colors"
                style={{ background: '#111' }}
              >
                <div className="text-4xl mb-4">{feature.emoji}</div>
                <h3 className="text-lg font-black mb-3">{feature.title}</h3>
                <p className="text-sm text-[#8E8E93] leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="px-6 py-24 border-t border-white/[0.05]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <p className="text-xs font-semibold tracking-widest text-[#6C63FF] uppercase mb-4">Get Started</p>
            <h2 className="text-4xl lg:text-5xl font-black tracking-tight mb-6">Three steps to<br />start ranking.</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-12 max-w-4xl mx-auto">
            {[
              {
                num: '01',
                title: 'Search',
                description: 'Search any song or album in the Lyra app.'
              },
              {
                num: '02',
                title: 'Rate',
                description: 'Give it a decimal rating from 1.0 to 10.0.'
              },
              {
                num: '03',
                title: 'Share',
                description: 'Your profile updates instantly. Share it.'
              },
            ].map((step, i) => (
              <div key={i} className="text-center">
                <div className="text-5xl font-black mb-4" style={{ color: '#6C63FF' }}>{step.num}</div>
                <h3 className="text-xl font-black mb-3">{step.title}</h3>
                <p className="text-sm text-[#8E8E93] leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="px-6 py-24 border-t border-white/[0.05]">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/[0.08]" style={{ background: 'rgba(108, 99, 255, 0.08)' }}>
            <span className="text-sm font-semibold">✨</span>
            <span className="text-sm font-semibold">Join 500+ music lovers already ranking</span>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-24 border-t border-white/[0.05]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl lg:text-5xl font-black tracking-tight mb-6">Your music.<br />Your ratings.<br />Shared.</h2>
          <p className="text-lg text-[#8E8E93] mb-12 max-w-2xl mx-auto">
            Free to use. No algorithms. Just real people sharing real opinions about the music they love.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link 
              href="/app" 
              className="inline-flex items-center gap-2 bg-[#6C63FF] text-white text-sm font-semibold px-8 py-3.5 rounded-xl hover:bg-[#5a52e0] transition-all hover:scale-[1.02]"
            >
              Join the Beta
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
            <Link 
              href="/u/nate7" 
              className="inline-flex items-center gap-2 text-sm font-semibold border border-white/[0.2] text-white px-8 py-3.5 rounded-xl hover:border-white/[0.4] transition-all"
            >
              See Example Profile
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 border-t border-white/[0.05]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-8 border-b border-white/[0.05]">
            <span className="font-black text-lg">Lyra</span>
            <div className="flex items-center gap-8 text-sm text-[#8E8E93]">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <a href="https://github.com/NeonAssists" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">GitHub</a>
              <span>Made for music obsessives</span>
            </div>
          </div>
          <div className="pt-8 text-center text-xs text-[#48484A]">
            © 2025 Lyra. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
