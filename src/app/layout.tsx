import type { Metadata } from "next";
import Shell from "@/components/shell/Shell";
import "@fontsource-variable/manrope";
import "@fontsource-variable/archivo/standard.css";
import "@fontsource/instrument-serif/latin-400.css";
import "./globals.css";
import "./rebuild.css";
import "./refinements.css";
import "./final-polish.css";
export const metadata: Metadata = {
  icons: { icon: "/icon.svg" },
  title: {
    default: "Lucas Melo — Desenvolvimento, IA e automação",
    template: "%s | Lucas Melo",
  },
  description:
    "Transformo complexidade em soluções úteis. Projetos, estudos e experimentos de Lucas Melo.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
