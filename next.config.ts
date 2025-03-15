/** @type {import('next').NextConfig} */
const nextConfig = {
<<<<<<< HEAD
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
=======
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
>>>>>>> 21ceb3168e5b8555fabe4394c29cc1c823942178
