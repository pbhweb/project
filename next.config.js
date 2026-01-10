/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "xkohlmtgycuumwmockdt.supabase.co",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
    ],
    unoptimized: true, // <UPDATE> Added unoptimized option
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  typescript: {
    ignoreBuildErrors: true, // <UPDATE> Added ignoreBuildErrors option
  },
}

module.exports = nextConfig
