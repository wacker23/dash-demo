/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  crossOrigin: 'anonymous',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.stl1.co.kr',
        port: '',
        pathname: '/bucket/**',
      }
    ]
  }
}

module.exports = nextConfig
