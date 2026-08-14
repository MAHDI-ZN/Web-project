import type { Metadata, Viewport } from "next";
import "./globals.css";
import { StoreHydration } from "@/components/StoreHydration";

export const metadata: Metadata = {
  title: "Melody | استریم موسیقی",
  description: "سرویس استریم موسیقی — فاز دوم بک‌اند و ادغام",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Melody",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f1412",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <body className="antialiased">
        <StoreHydration />
        {children}
      </body>
    </html>
  );
}
