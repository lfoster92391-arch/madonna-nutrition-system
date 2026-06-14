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
      {
        source: "/cafeteria/scan",
        destination: "/scan",
        permanent: true,
      },
      {
        source: "/login/cashier",
        destination: "/scan",
        permanent: false,
      },
    ]
  },
}

export default nextConfig
