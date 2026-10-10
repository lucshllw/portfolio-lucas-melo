"use client";
import { useEffect, useState, type CSSProperties } from "react";

/** Isolated state keeps an email hover from rerendering the whole portfolio. */
export default function ContactGlitch() {
  const [active, setActive] = useState(false);
  useEffect(() => {
    const change = (event: Event) => setActive((event as CustomEvent<boolean>).detail);
    window.addEventListener("lm-email-glitch", change);
    return () => window.removeEventListener("lm-email-glitch", change);
  }, []);
  if (!active) return null;
  return <div className="contact-glitch-fragments" aria-hidden="true">{Array.from({ length: 12 }, (_, i) => <i key={i} style={{ "--fragment": i, left: `${7 + (i * 17) % 82}%`, top: `${8 + (i * 23) % 76}%`, width: `${5 + (i * 7) % 24}px` } as CSSProperties} />)}</div>;
}
