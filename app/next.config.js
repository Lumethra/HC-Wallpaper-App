/** @type {import('next').NextConfig} */
const nextConfig = {
    output: process.env.ELECTRON === 'true' ? 'export' : undefined,
    distDir: 'out',
    images: {
        unoptimized: true,
    },
    typescript: {
        ignoreBuildErrors: process.env.VERCEL_ENV === 'production',
    },
}

module.exports = nextConfig