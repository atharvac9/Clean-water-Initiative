import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Clean Water Initiative — Watershed Intelligence Dashboard",
  description:
    "Multi-source waterbody health monitoring platform combining Sentinel-2 satellite indices (NDVI/NDWI) with OpenCLIP zero-shot field photo verification and cross-validation.",
  keywords: [
    "watershed health",
    "clean water",
    "satellite telemetry",
    "Sentinel-2",
    "NDVI",
    "NDWI",
    "open-clip",
    "water conservation",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-[#080d1a] antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
