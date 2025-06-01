/** @type {import('next').NextConfig} */
const nextConfig = {
    output: process.env.ELECTRON === 'true' ? 'export' : undefined,
    distDir: 'out',
    trailingSlash: true,
    images: {
        unoptimized: true,
    },
    experimental: {
    }
}

module.exports = nextConfig