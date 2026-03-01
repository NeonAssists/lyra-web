import Link from 'next/link';
import { getArtworkHiRes } from '@/lib/itunes';

async function getTopSongs() {
  try {
    const res = await fetch('https://itunes.apple.com/us/rss/topsongs/limit=8/json', { next: { revalidate: 3600 } });
    const data = await res.json();
    return (data?.feed?.entry ?? []).map((e: any) => ({
      id: e.id?.attributes?.['im:id'],
      title: e['im:name']?.label ?? '',
      artist: e['im:artist']?.label ?? '',
      artwork: getArtworkHiRes(e['im:image']?.[2]?.label ?? ''),
    }));
  } catch { return []; }
}

async function getTopAlbums() {
  try {
    const res = await fetch('https://itunes.apple.com/us/rss/topalbums/limit=6/json', { next: { revalidate: 3600 } });
    const data = await res.json();
    return (data?.feed?.entry ?? []).map((e: any) => ({
      id: e.id?.attributes?.['im:id'],
      title: e['im:name']?.label ?? '',
      artist: e['im:artist']?.label ?? '',
      artwork: getArtworkHiRes(e['im:image']?.[2]?.label ?? ''),
    }));
  } catch { return []; }
}

function RatingPill({ score, color }: { score: string; color: string }) {
  return (
    <span style={{ color }} className="font-black text-lg tabular-nums">{score}</span>
  );
}

export default async function HomePage() {
  const [songs, albums] = await Promise.all([getTopSongs(), getTopAlbums()]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.05]" style={{ background: 'rgba(10,10,10,0.85)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-base font-black tracking-tight">Lyra</span>
          <div className="flex items-center gap-6">
            <Link href="#features" className="text-sm text-[#8E8E93] hover:text-white transition-colors hidden sm:block">Features</Link>
            <Link href="/u/nate7" className="text-sm text-[#8E8E93] hover:text-white transition-colors hidden sm:block">Profiles</Link>
            <Link href="/app" className="text-sm font-semibold bg-white text-black px-4 py-1.5 rounded-full hover:bg-white/90 transition-all">Open App</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-widest text-[#6C63FF] uppercase mb-6">Now in Beta</p>
            <h1 className="text-[clamp(2.8rem,7vw,5rem)] font-black leading-[1.05] tracking-tight mb-6">
              Your music.<br />Your ratings.<br /><span className="text-[#8E8E93]">Shared.</span>
            </h1>
            <p className="text-lg text-[#8E8E93] leading-relaxed max-w-lg mb-10">
              Lyra is where music people rank what they listen to. Decimal ratings, not stars. Real opinions, not algorithms.
            </p>
            <div className="flex items-center gap-4 flex-wrap">
              <Link href="/app" className="inline-flex items-center gap-2 bg-[#6C63FF] text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-[#5a52e0] transition-all hover:scale-[1.02] active:scale-[0.98]">
                Try the web app
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
              <a href="#" className="inline-flex items-center gap-2 text-sm font-semibold text-[#8E8E93] hover:text-white transition-colors">
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                iOS App — Coming Soon
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* App preview strip */}
      {songs.length > 0 && (
        <section className="px-6 pb-24">
          <div className="max-w-5xl mx-auto">
            {/* Phone mockup + chart */}
            <div className="flex gap-6 items-start flex-col lg:flex-row">

              {/* Phone mockup */}
              <div className="flex-shrink-0 mx-auto lg:mx-0">
                <div className="relative w-[240px] rounded-[38px] border border-white/[0.12] overflow-hidden" style={{ background: '#111', boxShadow: '0 40px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)' }}>
                  {/* Notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 rounded-b-2xl z-10" style={{ background: '#0a0a0a' }} />
                  {/* Screen */}
                  <div className="pt-10 pb-4 px-4 space-y-2.5" style={{ background: '#0a0a0a', minHeight: 420 }}>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-black text-white">Lyra</span>
                      <span className="text-[10px] text-[#8E8E93]">Hot Ranked</span>
                    </div>
                    {songs.slice(0, 5).map((song: any, i: number) => {
                      const ratings = [9.2, 8.7, 8.1, 7.6, 7.2];
                      const colors = ['#34C759', '#34C759', '#FFD60A', '#FFD60A', '#FF9F0A'];
                      return (
                        <div key={song.id} className="flex items-center gap-2.5">
                          <img src={song.artwork} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-semibold truncate text-white">{song.title}</p>
                            <p className="text-[10px] truncate" style={{ color: '#8E8E93' }}>{song.artist}</p>
                          </div>
                          <span className="text-xs font-black tabular-nums flex-shrink-0" style={{ color: colors[i] }}>{ratings[i]}</span>
                        </div>
                      );
                    })}
                    <div className="mt-4 pt-3 border-t border-white/[0.06]">
                      <div className="rounded-xl p-3" style={{ background: '#1c1c1e' }}>
                        <div className="flex items-center gap-2 mb-2">
                          {songs[0] && <img src={songs[0].artwork} alt="" className="w-8 h-8 rounded-lg object-cover" />}
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-semibold truncate">{songs[0]?.title}</p>
                            <p className="text-[10px]" style={{ color: '#8E8E93' }}>{songs[0]?.artist}</p>
                          </div>
                        </div>
                        <div className="flex items-baseline gap-1 justify-center py-1">
                          <span className="text-4xl font-black" style={{ color: '#34C759', letterSpacing: '-2px' }}>9.2</span>
                          <span className="text-sm" style={{ color: '#48484A' }}>/ 10</span>
                        </div>
                        <p className="text-center text-[10px]" style={{ color: '#6C63FF' }}>Masterpiece</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chart list */}
              <div className="flex-1 w-full">
                <div className="flex items-baseline justify-between mb-5">
                  <div>
                    <h2 className="text-xl font-black">What&apos;s being ranked</h2>
                    <p className="text-sm text-[#8E8E93] mt-1">Live from the US charts</p>
                  </div>
                  <Link href="/app" className="text-xs text-[#6C63FF] font-semibold hover:underline">See all →</Link>
                </div>
                <div className="space-y-1">
                  {songs.slice(0, 8).map((song: any, i: number) => (
                    <Link href={`/app?q=${encodeURIComponent(song.title)}`} key={song.id}
                      className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/[0.04] transition-colors group cursor-pointer">
                      <span className="text-sm font-bold tabular-nums w-5 text-right" style={{ color: '#48484A' }}>{i + 1}</span>
                      <img src={song.artwork} alt={song.title} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{song.title}</p>
                        <p className="text-xs truncate" style={{ color: '#8E8E93' }}>{song.artist}</p>
                      </div>
                      <span className="text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#6C63FF' }}>Rate →</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      <section id="features" className="px-6 py-24 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-xs font-semibold tracking-widest text-[#6C63FF] uppercase mb-4">How it works</p>
              <h2 className="text-4xl font-black tracking-tight leading-tight mb-6">Rate anything.<br />From 0.1 to 10.</h2>
              <p className="text-[#8E8E93] leading-relaxed mb-8">Not five stars. Not thumbs. A real decimal number that actually says something. The difference between a 7.4 and an 8.2 is real — Lyra lets you say it.</p>
              <div className="space-y-4">
                {[
                  { num: '01', text: 'Search any song, album, or artist' },
                  { num: '02', text: 'Set your decimal rating (0.1 – 10.0)' },
                  { num: '03', text: 'Add a note and tags optionally' },
                  { num: '04', text: 'Your profile updates instantly — share it' },
                ].map(f => (
                  <div key={f.num} className="flex items-start gap-4">
                    <span className="text-xs font-black tabular-nums mt-0.5" style={{ color: '#48484A' }}>{f.num}</span>
                    <p className="text-sm text-[#8E8E93]">{f.text}</p>
                  </div>
                ))}
              </div>
            </div>
            {/* Rating showcase */}
            <div className="space-y-3">
              {[
                { title: 'good kid, m.A.A.d city', artist: 'Kendrick Lamar', rating: '9.8', color: '#34C759' },
                { title: 'After Hours', artist: 'The Weeknd', rating: '8.4', color: '#34C759' },
                { title: 'Certified Lover Boy', artist: 'Drake', rating: '6.7', color: '#FFD60A' },
                { title: 'Donda', artist: 'Kanye West', rating: '7.1', color: '#FFD60A' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-2xl border border-white/[0.06]" style={{ background: '#141414' }}>
                  <div className="w-11 h-11 rounded-xl flex-shrink-0" style={{ background: '#1c1c1e' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{item.title}</p>
                    <p className="text-xs" style={{ color: '#8E8E93' }}>{item.artist}</p>
                  </div>
                  <span className="text-xl font-black tabular-nums flex-shrink-0" style={{ color: item.color, letterSpacing: '-0.5px' }}>{item.rating}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Profiles */}
      <section className="px-6 py-24 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1">
              {/* Profile card mockup */}
              <div className="rounded-2xl border border-white/[0.06] overflow-hidden" style={{ background: '#111' }}>
                <div className="p-6 border-b border-white/[0.06]">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-black" style={{ background: '#6C63FF' }}>N</div>
                    <div>
                      <p className="font-black text-lg">Nate</p>
                      <p className="text-sm" style={{ color: '#8E8E93' }}>@nate7</p>
                    </div>
                  </div>
                  <div className="flex gap-6 mt-5">
                    <div><p className="text-xl font-black">47</p><p className="text-xs uppercase tracking-wider" style={{ color: '#8E8E93' }}>Ranked</p></div>
                    <div><p className="text-xl font-black" style={{ color: '#34C759' }}>8.1</p><p className="text-xs uppercase tracking-wider" style={{ color: '#8E8E93' }}>Avg</p></div>
                    <div><p className="text-xl font-black">12</p><p className="text-xs uppercase tracking-wider" style={{ color: '#8E8E93' }}>Lists</p></div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-px" style={{ background: '#0a0a0a' }}>
                  {albums.slice(0, 6).map((album: any, i: number) => {
                    const ratings = ['9.2', '8.7', '8.1', '7.9', '7.6', '7.2'];
                    const colors = ['#34C759', '#34C759', '#34C759', '#FFD60A', '#FFD60A', '#FFD60A'];
                    return (
                      <div key={album.id} className="relative aspect-square">
                        <img src={album.artwork} alt={album.title} className="w-full h-full object-cover" />
                        <div className="absolute bottom-1 right-1 rounded-md px-1.5 py-0.5" style={{ background: 'rgba(0,0,0,0.75)' }}>
                          <span className="text-xs font-black tabular-nums" style={{ color: colors[i] }}>{ratings[i]}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <p className="text-xs font-semibold tracking-widest text-[#6C63FF] uppercase mb-4">Shareable profiles</p>
              <h2 className="text-4xl font-black tracking-tight leading-tight mb-6">Your taste.<br />A real URL.</h2>
              <p className="text-[#8E8E93] leading-relaxed mb-6">Every Lyra profile is public and shareable. Send your ranked history to anyone — no app required to view it. It&apos;s just a link.</p>
              <code className="block text-sm px-4 py-3 rounded-xl border border-white/[0.08] mb-8" style={{ background: '#141414', color: '#6C63FF' }}>lyra.app/u/yourhandle</code>
              <Link href="/u/nate7" className="inline-flex items-center gap-2 text-sm font-semibold hover:underline" style={{ color: '#6C63FF' }}>
                See an example profile →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-5xl font-black tracking-tight mb-5">Start ranking.</h2>
          <p className="text-[#8E8E93] mb-10 max-w-sm mx-auto">Free. No algorithm. Just your music and your opinion.</p>
          <div className="flex items-center gap-4 justify-center flex-wrap">
            <Link href="/app" className="inline-flex items-center gap-2 bg-[#6C63FF] text-white text-sm font-semibold px-8 py-3.5 rounded-xl hover:bg-[#5a52e0] transition-all hover:scale-[1.02]">
              Open Lyra →
            </Link>
            <a href="#" className="text-sm font-semibold text-[#8E8E93] hover:text-white transition-colors">iOS App (soon)</a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-10 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <span className="font-black text-sm">Lyra</span>
          <div className="flex items-center gap-6 text-xs" style={{ color: '#48484A' }}>
            <Link href="/app" className="hover:text-white transition-colors">Web App</Link>
            <Link href="/u/nate7" className="hover:text-white transition-colors">Profiles</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <span>© 2025</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
