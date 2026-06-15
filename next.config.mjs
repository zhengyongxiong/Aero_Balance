import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV !== "production",
  additionalPrecacheEntries: [{ url: "/~offline", revision: null }],
});

export default withSerwist({
  reactStrictMode: true,
  turbopack: {
    root: process.cwd(),
  },
});
