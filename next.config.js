/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost', 'your-supabase-domain.supabase.co'],
  },
  experimental: {
    serverActions: true,
  },
}

module.exports = nextConfig
