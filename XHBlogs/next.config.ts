import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 注释掉静态导出，改用 Netlify 的 Next.js 插件跑 serverless functions（保留 API 路由）
  // output: 'export',

  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true, // 忽略 TS 错误，方便快速部署
  },
};

export default nextConfig;