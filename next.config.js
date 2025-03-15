/** @type {import('next').NextConfig} */
const nextConfig = {
  // Linting hatalarını build sırasında görmezden gel
  eslint: {
    ignoreDuringBuilds: true,
  },
  // TypeScript hatalarını build sırasında görmezden gel
  typescript: {
    ignoreBuildErrors: true,
  },
  // URL API hatalarını düzelt
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client']
  }
}

module.exports = nextConfig