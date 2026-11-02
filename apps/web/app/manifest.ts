import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tinlance",
    short_name: "Tinlance",
    description: "AI engineering, security, automation, and Forward Deployed Engineering.",
    start_url: "/",
    display: "standalone",
    background_color: "#0B1220",
    theme_color: "#0B1220",
    icons: [{ src: "/brand/tinlance-app-icon.svg", sizes: "256x256", type: "image/svg+xml" }],
  };
}
