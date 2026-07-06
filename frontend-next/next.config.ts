import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the project root so Turbopack doesn't misdetect it from stray
  // lockfiles elsewhere on the machine (this dir holds package-lock.json).
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
