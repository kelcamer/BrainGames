import { useEffect, useRef } from "react";

// Animates 0% → 100% over `ms`, replaying cleanly on every mount (the
// double-rAF trick forces the browser to commit width:0 before the
// transition to width:100% is applied, so it always animates from zero).
export default function HoldBar({ ms }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transition = "none";
    el.style.width = "0%";
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.transition = `width ${ms}ms linear`;
        el.style.width = "100%";
      });
    });
  }, [ms]);
  return (
    <div className="tm-holdbar">
      <div className="tm-holdbar__fill" ref={ref} />
    </div>
  );
}
