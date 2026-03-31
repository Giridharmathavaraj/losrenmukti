/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Required for Zoho Catalyst Slate static serving
  images: {
    unoptimized: true // Required for static export
  }
};

export default nextConfig;
