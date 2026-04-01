/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true
  },
  // Turbopack is the default in Next.js 15 dev mode
  // useRouter error was fixed by adding 'use client' directives
};

export default nextConfig;
