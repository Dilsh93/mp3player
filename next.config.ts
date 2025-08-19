import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
const basePathFromEnv = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "export",
  basePath: isProd && basePathFromEnv ? basePathFromEnv : undefined,
  assetPrefix: isProd && basePathFromEnv ? `${basePathFromEnv}/` : undefined,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
