import type { Metadata } from "next";
import Gallery from "@/components/gallery/Gallery";
export const metadata: Metadata = {
  title: "Galeria espacial",
  description: "Oito experiências interativas entre sistemas, matéria e forma.",
};
export default function Page() {
  return <Gallery />;
}
