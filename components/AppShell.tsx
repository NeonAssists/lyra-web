'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

type User = { id: string; handle: string; display_name: string; avatar_url: string | null };

const NAV = [
  { href: '/app',    label: 'Home',    icon: (a: boolean) => <svg width="24" height="24" fill={a ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 12L12 3l9 9"/><path d="M9 21V12h6v9"/></svg> },
  { href: '/music',  label: 'Music',   icon: (a: boolean) => <svg width="24" height="24" fill={a ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="8" cy="18" r="3"/><circle cx="18" cy="16" r="3"/><path d="M11 18V6l10-2v10"/></svg> },
  { href: '/ranked', label: 'Ranked',  icon: (a: boolean) => <svg width="24" height="24" fill={a ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
  { href: '/social', label: 'Social',  icon: (_a: boolean) => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  { href: '/profile-web', label: 'Profile', icon: (_a: boolean) => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [me, setMe] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        const { data: p } = await supabase.from('profiles')
          .select('id, handle, display_name, avatar_url').eq('id', data.user.id).single();
        setMe(p as User);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_ev, session) => {
      if (session?.user) {
        const { data: p } = await supabase.from('profiles')
          .select('id, handle, display_name, avatar_url').eq('id', session.user.id).single();
        setMe(p as User);
      } else setMe(null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const navItems = NAV.map(n => ({
    ...n,
    href: n.href === '/profile-web' ? (me ? `/u/${me.handle}` : '/login') : n.href,
  }));

  return (
    <div className="min-h-screen bg-[#000000] text-white flex flex-col">
      <main className="flex-1 pb-24">
        {children}
      </main>

      {/* Bottom tab bar — exactly like the app */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#000000]/95 backdrop-blur-xl border-t border-white/[0.1]">
        <div className="flex items-center justify-around px-2 pt-2 pb-safe" style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}>
          {navItems.map(({ href, label, icon }) => {
            const active = pathname === href ||
              (label !== 'Home' && pathname.startsWith(href) && href !== '/app');
            return (
              <Link key={label} href={href}
                className={`flex flex-col items-center gap-0.5 px-4 py-1 min-w-0 transition-colors ${active ? 'text-white' : 'text-[#636366]'}`}>
                {icon(active)}
                <span className="text-[10px] font-semibold tracking-tight">{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
