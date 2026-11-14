/** @type {import('next').NextConfig} */
const nextConfig = {
  typedRoutes: false,
  poweredByHeader: false,
  compress: true,
  productionBrowserSourceMaps: false,
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@supabase/ssr",
      "@supabase/supabase-js",
      "pdf-lib",
      "@cantoo/pdf-lib",
      "zod",
      "diff",
      "js-yaml",
      "cronstrue",
      "sql-formatter",
      "qrcode",
      "jsbarcode",
      "terser",
    ],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },
  async redirects() {
    return [
      { source: "/pricing", destination: "/tools", permanent: true },
      { source: "/register", destination: "/tools", permanent: true },
      { source: "/forgot-password", destination: "/tools", permanent: true },
      { source: "/reset-password", destination: "/tools", permanent: true },
      { source: "/verify-email", destination: "/tools", permanent: true },
      { source: "/dashboard", destination: "/tools", permanent: true },
      { source: "/dashboard/:path*", destination: "/tools", permanent: true },
      { source: "/youtube-thumbnail-downloader", destination: "/tools/youtube-thumbnail-downloader", permanent: true },
      { source: "/youtube-banner-resizer", destination: "/tools/youtube-banner-resizer", permanent: true },
      { source: "/instagram-bio-formatter", destination: "/tools/instagram-bio-formatter", permanent: true },
      { source: "/hashtag-generator", destination: "/tools/hashtag-generator", permanent: true },
      { source: "/social-media-post-preview", destination: "/tools/social-media-post-preview", permanent: true },
      { source: "/utm-campaign-builder", destination: "/tools/utm-campaign-builder", permanent: true },
      { source: "/email-signature-generator", destination: "/tools/email-signature-generator", permanent: true },
      { source: "/qr-business-card-generator", destination: "/tools/qr-business-card-generator", permanent: true },
      { source: "/youtube-description-formatter", destination: "/tools/youtube-description-formatter", permanent: true },
      { source: "/social-media-character-counter", destination: "/tools/social-media-character-counter", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/:all*(svg|jpg|jpeg|png|webp|avif|ico|woff|woff2)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/api/public/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, stale-while-revalidate=86400",
          },
        ],
      },
    ];
  },
  webpack(config) {
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
