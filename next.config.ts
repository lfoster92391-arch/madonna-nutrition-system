import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
    dangerouslyAllowSVG: true,
    unoptimized: false,
  },
  async redirects() {
    return [
      { source: "/scan", destination: "/kiosk", permanent: true },
      { source: "/cafeteria/scan", destination: "/kiosk", permanent: true },
      { source: "/login/cashier", destination: "/kiosk", permanent: false },
      { source: "/auth/parent", destination: "/login/parent", permanent: false },
      { source: "/auth/admin", destination: "/login/admin", permanent: false },
      { source: "/auth/teacher", destination: "/login/teacher", permanent: false },
      { source: "/auth/cashier", destination: "/kiosk", permanent: false },
      { source: "/admin/menu", destination: "/admin/menu-library", permanent: false },
      { source: "/admin/inventory", destination: "/inventory", permanent: false },
      { source: "/parent/add-funds", destination: "/parent/payments?tab=funding", permanent: false },
      { source: "/parent/transactions", destination: "/parent/payments?tab=activity", permanent: false },
      { source: "/parent/meal-history", destination: "/parent/payments?tab=activity&category=meal", permanent: false },
      { source: "/parent/payment-methods", destination: "/parent/payments?tab=billing", permanent: false },
    ]
  },
}

export default nextConfig
