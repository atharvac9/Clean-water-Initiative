import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NeerDrishti (नीरदृष्टी) — Watershed Intelligence Dashboard",
  description:
    "Multi-spectral watershed monitoring and telemetry platform combining vegetation and moisture indices with OpenCLIP zero-shot field photo verification.",
  keywords: [
    "NeerDrishti",
    "watershed intelligence",
    "hydrology",
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
