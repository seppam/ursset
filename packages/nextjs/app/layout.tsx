import type { Metadata, Viewport } from "next";
import { BottomNav } from "~~/components/BottomNav";
import { Header } from "~~/components/Header";
import { Providers } from "~~/components/Providers";
import "~~/styles/globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://ursset.vercel.app"),
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.png", sizes: "64x64", type: "image/png" },
    ],
    apple: "/apple-icon.png",
  },
  title: "URSSET: urunan asset",
  description: "3 langkah, kamu punya aset. Urunan bareng teman beli rumah kos, terima sewa, jual kapan saja.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0f9d6e" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <Providers>
          <Header />
          <main className="mx-auto w-full max-w-md px-4 pb-28 pt-4 md:max-w-5xl md:pb-12 md:pt-6">{children}</main>
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
