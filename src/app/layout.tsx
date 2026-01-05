import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import MosaicBackground from "@/components/mosaic-background";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Valwanna | Wishlist",
  description: "Wishlist de cadeaux avec espace administrateur sécurisé.",
  icons: [
    { rel: "icon", url: "/favicon.png" },
    { rel: "apple-touch-icon", url: "/apple-touch-icon.png" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${jakarta.variable} antialiased`}>
        <MosaicBackground />
        <div className="relative flex min-h-screen flex-col">{children}</div>
      </body>
    </html>
  );
}
