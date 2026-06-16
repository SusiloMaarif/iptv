/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/channels',
        destination: 'https://iptv-org.github.io/iptv/channels.json',
      },
    ];
  },
};

module.exports = nextConfig;