import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Poppins, Geist_Mono } from "next/font/google";
import { ThemeProvider, themeBootScript } from "@/components/theme-provider";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Maison & Co. — Salon Management",
  description: "Manage your salon bookings, stylists, and clients",
  manifest: "/manifest.webmanifest",
  applicationName: "Maison & Co.",
  appleWebApp: {
    capable: true,
    title: "Maison & Co.",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icons/maison-192.svg", sizes: "192x192", type: "image/svg+xml" },
      { url: "/icons/maison-512.svg", sizes: "512x512", type: "image/svg+xml" },
    ],
    apple: { url: "/icons/maison-512.svg", sizes: "512x512", type: "image/svg+xml" },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf9" },
    { media: "(prefers-color-scheme: dark)", color: "#222222" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${poppins.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Sync — runs before paint to avoid a light->dark flash on cold loads. */}
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>{children}</ThemeProvider>
        <Script id="register-sw" strategy="afterInteractive">
          {`if ('serviceWorker' in navigator) { window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {})); }`}
        </Script>
      </body>
    </html>
  );
}
