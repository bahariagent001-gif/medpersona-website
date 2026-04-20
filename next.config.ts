import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Modern image formats keep dashboard bandwidth low on mobile — the browser
  // picks the best format supported, so older clients still get JPEG/PNG.
  images: {
    formats: ["image/avif", "image/webp"],
  },
  // Gzip/Brotli compression for API + SSR responses.
  compress: true,
  // Tree-shake large UI/icon libs so only imported symbols end up in the bundle.
  // lucide-react in particular ships ~1000+ icons; without this, sidebar
  // imports drag in the whole set even though we use ~30.
  experimental: {
    optimizePackageImports: ["lucide-react", "@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu"],
  },
};

export default nextConfig;
