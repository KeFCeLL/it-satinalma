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
}

module.exports = nextConfig