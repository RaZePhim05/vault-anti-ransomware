import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Mengizinkan akses jaringan lokal/tunnel
  allowedDevOrigins: ['100.64.100.6', 'localhost:3000'],
};

export default nextConfig;