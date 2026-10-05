import { createMDX } from "fumadocs-mdx/next";
import path from "node:path";

const withMDX = createMDX();
const isVercelBuild = process.env.VERCEL === "1";

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  ...(isVercelBuild
    ? {}
    : {
        output: "standalone",
        outputFileTracingRoot: path.join(import.meta.dirname, "../.."),
      }),
};

export default withMDX(config);
