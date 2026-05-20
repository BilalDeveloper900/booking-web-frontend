import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Poppins, Geist_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { ThemeProvider, themeBootScript } from "@/components/theme-provider";
import { OfflineIndicator } from "@/components/offline-indicator";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";
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
  title: "Book It Daily — Salon Management",
  description: "Manage your salon bookings, admins, and clients",
  manifest: "/manifest.webmanifest",
  applicationName: "Book It Daily",
  appleWebApp: {
    capable: true,
    title: "Book It Daily",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icons/bookitdaily-192.svg", sizes: "192x192", type: "image/svg+xml" },
      { url: "/icons/bookitdaily-512.svg", sizes: "512x512", type: "image/svg+xml" },
    ],
    apple: { url: "/icons/bookitdaily-512.svg", sizes: "512x512", type: "image/svg+xml" },
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
      <body className="min-h-full flex flex-col">
        {/* Runs before any Next.js code + before hydration to set the
         * .dark class so cold loads don't flash from light to dark.
         * Inline body MUST be passed as children (not via
         * dangerouslySetInnerHTML) — React 19 flags the latter as an
         * inert <script> tag, the children form is the supported path. */}
        <Script id="theme-boot" strategy="beforeInteractive">
          {themeBootScript}
        </Script>
        <ThemeProvider>
          {children}
          <OfflineIndicator />
          <PWAInstallPrompt />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              // .toast-themed (defined in globals.css) uses CSS variables +
              // !important so it overrides react-hot-toast's inline white
              // background and adapts to light/dark via :root and .dark.
              className: "toast-themed",
              success: {
                iconTheme: {
                  primary: "var(--pos)",
                  secondary: "var(--card)",
                },
              },
              error: {
                iconTheme: {
                  primary: "var(--neg)",
                  secondary: "var(--card)",
                },
              },
            }}
          />
        </ThemeProvider>
        <Script id="register-sw" strategy="afterInteractive">
          {`if ('serviceWorker' in navigator) { window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {})); }`}
        </Script>
      </body>
    </html>
  );
}
