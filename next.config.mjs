/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  experimental: {
    outputFileTracingExcludes: {
      '*': [
        './node_modules/@swc/core-linux-x64-gnu',
        './node_modules/@swc/core-linux-x64-musl',
        './node_modules/@swc/core-linux-arm64-gnu',
        './node_modules/@swc/core-linux-arm64-musl',
        './node_modules/esbuild/bin',
        './node_modules/webpack',
        './node_modules/rollup',
      ],
    },
  },
}

export default nextConfig
