import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Lyra — Rank your music",
  description: "Rank your music. Share your taste.",
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
        {/* Hard-block all browser auto-translate — Chrome, Safari, Firefox */}
        <meta name="google" content="notranslate" />
        <meta httpEquiv="Content-Language" content="en" />
        <script dangerouslySetInnerHTML={{ __html: `
          document.documentElement.setAttribute('translate','no');
          document.documentElement.setAttribute('lang','en');
          if(window.chrome){try{chrome.runtime&&chrome.runtime.sendMessage&&chrome.runtime.sendMessage('aapbdbdomjkkjkaonfhkkikfgjllcleb',{type:'STOP_TRANSLATE'})}catch(e){}}
        ` }} />
      </head>
      <body className={`${inter.className} min-h-screen bg-[#000000] text-white antialiased notranslate`} translate="no">
        {children}
      </body>
    </html>
  );
}
