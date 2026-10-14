/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@accounting/core', '@accounting/contracts'],
};

export default nextConfig;
