import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Selvam",
    short_name: "Selvam",
    description: "A private multi-currency portfolio tracker",
    id: "/",
    scope: "/",
    lang: "en",
    categories: ["finance", "productivity"],
    shortcuts: [
      {
        name: "Financial Twin",
        short_name: "Twin",
        url: "/dashboard/twin",
        description: "Review your financial decisions",
      },
      {
        name: "Import statements",
        short_name: "Import",
        url: "/dashboard/imports",
        description: "Import broker statements",
      },
      {
        name: "Household budget",
        short_name: "Household",
        url: "/dashboard/household",
        description: "Review recurring costs",
      },
    ],
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      {
        src: "/favicon/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/favicon/web-app-manifest-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/favicon/web-app-manifest-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
