import { useEffect, useRef, useState } from "react";

export type Tone = "ivory" | "green" | "red" | "yellow";

const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const STEP_MS = 40;

const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** One cell: flips through a few characters before landing on `target`. */
function Flap({ target, delay, tone, scorched }: { target: string; delay: number; tone: Tone; scorched: boolean }) {
  const [shown, setShown] = useState(target);
  const [step, setStep] = useState(0);
  const first = useRef(true);

  useEffect(() => {
    // the board clatters to its state on load too, but a blank stays blank
    if (reducedMotion() || (first.current && target === " ")) {
      first.current = false;
      setShown(target);
      return;
    }
    first.current = false;
    let timer: ReturnType<typeof setTimeout>;
    let left = 6 + Math.floor(Math.random() * 5); // 6 to 10 steps per character
    const tick = () => {
      left -= 1;
      setShown(left <= 0 ? target : (CHARSET[Math.floor(Math.random() * CHARSET.length)] ?? target));
      setStep((s) => s + 1);
      if (left > 0) timer = setTimeout(tick, STEP_MS);
    };
    timer = setTimeout(tick, delay);
    return () => clearTimeout(timer);
  }, [target, delay]);

  const toneClass = tone === "ivory" ? "" : ` flap-${tone}`;
  return (
    <span className={`flap${toneClass}${scorched ? " flap-scorched" : ""}`} aria-hidden="true">
      <span key={step} className="flap-step">
        {shown === " " ? " " : shown}
      </span>
    </span>
  );
}

/**
 * A row of flaps showing `text`, padded to `cells`. Characters land left to right;
 * `delay` offsets the whole row so lines can clatter top to bottom.
 */
export function Flaps({
  text,
  cells,
  tone = "ivory",
  scorched = false,
  delay = 0,
  className = "",
}: {
  text: string;
  cells?: number;
  tone?: Tone;
  scorched?: boolean;
  delay?: number;
  className?: string;
}) {
  const padded = text.toUpperCase().padEnd(cells ?? text.length, " ");
  return (
    <span className={`inline-flex gap-[0.08em] ${className}`} role="img" aria-label={text.trim() || "blank"}>
      {[...padded].map((ch, i) => (
        <Flap key={i} target={ch} delay={delay + i * STEP_MS} tone={tone} scorched={scorched} />
      ))}
    </span>
  );
}
