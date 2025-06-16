/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  // Configuration pour le répertoire app
  generateStaticParams: async () => {
    return [{ slug: [''] }]
  }
}

export default nextConfig; 