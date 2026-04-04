import type { NextConfig } from "next";

function getAllowedDevOrigins() {
  const defaults = new Set(["http://localhost:3000", "http://127.0.0.1:3000"]);
  const webPublicUrl = process.env.WEB_PUBLIC_URL;

  if (!webPublicUrl) {
    return Array.from(defaults);
  }

  try {
    defaults.add(new URL(webPublicUrl).origin);
  } catch {
    defaults.add(webPublicUrl);
  }

  return Array.from(defaults);
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: getAllowedDevOrigins()
};

export default nextConfig;