import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Experience Manager · Tela",
  description: "Player das telas do Innovation Center Accenture",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="h-screen overflow-hidden">{children}</body>
    </html>
  );
}