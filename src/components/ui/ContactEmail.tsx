"use client";
import { useEffect, useRef, useState } from "react";
import { profile } from "@/data/content";
import { motionCopy } from "./MotionCopy";
import { useShell } from "@/components/shell/context";

export default function ContactEmail() {
  const { t } = useShell();
  const [active, setActive] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stop = () => { if (timer.current) clearTimeout(timer.current); setActive(false); window.dispatchEvent(new CustomEvent("lm-email-glitch", { detail: false })); };
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); if (statusTimer.current) clearTimeout(statusTimer.current); window.dispatchEvent(new CustomEvent("lm-email-glitch", { detail: false })); }, []);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopyStatus(t("E-mail copiado.", "Email copied."));
      play();
    } catch { setCopyStatus(t("Não foi possível copiar. Selecione o endereço para copiar manualmente.", "Unable to copy. Select the address and copy it manually.")); }
    if (statusTimer.current) clearTimeout(statusTimer.current);
    statusTimer.current = setTimeout(() => setCopyStatus(""), 4000);
  };
  const play = () => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (timer.current) clearTimeout(timer.current);
    setActive(true);
    window.dispatchEvent(new CustomEvent("lm-email-glitch", { detail: true }));
    timer.current = setTimeout(() => { setActive(false); window.dispatchEvent(new CustomEvent("lm-email-glitch", { detail: false })); }, 650);
  };
  return <>
    <div className={`contact-email-wrap ${active ? "email-glitch-active" : ""}`}><button type="button" className="contact-email" data-text={profile.email} aria-label={t("Copiar e-mail de Lucas Melo", "Copy Lucas Melo’s email address")} onClick={() => { void copy(); }}
      onPointerEnter={e => { if (e.pointerType !== "touch") play(); }} onPointerLeave={stop} onFocus={play} onBlur={stop}>
      {motionCopy(<span>{profile.email}</span>)}
      <span className="email-local-echo" data-echo={profile.email} aria-hidden="true">{profile.email}</span>
    </button><span className="email-copy-status" role="status" aria-live="polite">{copyStatus && <span aria-hidden="true">✓ </span>}{copyStatus}</span></div>
  </>;
}
