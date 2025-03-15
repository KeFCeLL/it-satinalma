/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  output: 'standalone', // Server-side rendering kullan
  experimental: {
    // Build sırasında oluşabilecek uyarıları baskıla
    missingSuspenseWithCSRBailout: false,
  }
}

module.exports = nextConfig
