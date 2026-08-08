const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["127.0.0.1"],
  turbopack: {
    root: process.cwd(),
  },
};

export default process.env.NODE_ENV === "production"
  ? (await import("@serwist/next")).default({
      swSrc: "src/app/sw.ts",
      swDest: "public/sw.js",
      additionalPrecacheEntries: [{ url: "/~offline", revision: null }],
    })(nextConfig)
  : nextConfig;
