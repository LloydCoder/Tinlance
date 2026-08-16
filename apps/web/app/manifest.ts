import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tinlance",
    short_name: "Tinlance",
    description: "AI engineering, security, automation, and Forward Deployed Engineering.",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f7f2",
    theme_color: "#111411",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
