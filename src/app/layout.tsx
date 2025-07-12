import type { Metadata } from "next";
import { Toaster } from "@/components/ui/toaster";
import { Inter, Poppins } from 'next/font/google'
import "./globals.css";

export const metadata: Metadata = {
  title: "DataSnatcher",
  description: "Extract and analyze file metadata with AI-powered PII redaction.",
};

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const poppins = Poppins({
  weight: ['600', '700'],
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap',
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${poppins.variable}`}>
      <body className="font-body antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
