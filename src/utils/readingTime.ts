// src/utils/readingTime.ts
// Single source of truth for reading time estimation.
// Used by: BlogList.astro, LatestPosts.astro, blog/[...slug].astro

const WORDS_PER_MINUTE = 200;

export function readingTime(body: string): number {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}
