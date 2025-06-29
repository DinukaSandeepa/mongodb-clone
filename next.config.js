/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/email/:path*',
        destination: '/api/email/:path*',
      },
    ];
  },
};

module.exports = nextConfig;