/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['reactflow'],
  compiler: {
    styledComponents: true,
  },
  webpack: (config, { isServer }) => {
    // html-to-image는 클라이언트에서만 사용
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('html-to-image');
    }
    return config;
  },
};

module.exports = nextConfig;
