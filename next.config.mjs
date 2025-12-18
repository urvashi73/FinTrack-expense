/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable the experimental build worker which is causing the childProcess error
  experimental: {
    webpackBuildWorker: false,
  },
  webpack: (config, { dev, isServer }) => {
    // Disable minification only in production to bypass the OKLCH crash
    if (!dev && !isServer) {
      config.optimization.minimize = false;
    }
    return config;
  },
};

export default nextConfig;