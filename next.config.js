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
  serverExternalPackages: ['@prisma/client'],
  // Experimental features
  experimental: {
    missingSuspenseWithCSRBailout: false,
    // Bu sorun belli dosya yolları ile ilgili olduğundan
    // serverComponentsExternalPackages özelliğini de belirtiyoruz
    serverComponents: true,
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  // Standalone output seçeneği ekleyelim
  output: 'standalone',
}

module.exports = nextConfig