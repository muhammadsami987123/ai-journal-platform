"use client";

import { useEffect, useRef } from "react";

/**
 * Real Web Audio amplitude, never a fake looped animation. Decorative: the
 * recording status is always available as text for screen readers (T9.6).
 */
export function Waveform({
  analyser,
  active,
  bars = 48,
  className
}: {
  analyser: AnalyserNode | null;
  active: boolean;
  bars?: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;
    const context2d = canvasEl.getContext("2d");
    if (!context2d) return;

    /* Bind narrowed, non-null aliases so the draw closures stay type-safe. */
    const canvas: HTMLCanvasElement = canvasEl;
    const context: CanvasRenderingContext2D = context2d;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const accent = getComputedStyle(document.documentElement).getPropertyValue("--color-accent").trim();

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      if (canvas.width !== Math.floor(rect.width * dpr)) {
        canvas.width = Math.floor(rect.width * dpr);
        canvas.height = Math.floor(rect.height * dpr);
      }
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      return rect;
    }

    let frame = 0;
    const buffer = analyser ? new Uint8Array(analyser.frequencyBinCount) : null;

    function draw() {
      const rect = resize();
      context.clearRect(0, 0, rect.width, rect.height);
      const gap = 3;
      const barWidth = Math.max(2, (rect.width - gap * (bars - 1)) / bars);
      context.fillStyle = accent || "#a94f2a";

      for (let index = 0; index < bars; index += 1) {
        let value = 0.12;
        if (analyser && buffer) {
          const sample = (buffer[Math.floor((index / bars) * buffer.length)] ?? 0) / 255;
          value = Math.max(0.08, sample);
        } else if (!active) {
          value = 0.08 + Math.abs(Math.sin(index * 0.55)) * 0.14;
        }
        const height = Math.max(2, value * rect.height);
        const x = index * (barWidth + gap);
        const y = (rect.height - height) / 2;
        context.globalAlpha = 0.35 + value * 0.65;
        context.beginPath();
        const radius = Math.min(barWidth / 2, 3);
        const ctx = context as CanvasRenderingContext2D & {
          roundRect?: (x: number, y: number, w: number, h: number, r: number) => void;
        };
        if (typeof ctx.roundRect === "function") {
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, height, radius);
          ctx.fill();
        } else {
          context.fillRect(x, y, barWidth, height);
        }
      }
      context.globalAlpha = 1;

      if (analyser && active && !reduced) {
        analyser.getByteFrequencyData(buffer as Uint8Array<ArrayBuffer>);
        frame = requestAnimationFrame(draw);
      }
    }

    draw();
    window.addEventListener("resize", draw);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", draw);
    };
  }, [analyser, active, bars]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={className}
      style={{ width: "100%", height: "100%" }}
    />
  );
}
