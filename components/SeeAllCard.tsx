'use client';
import { useState } from 'react';
import Image from 'next/image';

interface Props {
  artworks: string[];
  label: string;
  href: string;
}

export default function SeeAllCard({ artworks, label, href }: Props) {
  const [hov, setHov] = useState(false);
  const grid = artworks.slice(0, 4);
  return (
    <a href={href} style={{ textDecoration: 'none', display: 'block' }}>
      <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
        style={{ background: hov ? '#1c1c1e' : 'transparent', borderRadius: 12, padding: 10, transition: 'background 0.15s', cursor: 'pointer' }}>
        <div style={{ position: 'relative', width: '100%', aspectRatio: '1', borderRadius: 10, overflow: 'hidden', background: '#1c1c1e', marginBottom: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', width: '100%', height: '100%' }}>
            {grid.map((src, i) => (
              <div key={i} style={{ position: 'relative', overflow: 'hidden', background: '#2a2a2a' }}>
                {src && <Image src={src} alt="" fill style={{ objectFit: 'cover' }} unoptimized sizes="100px" />}
              </div>
            ))}
            {grid.length < 4 && [...Array(4 - grid.length)].map((_, i) => (
              <div key={`e-${i}`} style={{ background: '#2a2a2a' }} />
            ))}
          </div>
          <div style={{ position: 'absolute', inset: 0, background: hov ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, transition: 'background 0.15s' }}>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>→</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>See all</span>
          </div>
        </div>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#6C63FF', textAlign: 'center' }}>{label}</p>
      </div>
    </a>
  );
}
