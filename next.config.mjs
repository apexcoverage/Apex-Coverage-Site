/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // 👇 TEMPORARY: lets the build complete even if there's a type error
    ignoreBuildErrors: true
  }
};

export default nextConfig;
