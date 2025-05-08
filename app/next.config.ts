import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.ELECTRON ? 'export' : undefined,
  images: {
    unoptimized: process.env.ELECTRON === 'true',
  },
};

export default nextConfig;