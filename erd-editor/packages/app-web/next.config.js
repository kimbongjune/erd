/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['reactflow'],
  compiler: {
    styledComponents: true,
  },
};

module.exports = nextConfig;
