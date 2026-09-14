import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NeerDrishti — Watershed Intelligence & Verification",
  description:
    "Cross-check field photos against Sentinel-2 satellite data to verify water conservation work — check dams, farm ponds, afforestation — at any coordinate on earth.",
  keywords: [
    "NeerDrishti",
    "watershed intelligence",
    "satellite verification",
    "NDVI",
    "NDWI",
    "water conservation",
    "check dam",
    "field photo audit",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="min-h-full flex flex-col bg-strata text-basalt selection:bg-reservoir/20 selection:text-reservoir"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
