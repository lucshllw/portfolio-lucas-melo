"use client";
import { useEffect, useRef, useState } from "react";
import { useShell } from "@/components/shell/context";
import { profile } from "@/data/content";
import { replyParagraphs } from "@/lib/chat-format";
type Message = { role: "user" | "assistant"; content: string };
const clamp = (n: number, max: number) => Math.max(12, Math.min(n, Math.max(12, max)));

export default function MascotChat() {
  const { t } = useShell();
  const [open, setOpen] = useState(false), [position, setPosition] = useState({ x: 24, y: 100 });
  const [messages, setMessages] = useState<Message[]>([]), [input, setInput] = useState("");
  const [available, setAvailable] = useState<boolean | null>(null), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const [provider, setProvider] = useState("provedor de IA");
  const [panel, setPanel] = useState({ left: 12, top: 100 });
  const trigger = useRef<HTMLButtonElement>(null), field = useRef<HTMLInputElement>(null), log = useRef<HTMLDivElement>(null);
  const controller = useRef<AbortController | null>(null), moved = useRef(false);
  const drag = useRef<{ x: number; y: number; left: number; top: number } | null>(null);
  useEffect(() => {
    setPosition({ x: window.innerWidth - 94, y: window.innerHeight - 112 });
    const resize = () => setPosition(p => ({ x: clamp(p.x, innerWidth - 86), y: clamp(p.y, innerHeight - 100) }));
    window.addEventListener("resize", resize);
    return () => { window.removeEventListener("resize", resize); controller.current?.abort(); };
  }, []);
  useEffect(() => {
    setPanel({ left: clamp(position.x - 300, innerWidth - Math.min(380, innerWidth - 24) - 12), top: clamp(position.y - 480, innerHeight - Math.min(460, innerHeight - 100) - 12) });
  }, [position]);
  useEffect(() => {
    if (!open) return;
    const check = new AbortController();
    void fetch("/api/mascote", { signal: check.signal }).then(r => r.json()).then(data => { setAvailable(data.available === true); setProvider(data.provider === "Groq" ? "Groq" : data.provider === "OpenAI" ? "OpenAI" : "provedor de IA"); }).catch(() => { if (!check.signal.aborted) setAvailable(false); });
    field.current?.focus();
    return () => check.abort();
  }, [open]);
  useEffect(() => { if (log.current) log.current.scrollTop = log.current.scrollHeight; }, [messages, busy, error]);
  function close() { controller.current?.abort(); setBusy(false); setOpen(false); trigger.current?.focus(); }
  async function send() {
    if (!input.trim() || busy || available !== true) return;
    const next: Message[] = [...messages, { role: "user", content: input.trim() }];
    setMessages(next); setInput(""); setBusy(true); setError("");
    const abort = new AbortController(); controller.current = abort;
    try {
      const response = await fetch("/api/mascote", { method: "POST", headers: { "Content-Type": "application/json" }, signal: abort.signal, body: JSON.stringify({ messages: next.slice(-9) }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t("Não foi possível responder.", "Unable to reply."));
      if (!abort.signal.aborted) setMessages([...next, { role: "assistant", content: data.reply }]);
    } catch (err) { if (!abort.signal.aborted) { setError(err instanceof Error ? err.message : t("Falha de conexão.", "Connection failed.")); setInput(next.at(-1)!.content); setMessages(next.slice(0, -1)); } }
    finally { if (controller.current === abort) { setBusy(false); controller.current = null; } }
  }
  return <aside className="mascot-assistant" aria-label={t("Assistente de Lucas", "Lucas’s assistant")}>
    <button ref={trigger} className="mascot-pet" style={{ left: position.x, top: position.y }} aria-expanded={open} aria-controls="mascot-chat" aria-label={t("Conversar com o assistente. Arraste para mover; use as setas pelo teclado.", "Chat with the assistant. Drag to move; use keyboard arrows.")}
      onPointerDown={e => { if (e.button !== 0) return; moved.current = false; drag.current = { x: e.clientX, y: e.clientY, left: position.x, top: position.y }; e.currentTarget.setPointerCapture(e.pointerId); }}
      onPointerMove={e => { if (!drag.current) return; const dx = e.clientX - drag.current.x, dy = e.clientY - drag.current.y; if (Math.abs(dx) + Math.abs(dy) > 6) moved.current = true; if (moved.current) setPosition({ x: clamp(drag.current.left + dx, innerWidth - 86), y: clamp(drag.current.top + dy, innerHeight - 100) }); }}
      onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; moved.current = true; }}
      onClick={e => { if (!moved.current || e.detail === 0) { if (open) close(); else setOpen(true); } moved.current = false; }}
      onKeyDown={e => { const d: Record<string, [number, number]> = { ArrowLeft: [-20, 0], ArrowRight: [20, 0], ArrowUp: [0, -20], ArrowDown: [0, 20] }; if (d[e.key]) { e.preventDefault(); setPosition(p => ({ x: clamp(p.x + d[e.key][0], innerWidth - 86), y: clamp(p.y + d[e.key][1], innerHeight - 100) })); } }}>
      {/* Small SVG uses the existing mascot identity without a second WebGL scene. */}
      <img src="/obras/criatura-v2.svg" width="70" height="84" alt="" draggable={false} />
      <span className="mascot-dot" aria-hidden="true" />
    </button>
    {open && <section id="mascot-chat" className="mascot-chat" role="dialog" aria-label={t("Converse sobre Lucas Melo", "Ask about Lucas Melo")} style={panel} onKeyDown={e => { if (e.key === "Escape") close(); }} data-lenis-prevent>
      <header><div><strong>Lucas Melo</strong><small>{t("Assistente de IA", "AI assistant")}</small></div><button onClick={close} aria-label={t("Fechar conversa", "Close chat")}>×</button></header>
      <div className="mascot-messages" ref={log} role="log" aria-live="polite" aria-relevant="additions text">
        {messages.map((m, i) => <div key={i} className={`chat-message ${m.role}`}><span className="sr-only">{m.role === "user" ? t("Você: ", "You: ") : t("Assistente: ", "Assistant: ")}</span>{(m.role === "assistant" ? replyParagraphs(m.content) : [m.content]).map((paragraph, j) => <p key={j}>{paragraph}</p>)}</div>)}
        {available === false && <p className="chat-status">{t("O assistente ainda está sendo conectado. Enquanto isso, ", "The assistant is not connected yet. In the meantime, ")}<a href={`mailto:${profile.email}`}>{t("fale com Lucas por e-mail", "contact Lucas by email")}</a>.</p>}
        {busy && <p className="chat-status">{t("Escrevendo…", "Writing…")}</p>}
        {error && <p role="alert" className="chat-status">{error}</p>}
      </div>
      <form onSubmit={e => { e.preventDefault(); void send(); }}><label className="sr-only" htmlFor="mascot-message">{t("Sua mensagem", "Your message")}</label><input id="mascot-message" ref={field} value={input} onChange={e => setInput(e.target.value)} maxLength={1200} placeholder={t("Escreva sua mensagem…", "Write a message…")} autoComplete="off" /><button disabled={!input.trim() || busy || available !== true} aria-label={t("Enviar mensagem", "Send message")}>↑</button></form>
      <small className="chat-privacy">{t(`Respostas de IA podem conter erros. Ao enviar, sua mensagem é processada por ${provider}. Não envie dados sensíveis.`, `AI can make mistakes. Messages are processed by ${provider} when sent. Do not share sensitive data.`)}</small>
    </section>}
  </aside>;
}
