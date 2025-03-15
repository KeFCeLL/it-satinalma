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
  
  // Static export yerine server-side rendering kullan
  output: 'standalone',
  
  // Server actions (Next.js 13+)
  experimental: {
    serverActions: true,
  }
}

module.exports = nextConfig