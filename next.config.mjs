/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true
  },
  // Disable compression — Zoho Slate's reverse proxy conflicts with
  // Next.js built-in gzip, causing ERR_CONTENT_DECODING_FAILED on POST requests
  compress: false,
};

export default nextConfig;
