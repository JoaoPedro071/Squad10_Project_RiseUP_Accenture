import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/navbar";
import AppMain from "@/components/AppMain";
import { currentUser } from "@/services/session";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Experience Management Platform",
  description: "Experience Management Platform Dashboard",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await currentUser();

  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex h-full flex-col">
        <Navbar user={user} />
        <AppMain>{children}</AppMain>
      </body>
    </html>
  );
}
