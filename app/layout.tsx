import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MedPersona — Turn Expertise Into Influence",
  description:
    "MedPersona adalah agensi media sosial khusus untuk dokter dan tenaga medis. Kami membantu membangun personal branding dan kehadiran digital profesional Anda. Dipersembahkan oleh PT Apexa Buana Hospita.",
  keywords: [
    "social media agency",
    "dokter",
    "personal branding",
    "media sosial",
    "tenaga medis",
    "MedPersona",
    "PT Apexa Buana Hospita",
  ],
  openGraph: {
    title: "MedPersona — Turn Expertise Into Influence",
    description:
      "Agensi media sosial khusus untuk dokter dan tenaga medis.",
    url: "https://medpersona.id",
    siteName: "MedPersona",
    locale: "id_ID",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${inter.variable} antialiased`}>
      <body className="min-h-screen flex flex-col font-[family-name:var(--font-inter)]">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
