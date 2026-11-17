import type { Metadata, Viewport } from "next";
import { Inter, Lora, Noto_Nastaliq_Urdu, Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap"
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  display: "swap"
});

const urdu = Noto_Nastaliq_Urdu({
  subsets: ["arabic"],
  weight: ["400", "700"],
  variable: "--font-urdu",
  display: "swap"
});

const devanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  weight: ["400", "500", "600"],
  variable: "--font-devanagari",
  display: "swap"
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "AI Journal — write a little, understand a lot",
    template: "%s · AI Journal"
  },
  description:
    "A private daily journal with guided questions, mood tracking, voice capture and an assistant that drafts — never rewrites — your day.",
  applicationName: "AI Journal",
  openGraph: {
    title: "AI Journal",
    description:
      "Write in your own language. Keep every original word. Let an assistant turn it into a structured entry — only when you approve it.",
    type: "website",
    siteName: "AI Journal"
  },
  robots: { index: true, follow: true },
  icons: { icon: "/favicon.ico" }
};

export const viewport: Viewport = {
  themeColor: "#faf8f5",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${lora.variable} ${urdu.variable} ${devanagari.variable}`}
    >
      <body className="min-h-dvh bg-canvas text-ink antialiased">
        <a
          href="#main"
          className="sr-only rounded-sm bg-surface px-4 py-2 text-sm font-medium text-ink shadow-raised focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50"
        >
          Skip to content
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
