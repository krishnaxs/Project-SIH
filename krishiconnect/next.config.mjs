/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Prevents production builds from failing due to ESLint formatting warnings
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
