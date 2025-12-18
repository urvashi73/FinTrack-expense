/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // This stops the background process that is crashing
    webpackBuildWorker: false,
    // Disables the buggy LightningCSS compiler for now
    useLightningcss: false,
  },
  webpack: (config) => {
    // Bypasses the minifier crash by making CSS optimization less aggressive
    config.optimization.minimize = false;
    return config;
  },
};

export default nextConfig;