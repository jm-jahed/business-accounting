/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@accounting/core', '@accounting/contracts'],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5050/api/:path*',
      },
    ];
  },
};

export default nextConfig;
