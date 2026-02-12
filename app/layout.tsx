import React from "react"
import type { Metadata, Viewport } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Banking AI Support Agent",
  description: "AI-powered banking support agent interface",
};

export const viewport: Viewport = {
  themeColor: "#0f1219",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
