/** @type {import('next').NextConfig} */
const nextConfig = {
  // Empty turbopack config to silence warning
  turbopack: {},
  webpack: (config) => {
    // ArcGIS requires canvas externalization
    config.externals = [...(config.externals || []), { canvas: 'canvas' }]
    return config
  },
}

export default nextConfig
