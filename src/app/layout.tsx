import type { Metadata } from "next"
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
    : "https://fuelthebluedons.com")

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "Madonna Nutrition Management System",
    template: "%s | Fuel The Dons",
  },
  description:
    "Enterprise cafeteria operations platform — safer meals, faster service, better visibility.",
  applicationName: "Madonna Nutrition Management System",
  keywords: [
    "Fuel The Dons",
    "school nutrition",
    "cafeteria management",
    "Madonna Nutrition Management System",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    url: "/",
    title: "Madonna Nutrition Management System",
    description:
      "Enterprise cafeteria operations platform — safer meals, faster service, better visibility.",
    siteName: "Fuel The Dons",
    locale: "en_US",
    type: "website",
    images: [{ url: "/fuel-the-dons-logo.png", alt: "Fuel The Dons" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Madonna Nutrition Management System",
    description:
      "Enterprise cafeteria operations platform — safer meals, faster service, better visibility.",
    images: ["/fuel-the-dons-logo.png"],
  },
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
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
          <AuthProvider>
            <DemoProvider>{children}</DemoProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
