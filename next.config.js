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
  serverComponentsExternalPackages: ['@prisma/client'],
  // Daha basit output ayarı
  output: 'standalone',
  // Transpile problematic packages
  transpilePackages: ['crypto-js', 'use-count-up', 'react-chartjs-2', 'chart.js'],
  // Enable strict mode for React
  reactStrictMode: true,
  // CSS optimization
  optimizeCss: true,
}

module.exports = nextConfig