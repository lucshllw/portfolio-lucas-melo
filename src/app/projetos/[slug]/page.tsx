import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProjects } from "@/lib/content-server";
import Case from "@/components/projects/Case";
export async function generateStaticParams() {
  return (await getProjects()).map((p) => ({ slug: p.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = (await getProjects()).find((p) => p.slug === slug);
  return { title: p?.title.pt ?? "Projeto", description: p?.description.pt };
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params,
    p = (await getProjects()).find((p) => p.slug === slug);
  if (!p) notFound();
  return <Case project={p} />;
}
