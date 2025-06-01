/** @type {import('next').NextConfig} */
const nextConfig = {
    output: process.env.ELECTRON === 'true' ? 'export' : undefined,
    distDir: 'out',
    images: {
        unoptimized: true,
    },
}

module.exports = nextConfig