import { useEffect, useRef, useState } from "react";
import { randomPraise, PRAISE_EVENT } from "../data/praise.js";

// One app-level encouragement pill. Any game fires cheer() on a correct answer
// (which dispatches PRAISE_EVENT); this shows a fresh random line for ~1.1s.
// Living at the app level means games don't have to place or lay it out.
export default function PraiseToast() {
  const [text, setText] = useState("");
  const [show, setShow] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    function onCheer() {
      setText(randomPraise());
      setShow(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setShow(false), 1100);
    }
    window.addEventListener(PRAISE_EVENT, onCheer);
    return () => {
      window.removeEventListener(PRAISE_EVENT, onCheer);
      clearTimeout(timer.current);
    };
  }, []);

  return (
    <div className={"praise-toast" + (show ? " show" : "")} aria-live="polite">
      {text}
    </div>
  );
}
