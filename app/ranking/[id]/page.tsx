import Link from 'next/link';
export default function RankingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="text-center">
        <p className="text-4xl mb-3">✦</p>
        <p className="text-[#8E8E93]">Ranking coming soon</p>
        <Link href="/" className="text-[#6C63FF] text-sm mt-4 block">← Back to Lyra</Link>
      </div>
    </div>
  );
}
