/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  output: 'standalone',
  distDir: 'out',
  experimental: {
    webpackBuildWorker: false,
    parallelServerBuildTraces: false,
    parallelServerCompiles: false,
  },
  webpack: (config, { isServer }) => {
    // Ajout de la configuration webpack personnalisée
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
  // Ne garder que les pages nécessaires pour l'app mobile
  rewrites: async () => {
    return {
      beforeFiles: [
        {
          source: '/api/:path*',
          destination: 'https://productif.io/api/:path*',
        },
      ],
    }
  },
  // Activer à la fois le dossier app et pages
  reactStrictMode: true
}

export default nextConfig 