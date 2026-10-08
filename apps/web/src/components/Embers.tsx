import { useEffect, useRef } from "react";

/**
 * A burn: embers rise from the hinge of a burned status cell and fade. Plays once, after `delay` ms,
 * then the canvas clears. Skipped entirely when the visitor prefers reduced motion.
 */
export function Embers({ delay = 0, count = 32 }: { delay?: number; count?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const DURATION = 1200;
    const embers = Array.from({ length: Math.min(count, 60) }, () => ({
      x: Math.random() * width,
      y: height * (0.55 + Math.random() * 0.4),
      vx: (Math.random() - 0.5) * 0.04,
      vy: -(0.04 + Math.random() * 0.08),
      r: 0.8 + Math.random() * 1.8,
      born: Math.random() * 400,
    }));

    let raf = 0;
    let start = 0;
    const frame = (t: number) => {
      if (!start) start = t;
      const age = t - start;
      ctx.clearRect(0, 0, width, height);
      for (const e of embers) {
        const life = (age - e.born) / (DURATION - e.born);
        if (life <= 0 || life >= 1) continue;
        const dt = age - e.born;
        ctx.globalAlpha = 1 - life;
        ctx.fillStyle = life < 0.4 ? "#ffc72c" : "#ff5a36";
        ctx.beginPath();
        ctx.arc(e.x + e.vx * dt, e.y + e.vy * dt, e.r, 0, Math.PI * 2);
        ctx.fill();
      }
      if (age < DURATION && !document.hidden) raf = requestAnimationFrame(frame);
      else ctx.clearRect(0, 0, width, height);
    };
    const timer = setTimeout(() => (raf = requestAnimationFrame(frame)), delay);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [delay, count]);

  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none absolute inset-x-0 -top-6 bottom-0 h-[calc(100%+1.5rem)] w-full" />;
}
