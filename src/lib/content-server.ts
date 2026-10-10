import "server-only";
import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { projects } from "@/data/content";
const copy = z.object({ pt: z.string().min(1), en: z.string().min(1) });
const projectSchema = z.object({
  preview: z.enum(["tasks", "workflow", "network", "game"]).optional(),
  game: z.enum(["percurso", "travessia", "fragmentos"]).optional(),
  url: z.string().url().startsWith("https://").optional(),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: copy,
  description: copy,
  problem: copy,
  contribution: copy,
  decisions: copy,
  evidence: copy,
  technologies: z.array(z.string()),
  media: z.array(z.string().regex(/^\/(obras|projetos)\/[a-z0-9-]+\.(svg|jpg|webp|png)$/)),
  published: z.boolean(),
  kind: copy,
});
export const getProjects = cache(async () => {
  if (process.env.CONTENT_SOURCE !== "supabase") return projects;
  const url = process.env.SUPABASE_URL,
    key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key)
    throw new Error(
      "CONTENT_SOURCE=supabase requires SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY. Local preview uses CONTENT_SOURCE=local.",
    );
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (url, init) =>
        fetch(url, { ...init, signal: AbortSignal.timeout(8000) }),
    },
  });
  const { data, error } = await client
    .from("portfolio_projects")
    .select("content")
    .eq("published", true)
    .order("display_order");
  if (error) throw error;
  return z
    .array(z.object({ content: projectSchema }))
    .parse(data)
    .map((row) => row.content);
});
