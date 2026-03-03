'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import AppShell from '@/components/AppShell';

type Profile = { id: string; handle: string; display_name: string; avatar_url: string | null; plan: string | null };

const PLANS = [
  { key: 'free',    label: 'Free',    price: '$0',  color: '#8E8E93', features: ['5 songs/list', '3 lists', '10 swipes/day'] },
  { key: 'starter', label: 'Starter', price: '$4/mo', color: '#34C759', features: ['15 songs/list', '10 lists', '1 pack', '90 swipes'] },
  { key: 'plus',    label: 'Plus',    price: '$8/mo', color: '#007AFF', features: ['30 songs/list', '15 lists', '3 packs', 'Unlimited swipes'] },
  { key: 'pro',     label: 'Pro',     price: '$15/mo', color: '#AF52DE', features: ['Unlimited everything', 'Early features', 'Priority support'] },
  { key: 'beta',    label: 'Beta',    price: 'Free',  color: '#6C63FF', features: ['Unlimited everything', 'Early access', 'You\'re a founding user ⚡'] },
];

export default function AccountPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/login'); return; }
      setEmail(data.user.email ?? '');
      const { data: p } = await supabase.from('profiles' as any).select('id, handle, display_name, avatar_url, plan').eq('id', data.user.id).single();
      setProfile(p as Profile);
      setDisplayName((p as any)?.display_name ?? '');
    });
  }, []);

  const handleSave = async () => {
    if (!profile || !displayName.trim()) return;
    setSaving(true); setError('');
    const { error } = await supabase.from('profiles' as any).update({ display_name: displayName.trim() }).eq('id', profile.id);
    setSaving(false);
    if (error) { setError(error.message); return; }
    setProfile(p => p ? { ...p, display_name: displayName } : p);
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  const currentPlan = PLANS.find(p => p.key === (profile?.plan ?? 'free')) ?? PLANS[0];

  if (!profile) return (
    <AppShell>
      <div style={{ padding: '60px 28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 20, height: 20, border: '2px solid rgba(108,99,255,0.3)', borderTopColor: '#6C63FF', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </AppShell>
  );

  return (
    <AppShell>
      <div style={{ padding: '32px 28px 80px', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif', maxWidth: 800 }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>Settings</p>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>Account & Billing</h1>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>

          {/* LEFT — Account info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Profile card */}
            <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 3 }}>Profile</p>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: 0 }}>Account Info</h2>
              </div>
              <div style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Display Name</label>
                  <input value={displayName} onChange={e => setDisplayName(e.target.value)}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 14px', fontSize: 14, color: '#fff', outline: 'none', boxSizing: 'border-box' as const }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Handle</label>
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '10px 14px', fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>@{profile.handle}</div>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Email</label>
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '10px 14px', fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>{email}</div>
                </div>
                {error && <p style={{ fontSize: 13, color: '#FF453A' }}>{error}</p>}
                <button onClick={handleSave} disabled={saving || saved}
                  style={{ padding: '11px 0', borderRadius: 12, background: saved ? '#16a34a' : '#6C63FF', color: '#fff', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                  {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>

            {/* Danger zone */}
            <div style={{ background: '#111', border: '1px solid rgba(255,59,48,0.15)', borderRadius: 16, padding: '16px 20px' }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,59,48,0.5)', marginBottom: 10 }}>Danger Zone</p>
              <button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/'; }}
                style={{ padding: '10px 18px', borderRadius: 10, background: 'rgba(255,59,48,0.1)', border: '1px solid rgba(255,59,48,0.2)', color: '#FF453A', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Sign Out
              </button>
            </div>
          </div>

          {/* RIGHT — Plan & billing */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Current plan highlight */}
            <div style={{ background: '#111', border: `1px solid ${currentPlan.color}30`, borderRadius: 16, padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 4 }}>Current Plan</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <h2 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: 0 }}>{currentPlan.label}</h2>
                    <span style={{ padding: '3px 10px', borderRadius: 20, background: currentPlan.color + '20', border: `1px solid ${currentPlan.color}40`, color: currentPlan.color, fontSize: 12, fontWeight: 700 }}>{currentPlan.price}</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {currentPlan.features.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: currentPlan.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 9, color: currentPlan.color }}>✓</span>
                    </div>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Upgrade options */}
            <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 3 }}>Plans</p>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: 0 }}>Upgrade</h2>
              </div>
              <div style={{ padding: '8px 0' }}>
                {PLANS.filter(p => p.key !== 'beta' && p.key !== 'free').map(plan => {
                  const isCurrent = plan.key === (profile.plan ?? 'free');
                  return (
                    <div key={plan.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{plan.label}</span>
                          {isCurrent && <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 10, background: plan.color + '20', color: plan.color, fontWeight: 700 }}>Current</span>}
                        </div>
                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{plan.features[0]}, {plan.features[1]}</span>
                      </div>
                      <button disabled={isCurrent}
                        style={{ padding: '7px 16px', borderRadius: 100, fontSize: 13, fontWeight: 700, border: 'none', cursor: isCurrent ? 'default' : 'pointer', background: isCurrent ? 'rgba(255,255,255,0.06)' : plan.color, color: isCurrent ? 'rgba(255,255,255,0.3)' : '#fff', transition: 'all 0.15s', opacity: isCurrent ? 0.5 : 1 }}>
                        {isCurrent ? 'Active' : plan.price}
                      </button>
                    </div>
                  );
                })}
              </div>
              <div style={{ padding: '12px 20px', background: 'rgba(108,99,255,0.05)', borderTop: '1px solid rgba(108,99,255,0.1)' }}>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>Payment coming soon · All plans include full Lyra access during beta</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </AppShell>
  );
}
