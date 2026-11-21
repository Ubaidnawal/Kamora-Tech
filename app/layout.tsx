import type { Metadata } from "next";
import { Inter, Oswald } from "next/font/google";
import type { ReactNode } from "react";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { CartProvider } from "@/components/cart/CartProvider";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { PageTransition } from "@/components/site/PageTransition";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const oswald = Oswald({ subsets: ["latin"], variable: "--font-oswald", display: "swap" });

export const metadata: Metadata = {
  title: {
    default: "Kamora Tech — Digital Solutions, Websites & Software",
    template: "%s | Kamora Tech",
  },
  description:
    "Kamora Tech is a digital agency building premium websites, custom software, management systems and business automation for clients worldwide.",
  keywords: [
    "Kamora Tech",
    "website development",
    "software development",
    "digital agency",
    "business automation",
    "e-commerce",
    "management systems",
  ],
  openGraph: {
    title: "Kamora Tech — We build digital experiences that move businesses forward",
    description:
      "From professional websites to powerful business software, Kamora Tech transforms ideas into modern digital solutions.",
    type: "website",
    siteName: "Kamora Tech",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${oswald.variable}`}
    >
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0B0B0B" />
      </head>
      <body>
        <AuthProvider>
          <CartProvider>
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-brass focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-paper-pure"
            >
              Skip to main content
            </a>
            <Header />
            <main id="main-content">
              <PageTransition>{children}</PageTransition>
            </main>
            <Footer />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
