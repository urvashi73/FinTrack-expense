/** @type {import('next').NextConfig} */
const nextConfig = {
  // Explicitly disable Turbopack
  turbopack: {},

  experimental: {
    webpackBuildWorker: false,
  },

  webpack: (config) => {
    config.optimization.minimize = false;
    return config;
  },
};

module.exports = nextConfig;
