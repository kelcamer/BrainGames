import { useEffect } from "react";

// Lock page scrolling for the lifetime of the calling component. Used by the
// games where a stray scroll (arrow-key page-scroll, a swipe, iOS rubber-band
// or pull-to-refresh) fights the gameplay. The class is reference-counted via a
// data attribute so overlapping mounts don't clobber each other.
export function useNoScroll() {
  useEffect(() => {
    const body = document.body;
    const n = Number(body.dataset.noScrollCount || 0) + 1;
    body.dataset.noScrollCount = String(n);
    body.classList.add("no-scroll");
    return () => {
      const left = Number(body.dataset.noScrollCount || 1) - 1;
      if (left <= 0) {
        delete body.dataset.noScrollCount;
        body.classList.remove("no-scroll");
      } else {
        body.dataset.noScrollCount = String(left);
      }
    };
  }, []);
}
