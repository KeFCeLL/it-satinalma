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
  // External packages config (güncellenmiş hali)
  serverExternalPackages: ['@prisma/client'],
  // Daha basit output ayarı
  output: 'standalone',
  // Transpile problematic packages
  transpilePackages: ['crypto-js', 'use-count-up', 'react-chartjs-2', 'chart.js'],
  // Disable SWC minify for better compatibility
  swcMinify: false,
  // Enable strict mode for React
  reactStrictMode: true,
  // Optimize for production
  experimental: {
    optimizeCss: true,
    forceSwcTransforms: true,
  },
}

module.exports = nextConfig