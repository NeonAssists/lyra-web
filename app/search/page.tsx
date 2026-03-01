"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { getArtworkHiRes } from "@/lib/itunes";

interface SearchResult {
  wrapperType: string;
  kind?: string;
  trackId?: number;
  collectionId?: number;
  artistId?: number;
  trackName?: string;
  collectionName?: string;
  artistName?: string;
  artworkUrl100?: string;
  artworkUrl60?: string;
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=musicArtist,album,song&media=music&limit=20`
        );
        const data = await res.json();
        setResults(data.results ?? []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const artists = results.filter((r) => r.wrapperType === "artist");
  const albums = results.filter((r) => r.wrapperType === "collection");
  const songs = results.filter((r) => r.wrapperType === "track");

  return (
    <div className="min-h-screen px-5 pt-6">
      {/* Search Input */}
      <div className="sticky top-0 z-10 bg-bg pb-4 pt-2">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search songs, albums, artists..."
            className="h-11 w-full rounded-xl border border-white/[0.08] bg-surface pl-10 pr-4 text-sm text-white placeholder-text-tertiary outline-none transition-colors focus:border-accent/50"
            autoFocus
          />
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      )}

      {/* Empty state for no query */}
      {!query.trim() && !loading && (
        <div className="flex flex-col items-center pt-24 text-center">
          <div className="mb-4 text-5xl opacity-30">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-tertiary">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <p className="text-text-secondary">
            Find any song, album, or artist
          </p>
        </div>
      )}

      {/* Results */}
      {!loading && query.trim() && (
        <div className="space-y-6 pb-8">
          {/* Artists */}
          {artists.length > 0 && (
            <ResultSection title="Artists">
              {artists.map((a) => (
                <div
                  key={a.artistId}
                  className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-surface"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface2 text-lg font-bold text-text-secondary">
                    {a.artistName?.charAt(0) ?? "?"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">
                      {a.artistName}
                    </p>
                    <p className="text-xs text-text-secondary">Artist</p>
                  </div>
                </div>
              ))}
            </ResultSection>
          )}

          {/* Albums */}
          {albums.length > 0 && (
            <ResultSection title="Albums">
              {albums.map((a) => (
                <div
                  key={a.collectionId}
                  className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-surface"
                >
                  <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg">
                    {a.artworkUrl100 ? (
                      <Image
                        src={getArtworkHiRes(a.artworkUrl100)}
                        alt={a.collectionName ?? ""}
                        fill
                        className="object-cover"
                        unoptimized
                        sizes="48px"
                      />
                    ) : (
                      <div className="h-full w-full bg-surface2" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">
                      {a.collectionName}
                    </p>
                    <p className="truncate text-xs text-text-secondary">
                      {a.artistName}
                    </p>
                  </div>
                </div>
              ))}
            </ResultSection>
          )}

          {/* Songs */}
          {songs.length > 0 && (
            <ResultSection title="Songs">
              {songs.map((s) => (
                <div
                  key={s.trackId}
                  className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-surface"
                >
                  <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg">
                    {s.artworkUrl100 ? (
                      <Image
                        src={getArtworkHiRes(s.artworkUrl100)}
                        alt={s.trackName ?? ""}
                        fill
                        className="object-cover"
                        unoptimized
                        sizes="48px"
                      />
                    ) : (
                      <div className="h-full w-full bg-surface2" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">
                      {s.trackName}
                    </p>
                    <p className="truncate text-xs text-text-secondary">
                      {s.artistName}
                    </p>
                  </div>
                </div>
              ))}
            </ResultSection>
          )}

          {/* No results */}
          {results.length === 0 && (
            <div className="pt-12 text-center">
              <p className="text-text-secondary">No results found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ResultSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-tertiary">
        {title}
      </h3>
      <div className="space-y-1">{children}</div>
    </section>
  );
}
