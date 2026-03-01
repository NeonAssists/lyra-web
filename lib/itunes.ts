export function getItunesId(itemId: string): string {
  return itemId.replace(/^itunes:(trk:|alb:)?/, '');
}

export function getArtworkHiRes(url: string): string {
  return url.replace('100x100bb', '600x600bb').replace('170x170bb', '600x600bb');
}

export async function lookupItem(itunesId: string) {
  const res = await fetch(`https://itunes.apple.com/lookup?id=${itunesId}`, { next: { revalidate: 3600 } });
  const data = await res.json();
  return data?.results?.[0] ?? null;
}

export async function searchItunes(query: string, entity = 'song,album,musicArtist', limit = 20) {
  const res = await fetch(
    `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=${entity}&media=music&limit=${limit}`,
    { next: { revalidate: 60 } }
  );
  return res.json();
}

export function ratingColor(rating: number): string {
  if (rating >= 8) return '#34C759';
  if (rating >= 6) return '#FFD60A';
  return '#FF453A';
}
