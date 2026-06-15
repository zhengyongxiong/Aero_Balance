import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Dynamic Tympanic Pressure Regulation and Protection System",
    short_name: "AeroBalance",
    description: "Bilateral aviation ear-pressure adaptation demonstration",
    start_url: "/",
    display: "standalone",
    background_color: "#dff3ff",
    theme_color: "#2a91d6",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
