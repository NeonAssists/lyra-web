import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Lyra — Rank your music",
  description: "Rank your music. Share your taste.",
  other: {
    'google': 'notranslate',
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" translate="no">
      <head>
        <meta httpEquiv="Content-Language" content="en" />
      </head>
      <body className={`${inter.className} min-h-screen bg-[#000000] text-white antialiased notranslate`} translate="no">
        {children}
      </body>
    </html>
  );
}
