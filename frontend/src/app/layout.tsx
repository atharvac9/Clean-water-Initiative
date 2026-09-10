import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MeerDrushti (नीरदृष्टी) — Watershed Intelligence Dashboard",
  description:
    "Autonomous satellite telemetry & multi-spectral monitoring platform combining Copernicus Sentinel-2 NDVI/NDWI indices with OpenCLIP zero-shot field photo verification.",
  keywords: [
    "MeerDrushti",
    "watershed health",
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
    <html lang="en" className="h-full bg-slate-50 text-slate-900 antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 selection:bg-teal-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
