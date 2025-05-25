import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from '@vercel/analytics/react';
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
  title: "HC Wallpaper App",
  description: "Get wallpapers from #background-per-day",
  icons: {
    icon: [
      { url: "/icons/Abhay-App-Icon.jpg", sizes: "any" },
    ],
    shortcut: "/icons/Abhay-App-Icon.jpg",
  },
  manifest: "/manifest.json",
  themeColor: "#000033",
  appleWebApp: {
    title: "HC Wallpaper App",
    statusBarStyle: "black-translucent",
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
        <link rel="shortcut icon" href="/icons/Abhay-App-Icon.jpg" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}