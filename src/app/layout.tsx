import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { CryptoProvider } from "@/context/CryptoProvider";
import { EclipseProvider } from "@/context/EclipseProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Eclipse — E2E Encrypted Chat",
  description:
    "End-to-end encrypted messaging and private groups. Nitro upgrades for more friends.",
  applicationName: "Eclipse",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Eclipse",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#020617",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="manifest" href="/manifest.webmanifest" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans h-full antialiased`}
      >
        <CryptoProvider>
          <EclipseProvider>{children}</EclipseProvider>
        </CryptoProvider>
      </body>
    </html>
  );
}
