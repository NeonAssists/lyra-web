import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import { getItunesId, getArtworkHiRes, ratingColor } from "@/lib/itunes";

async function getProfile(handle: string) {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("handle", handle)
    .single();
  return data;
}

async function getRankings(userId: string) {
  const { data } = await supabase
    .from("user_rankings")
    .select("*")
    .eq("user_id", userId)
    .order("ranked_at", { ascending: false })
    .limit(100);
  return data ?? [];
}

// Only falls back to iTunes when title is missing (pre-fix rankings)
async function hydrateRanking(ranking: Record<string, unknown>) {
  if (ranking.title && ranking.artwork_url) {
    return {
      ...ranking,
      artwork: ranking.artwork_url as string,
    };
  }
  const itunesId = getItunesId(ranking.item_id as string);
  if (!itunesId || itunesId === ranking.item_id) return null;
  try {
    const res = await fetch(
      `https://itunes.apple.com/lookup?id=${itunesId}`,
      { next: { revalidate: 86400 } }
    );
    const data = await res.json();
    const item = data?.results?.[0];
    if (!item) return null;
    return {
      ...ranking,
      title: item.trackName ?? item.collectionName ?? item.artistName ?? "",
      artist: item.artistName ?? "",
      artwork: getArtworkHiRes(item.artworkUrl100 ?? ""),
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const profile = await getProfile(handle);
  if (!profile) return { title: "Profile not found — Lyra" };
  return {
    title: `${profile.display_name ?? handle} (@${handle}) — Lyra`,
    description: `${profile.display_name}'s music rankings on Lyra`,
  };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const profile = await getProfile(handle);

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="mb-3 text-4xl">?</p>
          <p className="text-[#8E8E93]">Profile not found</p>
          <Link href="/" className="mt-4 block text-sm text-[#6C63FF]">
            Back to Lyra
          </Link>
        </div>
      </div>
    );
  }

  const rawRankings = await getRankings(profile.id);
  const hydratedRaw = await Promise.all(rawRankings.slice(0, 100).map(hydrateRanking));
  const rankings = hydratedRaw.filter(Boolean) as Array<
    Record<string, unknown> & {
      id: string;
      user_id: string;
      item_id: string;
      rating: number;
      note: string | null;
      title: string;
      artist: string;
      artwork: string;
    }
  >;

  const avgRating =
    rankings.length > 0
      ? (rankings.reduce((s, r) => s + r.rating, 0) / rankings.length).toFixed(1)
      : null;

  const initials = (profile.display_name ?? handle).slice(0, 2).toUpperCase();

  // Sort by rating desc for display
  const sortedRankings = [...rankings].sort((a, b) => b.rating - a.rating);

  return (
    <div className="min-h-screen pb-16">
      {/* Nav */}
      <nav className="sticky top-0 z-40 flex items-center justify-between border-b border-white/[0.06] bg-bg/90 px-4 py-3 backdrop-blur-xl">
        <Link href="/" className="text-lg font-black tracking-tight">
          Lyra
        </Link>
        <Link href="/search" className="text-sm text-[#8E8E93] transition-colors hover:text-white">
          Search
        </Link>
      </nav>

      <div className="mx-auto max-w-3xl px-4">
        {/* Profile header */}
        <div className="flex flex-col items-center pb-8 pt-10 text-center">
          {profile.avatar_url ? (
            <div className="relative mb-4 h-20 w-20 overflow-hidden rounded-full">
              <Image
                src={profile.avatar_url}
                alt={profile.display_name ?? handle}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          ) : (
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#6C63FF] text-2xl font-black">
              {initials}
            </div>
          )}
          <h1 className="text-2xl font-black">{profile.display_name ?? handle}</h1>
          <p className="mt-1 text-sm text-[#8E8E93]">@{handle}</p>

          <div className="mt-5 flex items-center gap-6">
            <div className="text-center">
              <p className="text-xl font-black">{rankings.length}</p>
              <p className="text-[10px] uppercase tracking-wider text-[#8E8E93]">Ranked</p>
            </div>
            {avgRating && (
              <div className="text-center">
                <p className="text-xl font-black" style={{ color: ratingColor(parseFloat(avgRating)) }}>
                  {avgRating}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-[#8E8E93]">Avg Rating</p>
              </div>
            )}
          </div>
        </div>

        {/* Rankings grid */}
        {rankings.length === 0 ? (
          <div className="py-16 text-center text-[#8E8E93]">Nothing ranked yet.</div>
        ) : (
          <>
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-[#8E8E93]">
              Rankings · {rankings.length}
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {sortedRankings.map((r) => (
                <Link
                  key={r.id}
                  href={`/ranking/${r.user_id}_${encodeURIComponent(r.item_id)}`}
                  className="group overflow-hidden rounded-2xl border border-white/[0.06] bg-surface transition-all hover:scale-[1.02] hover:border-[#6C63FF]/40"
                >
                  <div className="relative aspect-square bg-surface2">
                    {r.artwork && (
                      <Image
                        src={r.artwork}
                        alt={r.title}
                        fill
                        className="object-cover"
                        unoptimized
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                      />
                    )}
                    <div
                      className="absolute right-2 top-2 rounded-lg px-2 py-1"
                      style={{ backgroundColor: ratingColor(r.rating) }}
                    >
                      <span className="text-sm font-black text-white">
                        {r.rating?.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <div className="p-2.5">
                    <p className="truncate text-xs font-semibold">{r.title}</p>
                    <p className="truncate text-[11px] text-[#8E8E93]">{r.artist}</p>
                    {r.note && (
                      <p className="mt-1 truncate text-[11px] italic text-[#48484A]">
                        &ldquo;{r.note}&rdquo;
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
