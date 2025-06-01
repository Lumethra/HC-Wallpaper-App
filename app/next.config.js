/** @type {import('next').NextConfig} */
const nextConfig = {
    output: process.env.ELECTRON === 'true' ? 'export' : undefined,
    distDir: 'out',
    trailingSlash: true,
    assetPrefix: process.env.ELECTRON === 'true' ? './' : '',
    images: {
        unoptimized: true,
    },
    experimental: {
        appDir: true,
    }
}

module.exports = nextConfig