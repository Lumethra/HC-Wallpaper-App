import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from '@vercel/analytics/react';
import ScrollbarPaddingAdjuster from '@/components/ScrollbarPaddingAdjuster';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#000033",
};

export const metadata: Metadata = {
  title: "HC Wallpaper App",
  description: "Get wallpapers from #background-per-day",
  icons: {
    icon: [{ url: "/icons/Abhay-App-Icon.jpg" }],
    shortcut: [{ url: "/icons/Abhay-App-Icon.jpg" }],
    apple: [{ url: "/icons/Abhay-App-Icon.jpg" }],
  },
  manifest: "/manifest.json",
  appleWebApp: {
    title: "HC Wallpaper App",
    statusBarStyle: "black-translucent",
    capable: true,
    startupImage: [{ url: "/icons/Abhay-App-Icon.jpg" }]
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/icons/Abhay-App-Icon.jpg" />
        <link rel="shortcut icon" href="/icons/Abhay-App-Icon.jpg" />
        <link rel="apple-touch-icon" href="/icons/Abhay-App-Icon.jpg" />
        <meta name="msapplication-TileImage" content="/icons/Abhay-App-Icon.jpg" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ScrollbarPaddingAdjuster />
        {children}
        <Analytics />
      </body>
    </html>
  );
}