import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  async redirects() {
    return [
      {
        source: '/projects/adoptme',
        destination: '/projects/adoptio',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
