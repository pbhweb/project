/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost', 'xkohlmtgycuumwmockdt.supabase.co'],
  },
  experimental: {
    serverActions: true,
  },
}


module.exports = nextConfig
