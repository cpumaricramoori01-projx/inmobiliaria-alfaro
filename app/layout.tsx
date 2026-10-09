import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
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
  metadataBase: new URL("https://intranet2.inmobiliariaalbertoalfaro.com.pe"),
  title: "Inmobiliaria Alberto Alfaro",
  description: "Gestiona tu cartera inmobiliaria, visitas y publicaciones en un solo lugar. Sistema de Inmobiliaria Alberto Alfaro.",
  openGraph: {
    type: "website",
    locale: "es_PE",
    siteName: "Inmobiliaria Alberto Alfaro",
    title: "Alberto Alfaro | Gestión inmobiliaria",
    description: "Tu cartera, visitas y publicaciones en un solo lugar.",
    images: [{ url: "/branding/compartir-v1.png", width: 1200, height: 630, alt: "Inmobiliaria Alberto Alfaro — Sistema de gestión inmobiliaria" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Alberto Alfaro | Gestión inmobiliaria",
    description: "Tu cartera, visitas y publicaciones en un solo lugar.",
    images: [{ url: "/branding/compartir-v1.png", alt: "Inmobiliaria Alberto Alfaro — Sistema de gestión inmobiliaria" }],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-slate-100 text-slate-900">
        {children}
      </body>
    </html>
  );
}
