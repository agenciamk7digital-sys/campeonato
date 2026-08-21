import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

import SiteShell from "@/components/layout/SiteShell";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FJU Esportes",
  description:
    "Campeonatos, jogos, times, jogadores, classificação e estatísticas da FJU Esportes.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={geist.variable}>
      <body>
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
