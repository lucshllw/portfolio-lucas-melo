"use client";
import { useEffect, useRef, useState } from "react";
import { useShell } from "@/components/shell/context";
function CanvasPiece({
  id,
  reset,
  orientation,
}: {
  id: string;
  reset: number;
  orientation: number;
}) {
  const { t } = useShell();
  const ref = useRef<HTMLCanvasElement>(null),
    redraw = useRef<(() => void) | null>(null),
    angle = useRef(orientation);
  angle.current = orientation;
  useEffect(() => {
    redraw.current?.();
  }, [orientation]);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const parent = canvas.parentElement!;
    let width = parent.clientWidth,
      height = parent.clientHeight,
      running = true,
      visible = true,
      raf = 0,
      time = 0,
      last = 0,
      keyboardMode = false,
      keyboardNode = 0;
    const pointer = {
      x: -1000,
      y: -1000,
      down: false,
      startX: 0,
      rotation: 0,
      node: -1,
    };
    let seed = 1907;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    const particles = Array.from({ length: 420 }, () => ({
      x: random() * width,
      y: random() * height,
    }));
    const nodes = Array.from({ length: 15 }, () => ({
      x: 0.15 + random() * 0.7,
      y: 0.15 + random() * 0.7,
    }));
    const trajectory: number[][] = [];
    let x = 0.1,
      y = 0,
      z = 0;
    for (let i = 0; i < 5000; i++) {
      const dt = 0.006;
      const a = x + 10 * (y - x) * dt,
        b = y + (x * (28 - z) - y) * dt,
        c = z + (x * y - (8 * z) / 3) * dt;
      x = a;
      y = b;
      z = c;
      if (i > 200) trajectory.push([x, y, z]);
    }
    const N = 100,
      M = 80,
      len = N * M;
    let a = new Float32Array(len).fill(1),
      b = new Float32Array(len),
      aNext = new Float32Array(len).fill(1),
      bNext = new Float32Array(len);
    for (let j = 30; j < 50; j++)
      for (let i = 42; i < 58; i++) b[j * N + i] = 0.85;
    const buffer = document.createElement("canvas");
    buffer.width = N;
    buffer.height = M;
    const bctx = buffer.getContext("2d")!,
      pixels = bctx.createImageData(N, M);
    const resize = () => {
      width = parent.clientWidth;
      height = parent.clientHeight;
      const dpr = Math.min(devicePixelRatio, 1.25);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = "#050505";
      ctx.fillRect(0, 0, width, height);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(parent);
    resize();
    const reaction = () => {
      for (let step = 0; step < 5; step++) {
        for (let j = 1; j < M - 1; j++)
          for (let i = 1; i < N - 1; i++) {
            const n = j * N + i;
            const lap = (arr: Float32Array) =>
              -arr[n] +
              0.2 * (arr[n - 1] + arr[n + 1] + arr[n - N] + arr[n + N]) +
              0.05 *
                (arr[n - N - 1] +
                  arr[n - N + 1] +
                  arr[n + N - 1] +
                  arr[n + N + 1]);
            const ab = a[n] * b[n] * b[n];
            aNext[n] = Math.max(
              0,
              Math.min(1, a[n] + lap(a) - ab + 0.0367 * (1 - a[n])),
            );
            bNext[n] = Math.max(
              0,
              Math.min(1, b[n] + 0.5 * lap(b) + ab - (0.0649 + 0.0367) * b[n]),
            );
          }
        [a, aNext] = [aNext, a];
        [b, bNext] = [bNext, b];
      }
      for (let i = 0; i < len; i++) {
        const value = Math.max(5, Math.min(230, (1 - a[i] + b[i]) * 220));
        pixels.data[i * 4] = value * 0.86;
        pixels.data[i * 4 + 1] = value * 0.52;
        pixels.data[i * 4 + 2] = value;
        pixels.data[i * 4 + 3] = 255;
      }
      bctx.putImageData(pixels, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(buffer, 0, 0, width, height);
    };
    const seedAtPointer = () => {
      const px = Math.floor((pointer.x / width) * N),
        py = Math.floor((pointer.y / height) * M);
      for (let j = -3; j < 4; j++)
        for (let i = -3; i < 4; i++)
          if (px + i >= 0 && px + i < N && py + j >= 0 && py + j < M)
            b[(py + j) * N + px + i] = 0.95;
    };
    const draw = (dt: number) => {
      time += dt;
      if (id === "fluxo") {
        ctx.fillStyle = "rgba(5,5,5,.065)";
        ctx.fillRect(0, 0, width, height);
        ctx.strokeStyle = "rgba(171,120,235,.55)";
        ctx.lineWidth = 0.65;
        ctx.beginPath();
        for (const p of particles) {
          const dx = p.x - pointer.x,
            dy = p.y - pointer.y,
            dist = Math.hypot(dx, dy);
          let theta =
            Math.sin(p.x * 0.008 + time * 0.16) * 1.7 +
            Math.cos(p.y * 0.01 - time * 0.1);
          if (dist < 140)
            theta += Math.atan2(dy, dx) * Math.max(0, 1 - dist / 140);
          ctx.moveTo(p.x, p.y);
          p.x += Math.cos(theta) * dt * 34;
          p.y += Math.sin(theta) * dt * 34;
          ctx.lineTo(p.x, p.y);
          if (p.x < 0 || p.x > width || p.y < 0 || p.y > height) {
            p.x = random() * width;
            p.y = random() * height;
          }
        }
        ctx.stroke();
      } else if (id === "trajetorias") {
        ctx.fillStyle = "#050505";
        ctx.fillRect(0, 0, width, height);
        const rotation = ((angle.current + pointer.rotation) * Math.PI) / 180;
        const scale = Math.min(width / 65, height / 65);
        ctx.strokeStyle = "#B68DEF";
        ctx.lineWidth = 0.65;
        ctx.beginPath();
        trajectory.forEach(([x, y, z], i) => {
          const px =
              width / 2 +
              (x * Math.cos(rotation) + y * Math.sin(rotation)) * scale,
            py = height / 2 - (z - 25) * scale;
          if (i) ctx.lineTo(px, py);
          else ctx.moveTo(px, py);
        });
        ctx.stroke();
      } else if (id === "materia") reaction();
      else if (id === "conexoes") {
        ctx.fillStyle = "#050505";
        ctx.fillRect(0, 0, width, height);
        for (let i = 0; i < nodes.length; i++) {
          const n = nodes[i];
          for (let j = i + 1; j < nodes.length; j++) {
            const m = nodes[j],
              dist = Math.hypot(n.x - m.x, n.y - m.y);
            if (dist > 0.44) continue;
            ctx.strokeStyle = `rgba(171,120,235,${0.5 - dist})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(n.x * width, n.y * height);
            ctx.lineTo(m.x * width, m.y * height);
            ctx.stroke();
            const f = (time * 0.17 + i * 0.2) % 1;
            ctx.fillStyle = "#B68DEF";
            ctx.beginPath();
            ctx.arc(
              (n.x + (m.x - n.x) * f) * width,
              (n.y + (m.y - n.y) * f) * height,
              2,
              0,
              Math.PI * 2,
            );
            ctx.fill();
          }
          const radius = i % 4 === 0 ? 13 : 7;
          const g = ctx.createRadialGradient(
            n.x * width - 2,
            n.y * height - 3,
            1,
            n.x * width,
            n.y * height,
            radius,
          );
          g.addColorStop(0, "#F1F3F5");
          g.addColorStop(0.5, "#8954CC");
          g.addColorStop(1, "#2C1548");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(n.x * width, n.y * height, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      if (keyboardMode) {
        ctx.strokeStyle = "#B68DEF";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(pointer.x, pointer.y, 18, 0, Math.PI * 2);
        ctx.stroke();
      }
    };
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    redraw.current = () => {
      if (reduced) draw(0.033);
    };
    const frame = (now: number) => {
      if (running && visible && !document.hidden) {
        if (now - last > 30) {
          draw(Math.min((now - last) / 1000, 0.05) || 0.033);
          last = now;
        }
      }
      if (running && visible && !document.hidden)
        raf = requestAnimationFrame(frame);
    };
    if (!reduced) raf = requestAnimationFrame(frame);
    else draw(0.033);
    const move = (e: PointerEvent) => {
      keyboardMode = false;
      const r = canvas.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
      if (pointer.down) {
        if (id === "trajetorias")
          pointer.rotation += (e.clientX - pointer.startX) * 0.5;
        if (id === "conexoes" && pointer.node >= 0) {
          nodes[pointer.node].x = Math.max(
            0.04,
            Math.min(0.96, pointer.x / width),
          );
          nodes[pointer.node].y = Math.max(
            0.04,
            Math.min(0.96, pointer.y / height),
          );
        }
        if (id === "materia") seedAtPointer();
        pointer.startX = e.clientX;
      }
      if (reduced) draw(0.033);
    };
    const down = (e: PointerEvent) => {
      pointer.down = true;
      pointer.startX = e.clientX;
      move(e);
      if (id === "conexoes") {
        let distance = Infinity;
        nodes.forEach((n, i) => {
          const d = Math.hypot(
            n.x * width - pointer.x,
            n.y * height - pointer.y,
          );
          if (d < distance) {
            distance = d;
            pointer.node = i;
          }
        });
        if (distance > 44) pointer.node = -1;
      }
      canvas.setPointerCapture(e.pointerId);
    };
    const up = () => {
      pointer.down = false;
      pointer.node = -1;
    };
    const key = (e: KeyboardEvent) => {
      if (
        ![
          "ArrowLeft",
          "ArrowRight",
          "ArrowUp",
          "ArrowDown",
          "Enter",
          " ",
        ].includes(e.key)
      )
        return;
      e.preventDefault();
      keyboardMode = true;
      const dx = e.key === "ArrowLeft" ? -1 : e.key === "ArrowRight" ? 1 : 0,
        dy = e.key === "ArrowUp" ? -1 : e.key === "ArrowDown" ? 1 : 0;
      if (pointer.x < 0) {
        pointer.x = width / 2;
        pointer.y = height / 2;
      }
      if (id === "conexoes") {
        if (e.key === "Enter" || e.key === " ")
          keyboardNode = (keyboardNode + 1) % nodes.length;
        const n = nodes[keyboardNode];
        n.x = MathUtilsClamp(n.x + dx * 0.035, 0.04, 0.96);
        n.y = MathUtilsClamp(n.y + dy * 0.035, 0.04, 0.96);
        pointer.x = n.x * width;
        pointer.y = n.y * height;
        const status = canvas.parentElement?.querySelector("[role=status]");
        if (status)
          status.textContent = t(
            `Nó ${keyboardNode + 1} de ${nodes.length}`,
            `Node ${keyboardNode + 1} of ${nodes.length}`,
          );
      } else {
        pointer.x = MathUtilsClamp(pointer.x + dx * 22, 22, width - 22);
        pointer.y = MathUtilsClamp(pointer.y + dy * 22, 22, height - 22);
        if (id === "materia" && (e.key === "Enter" || e.key === " "))
          seedAtPointer();
        if (id === "trajetorias") pointer.rotation += dx * 8;
      }
      if (reduced) draw(0.033);
    };
    const seen = new IntersectionObserver((es) => {
      visible = es[0].isIntersecting;
      last = performance.now();
      cancelAnimationFrame(raf);
      if (!reduced && visible && !document.hidden)
        raf = requestAnimationFrame(frame);
    });
    seen.observe(canvas);
    const visibility = () => {
      last = performance.now();
      cancelAnimationFrame(raf);
      if (!reduced && visible && !document.hidden)
        raf = requestAnimationFrame(frame);
    };
    document.addEventListener("visibilitychange", visibility);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);
    canvas.addEventListener("keydown", key);
    return () => {
      running = false;
      redraw.current = null;
      cancelAnimationFrame(raf);
      observer.disconnect();
      seen.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", up);
      canvas.removeEventListener("keydown", key);
    };
  }, [id, reset, t]);
  return (
    <>
      <canvas
        ref={ref}
        className="simulation-canvas"
        aria-label={
          id === "materia"
            ? t(
                "Simulação de reação e difusão Gray–Scott",
                "Gray–Scott reaction diffusion simulation",
              )
            : t("Simulação interativa", "Interactive simulation")
        }
        role="img"
        tabIndex={0}
        aria-describedby={`keys-${id}`}
      />
      <p className="simulation-hint" id={`keys-${id}`}>
        {id === "conexoes"
          ? t(
              "Arraste um nó. Teclado: setas movem o nó; Enter seleciona o próximo.",
              "Drag a node. Keyboard: arrows move the node; Enter selects the next.",
            )
          : id === "materia"
            ? t(
                "Arraste para semear. Teclado: setas posicionam; Enter cria um padrão.",
                "Drag to seed. Keyboard: arrows position; Enter seeds a pattern.",
              )
            : t(
                "Explore com o ponteiro ou use as setas nesta área.",
                "Explore with your pointer or use arrows in this area.",
              )}
        <span role="status" aria-live="polite" />
      </p>
    </>
  );
}
function MathUtilsClamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
export default function Simulations({
  id,
  reset,
  parameter,
}: {
  id: string;
  reset: number;
  parameter: number;
}) {
  const { t } = useShell(),
    [drag, setDrag] = useState(0),
    start = useRef<number | null>(null);
  useEffect(() => setDrag(0), [reset]);
  return id === "palavra" ? (
    <div
      className="type-piece"
      onPointerMove={(e) => {
        if (e.pointerType === "mouse")
          setDrag((e.clientX / e.currentTarget.clientWidth - 0.5) * 10);
      }}
    >
      <span
        className="type-outline"
        style={{
          transform: `translate(${parameter / 5 + drag}px,${-parameter / 8}px)`,
        }}
        aria-hidden="true"
      >
        {t("FORMA", "FORM")}
      </span>
      <strong
        style={{
          letterSpacing: parameter * 0.001 + "em",
          transform: `skewY(${drag * 0.15}deg)`,
        }}
      >
        {t("FORMA", "FORM")}
      </strong>
      <span
        className="type-outline lower"
        style={{
          transform: `translate(${-parameter / 5}px,${parameter / 8}px)`,
        }}
        aria-hidden="true"
      >
        {t("FORMA", "FORM")}
      </span>
    </div>
  ) : id === "dobras" ? (
    <div
      className="fold-piece"
      onPointerDown={(e) => {
        start.current = e.clientX;
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (start.current !== null) {
          setDrag((d) =>
            Math.max(-90, Math.min(90, d + (e.clientX - start.current!) * 0.4)),
          );
          start.current = e.clientX;
        }
      }}
      onPointerUp={() => {
        start.current = null;
      }}
      onPointerCancel={() => {
        start.current = null;
      }}
    >
      <div
        className="fold-volume"
        style={{ transform: `rotateX(-18deg) rotateY(${parameter + drag}deg)` }}
      >
        {Array.from({ length: 28 }, (_, i) => (
          <div
            key={i}
            className="fold-blade"
            style={{
              transform: `translateY(${(i - 14) * 9}px) rotateY(${i * 5.5}deg) rotateZ(${i * 1.4 - 20}deg)`,
            }}
          />
        ))}
      </div>
    </div>
  ) : (
    <CanvasPiece id={id} reset={reset} orientation={parameter} />
  );
}
