import { chatSchema, createRateGuard, mascotInstructions } from "@/lib/mascot";
export const runtime = "nodejs";
const guard = createRateGuard();
const headers = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };
const providerConfig = () => process.env.AI_PROVIDER === "groq"
  ? { name: "Groq", key: process.env.GROQ_API_KEY, model: process.env.GROQ_MODEL || "openai/gpt-oss-20b", groq: true }
  : process.env.AI_PROVIDER === "openai" || !process.env.AI_PROVIDER
    ? { name: "OpenAI", key: process.env.OPENAI_API_KEY, model: process.env.OPENAI_MODEL, groq: false }
    : null;
const configured = () => Boolean(providerConfig()?.key && providerConfig()?.model && (process.env.NODE_ENV !== "production" || process.env.SITE_URL));
const error = (message: string, status: number) => Response.json({ error: message }, { status, headers });

export function GET() { return Response.json({ available: configured(), provider: providerConfig()?.name || "provedor de IA" }, { headers }); }

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const url = new URL(request.url);
  let allowed: string[] = [];
  try { allowed = process.env.SITE_URL ? [new URL(process.env.SITE_URL).origin] :
    process.env.NODE_ENV !== "production" ? [url.origin, `http://127.0.0.1:${url.port || 80}`, `http://localhost:${url.port || 80}`] : []; }
  catch { return error("O assistente ainda está sendo configurado.", 503); }
  if (!origin || !allowed.includes(origin)) return error("Origem não autorizada.", 403);
  if (!request.headers.get("content-type")?.startsWith("application/json")) return error("Formato inválido.", 415);
  if (!configured()) return error("O assistente ainda está sendo conectado. Você pode falar com Lucas pelos contatos do portfólio.", 503);
  // Bound streamed bodies too; Content-Length alone is untrusted.
  const reader = request.body?.getReader();
  if (!reader) return error("Mensagem vazia.", 400);
  let size = 0; const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > 16384) { await reader.cancel(); return error("Conversa muito longa. Inicie uma nova conversa.", 413); }
      chunks.push(value);
    }
  } catch { return error("Não foi possível ler a mensagem.", 400); }
  let payload;
  try { payload = chatSchema.safeParse(JSON.parse(Buffer.concat(chunks).toString("utf8"))); }
  catch { return error("Mensagem inválida.", 400); }
  if (!payload.success) return error("Use até 1.200 caracteres por mensagem.", 400);
  // Netlify supplies this header. On other hosts share a conservative global bucket.
  const key = process.env.NETLIFY === "true" ? request.headers.get("x-nf-client-connection-ip") || "global" : "global";
  if (!guard.acquire(key)) return Response.json({ error: "Limite temporário atingido. Tente novamente mais tarde." }, { status: 429, headers: { ...headers, "Retry-After": "60" } });
  try {
    const provider = providerConfig()!;
    const response = await fetch(provider.groq ? "https://api.groq.com/openai/v1/chat/completions" : "https://api.openai.com/v1/responses", {
      method: "POST", headers: { Authorization: `Bearer ${provider.key}`, "Content-Type": "application/json" },
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(20000)]),
      body: JSON.stringify(provider.groq ? { model: provider.model,
        messages: [{ role: "system", content: mascotInstructions }, ...payload.data.messages],
        max_completion_tokens: 1000, reasoning_effort: "low", include_reasoning: false, stream: false }
        : { model: provider.model, instructions: mascotInstructions,
          input: payload.data.messages, max_output_tokens: 500, store: false }),
    });
    if (!response.ok) {
      const detail = await response.json().catch(() => null);
      const code = ["insufficient_quota", "invalid_api_key", "model_not_found", "rate_limit_exceeded", "unsupported_country_region_territory"].includes(detail?.error?.code) ? detail.error.code : "provider_error";
      if (process.env.NODE_ENV !== "production") console.warn("Mascot provider status:", response.status, code);
      if (response.status === 429) return Response.json({ error: `${provider.name} atingiu um limite de uso da API. Tente mais tarde ou fale com Lucas pelos contatos do portfólio.` }, { status: 429, headers: { ...headers, "Retry-After": "60" } });
      return error(code === "insufficient_quota" ? "O assistente está sem saldo de API no momento. Você pode falar com Lucas pelos contatos do portfólio." : "O assistente está indisponível no momento. Tente novamente mais tarde.", 502);
    }
    const data = await response.json();
    const text = provider.groq ? (typeof data.choices?.[0]?.message?.content === "string" ? data.choices[0].message.content.trim() : "") : (data.output || []).flatMap((item: { type: string; content?: { type: string; text?: string }[] }) =>
      item.type === "message" ? (item.content || []).filter(part => part.type === "output_text").map(part => part.text || "") : []).join("\n").trim();
    if (!text) return error("Não foi possível concluir a resposta. Tente novamente.", 502);
    return Response.json({ reply: text.slice(0, 4000) }, { headers });
  } catch { return error("A resposta demorou mais que o esperado. Tente novamente.", 504); }
  finally { guard.release(); }
}
