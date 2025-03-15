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
  // External packages config for server components
  serverExternalPackages: ['@prisma/client']
}

module.exports = nextConfig