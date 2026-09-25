import { useEffect, useRef, useState } from "react";

const SCRAMBLE_CHARS = "ABCDEF0123456789#%*+-/\\";

/**
 * Briefly scrambles then resolves into the real text, evoking a decrypt
 * operation. Used once per row on mount only — not on every re-render —
 * and skipped entirely under prefers-reduced-motion.
 */
export default function CipherReveal({ text, className, as: Tag = "span" }) {
  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const [display, setDisplay] = useState(prefersReduced ? text : "");
  const frame = useRef(0);
  const raf = useRef(null);

  useEffect(() => {
    if (prefersReduced) {
      setDisplay(text);
      return undefined;
    }

    const totalFrames = 14;
    frame.current = 0;

    const step = () => {
      frame.current += 1;
      const revealCount = Math.floor(
        (frame.current / totalFrames) * text.length,
      );

      const next = text
        .split("")
        .map((ch, i) => {
          if (i < revealCount || ch === " " || ch === ".") return ch;
          return SCRAMBLE_CHARS[
            Math.floor(Math.random() * SCRAMBLE_CHARS.length)
          ];
        })
        .join("");

      setDisplay(next);

      if (frame.current < totalFrames) {
        raf.current = setTimeout(step, 22);
      } else {
        setDisplay(text);
      }
    };

    step();

    return () => clearTimeout(raf.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  return (
    <Tag className={className} aria-label={text}>
      {display}
    </Tag>
  );
}
