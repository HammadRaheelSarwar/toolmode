"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";

export function FavoriteToggle({ toolSlug }: { toolSlug: string }) {
  const [favorite, setFavorite] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("toolmodeon_favorites");
      if (stored) {
        const list = JSON.parse(stored) as string[];
        if (Array.isArray(list)) setFavorite(list.includes(toolSlug));
      }
    } catch {
      // Local storage unavailable
    }
    setReady(true);
  }, [toolSlug]);

  if (!ready) return <span className="h-8 w-8" aria-hidden="true" />;

  function toggle() {
    setFavorite((prev) => {
      const next = !prev;
      try {
        const stored = localStorage.getItem("toolmodeon_favorites");
        let list: string[] = stored ? JSON.parse(stored) : [];
        if (!Array.isArray(list)) list = [];
        if (next) {
          if (!list.includes(toolSlug)) list.push(toolSlug);
        } else {
          list = list.filter((s) => s !== toolSlug);
        }
        localStorage.setItem("toolmodeon_favorites", JSON.stringify(list));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  }

  return (
    <button
      onClick={toggle}
      aria-pressed={favorite}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
        favorite
          ? "border-ink bg-ink text-white"
          : "border-line bg-white text-muted hover:border-ink hover:text-ink"
      }`}
    >
      <Heart size={13} fill={favorite ? "currentColor" : "none"} />
      {favorite ? "Favorited" : "Favorite"}
    </button>
  );
}
