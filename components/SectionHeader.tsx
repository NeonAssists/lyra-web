import Link from 'next/link';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  seeAllHref?: string;
}

export default function SectionHeader({ title, subtitle, seeAllHref }: SectionHeaderProps) {
  return (
    <div className="flex items-baseline justify-between mb-3">
      <div>
        <h2 className="font-bold text-base text-white">{title}</h2>
        {subtitle && <p className="text-xs text-[#8E8E93] mt-0.5">{subtitle}</p>}
      </div>
      {seeAllHref && (
        <Link href={seeAllHref} className="text-xs font-semibold text-[#6C63FF] hover:underline flex-shrink-0">
          See All →
        </Link>
      )}
    </div>
  );
}
