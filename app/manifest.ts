
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Cooroonduwatte Tea Factory Management System",
    short_name: "Cooroonduwatte Tea",
    description: "Tea Factory Management System",

    start_url: "/",
    scope: "/",
    display: "standalone",

    background_color: "#020a06",
    theme_color: "#020a06",

    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
