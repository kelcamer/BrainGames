// The preview build (served from /BrainGames/preview/) shares localStorage with
// the live site, because both are on kelcamer.github.io. Left alone, a preview run
// would write into real progress, and the live build would silently drop any
// stats it doesn't know about the next time it saved. So the preview gets its own
// copy of each key, seeded once from the live value — it opens with your real
// progress, and nothing done there leaks back.
const IS_PREVIEW = import.meta.env.BASE_URL.includes("/preview/");

export function storageKey(key) {
  if (!IS_PREVIEW) return key;
  const previewKey = `${key}__preview`;
  try {
    if (localStorage.getItem(previewKey) === null) {
      const live = localStorage.getItem(key);
      if (live !== null) localStorage.setItem(previewKey, live);
    }
  } catch {
    /* storage unavailable — callers already handle that */
  }
  return previewKey;
}
