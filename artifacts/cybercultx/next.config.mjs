import path from "node:path";

const basePath = process.env.BASE_PATH?.replace(/\/$/, "") || "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath,
  outputFileTracingRoot: path.join(import.meta.dirname, "../.."),
  transpilePackages: ["@workspace/api-client-react"],
  webpack(config) {
    config.resolve.alias["@"] = path.resolve(import.meta.dirname, "src");
    config.resolve.alias["@assets"] = path.resolve(import.meta.dirname, "src/assets");
    return config;
  },
};

export default nextConfig;
