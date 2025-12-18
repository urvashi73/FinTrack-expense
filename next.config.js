/** @type {import('next').NextConfig} */
const nextConfig = {
  // Explicitly disable Turbopack
  turbopack: {},

  experimental: {
    webpackBuildWorker: false,
  },

  images: {
    domains: ["randomuser.me"],
  },

  webpack: (config) => {
    config.optimization.minimize = false;
    return config;
  },
};

module.exports = nextConfig;
