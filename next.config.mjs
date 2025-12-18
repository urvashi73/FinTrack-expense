/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    webpackBuildWorker: false,
  },
  webpack: (config, { isServer }) => {
    // Disable CSS optimization that is causing the crash
    if (config.optimization && config.optimization.minimizer) {
      config.optimization.minimize = false;
    }
    return config;
  },
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;