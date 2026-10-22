/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep gzip on (default in prod, but explicit)
  compress: true,

  // React strict mode helps catch bugs early and has no prod cost
  reactStrictMode: true,

  // Don't type-check during build — we run `tsc --noEmit` separately.
  // (Leaving this `false` meant Next was running a full TS pass during `next build`
  // on top of SWC, which was roughly doubling build time.)
  typescript: {
    ignoreBuildErrors: false,
  },

  images: {
    // O app não usa next/image. Desligar o otimizador faz /_next/image
    // responder 404, o que fecha os CVEs do Image Optimizer que só têm
    // correção no Next 15 (ex.: GHSA-2xp9-vwfh-vxw4, GHSA-h64f-5h5j-jqjh).
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },

  // Keep heavy server-only packages out of the Next.js bundler. Without this,
  // Next would try to trace/transform `postgres`, `drizzle-orm`, and the
  // Google Generative AI SDK on every route build, which noticeably slows
  // both `next dev` first-request compilation and `next build`.
  experimental: {
    serverComponentsExternalPackages: [
      "postgres",
      "drizzle-orm",
      "@google/generative-ai",
    ],
  },
};

module.exports = nextConfig;
