import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/navbar";
import AppMain from "@/components/AppMain";
import { currentUser } from "@/services/session";

export const metadata: Metadata = {
  title: "Experience Manager",
  description: "Gerenciamento das telas do Innovation Center Accenture",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await currentUser();

  return (
    <html
      lang="pt-BR"
      className="h-full antialiased"
    >
      <body className="flex h-full flex-col">
        <Navbar user={user} />
        <AppMain>{children}</AppMain>
      </body>
    </html>
  );
}