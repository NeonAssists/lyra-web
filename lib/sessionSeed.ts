/**
 * Returns a stable random offset for a given key within the current browser session.
 * Each new session (new tab open / browser restart) gets a fresh seed.
 * Within the same session the offset is consistent — no jumpiness.
 */
export function sessionOffset(key: string, poolSize: number, showCount: number): number {
  if (typeof window === 'undefined') return 0;
  const stored = sessionStorage.getItem(`lyra_offset_${key}`);
  if (stored !== null) return parseInt(stored, 10);
  const max = Math.max(0, poolSize - showCount);
  const offset = Math.floor(Math.random() * (max + 1));
  sessionStorage.setItem(`lyra_offset_${key}`, String(offset));
  return offset;
}

/** Stable Fisher-Yates shuffle seeded per session for a given key */
export function sessionShuffle<T>(arr: T[], key: string): T[] {
  if (typeof window === 'undefined') return arr;
  const stored = sessionStorage.getItem(`lyra_shuffle_${key}`);
  let seed: number;
  if (stored !== null) {
    seed = parseInt(stored, 10);
  } else {
    seed = Math.floor(Math.random() * 100000);
    sessionStorage.setItem(`lyra_shuffle_${key}`, String(seed));
  }
  // Deterministic seeded shuffle (mulberry32 lcg)
  const copy = [...arr];
  let s = seed;
  for (let i = copy.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(s) % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Pick a random genre each session */
export function sessionGenre(genres: Array<{ name: string; id: string | null }>): { name: string; id: string | null } {
  if (typeof window === 'undefined') return genres[0];
  const stored = sessionStorage.getItem('lyra_genre');
  if (stored !== null) return JSON.parse(stored);
  const pick = genres[Math.floor(Math.random() * genres.length)];
  sessionStorage.setItem('lyra_genre', JSON.stringify(pick));
  return pick;
}
