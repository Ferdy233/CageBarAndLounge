import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cage Bar & Lounge",
  description: "Bar stock and staff operations dashboard",
  icons: {
    icon: "/bar-favicon.svg",
    shortcut: "/bar-favicon.svg",
    apple: "/bar-favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const SITE_LOCK = 'true'; // Set to 'false' to disable the lock
  
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {SITE_LOCK === 'true' ? (
          <div className="min-h-screen flex items-center justify-center bg-gray-900">
            <div className="text-center p-8">
              <h1 className="text-4xl font-bold text-red-500 mb-4">Service Unavailable</h1>
              <p className="text-xl text-gray-300">Email service subscription not renewed.</p>
            </div>
          </div>
        ) : (
          <Providers>{children}</Providers>
        )}
      </body>
    </html>
  );
}
