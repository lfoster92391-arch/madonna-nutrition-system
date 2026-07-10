import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { QueryProvider } from "@/components/providers/QueryProvider"
import { AuthProvider } from "@/components/providers/AuthProvider"
import { DemoProvider } from "@/components/providers/DemoProvider"
import "./globals.css"

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
})

const appUrl =
  process.env.NEXT_PUBLIC_APP_URL ??
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "https://fuelthedons.com")

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
}

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "Fuel The Dons",
    template: "%s | Fuel The Dons",
  },
  description:
    "School nutrition platform for Madonna High School — meals, balances, and cafeteria operations.",
  applicationName: "Fuel The Dons",
  keywords: [
    "Fuel The Dons",
    "Madonna High School",
    "school nutrition",
    "cafeteria management",
    "parent portal",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    url: "/",
    title: "Fuel The Dons",
    description:
      "School nutrition platform for Madonna High School — meals, balances, and cafeteria operations.",
    siteName: "Fuel The Dons",
    locale: "en_US",
    type: "website",
    images: [{ url: "/fuel-the-dons-logo.png", alt: "Fuel The Dons" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Fuel The Dons",
    description:
      "School nutrition platform for Madonna High School — meals, balances, and cafeteria operations.",
    images: ["/fuel-the-dons-logo.png"],
  },
  icons: {
    icon: "/icon.png",
    apple: "/apple-touch-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white text-primary">
        <QueryProvider>
          <DemoProvider>
            <AuthProvider>{children}</AuthProvider>
          </DemoProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
