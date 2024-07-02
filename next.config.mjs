import withPWA from "next-pwa";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

export default withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/api\.mapbox\.com\/styles\/v1\//,
      handler: "CacheFirst",
      options: {
        cacheName: "mapbox-styles",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 1 week
        },
      },
    },
    {
      urlPattern: /^https:\/\/api\.mapbox\.com\/fonts\//,
      handler: "CacheFirst",
      options: {
        cacheName: "mapbox-fonts",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 1 week
        },
      },
    },
    {
      urlPattern: /^https:\/\/api\.mapbox\.com\/mapbox-gl-js\//,
      handler: "CacheFirst",
      options: {
        cacheName: "mapbox-gl-js",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 1 week
        },
      },
    },
    {
      urlPattern: /^https:\/\/api\.mapbox\.com\/v4\//,
      handler: "CacheFirst",
      options: {
        cacheName: "mapbox-tiles",
        expiration: {
          maxEntries: 1000,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 1 week
        },
      },
    },
  ],
})(nextConfig);
