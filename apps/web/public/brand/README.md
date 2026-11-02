# Tinlance brand assets

These vector assets use the supplied Tinlance logo-kit artwork and preserve its outlined wordmark and connected-T mark. The logo-kit palette file describes its sampled colours as estimates; the SVG colours below are harmonised to the existing website design tokens so the logo and site remain visually consistent.

## Files

- `tinlance-logo-light.svg` — supplied primary horizontal logo for light surfaces, including its dark rounded-square mark.
- `tinlance-logo-dark.svg` — supplied primary horizontal logo for dark surfaces.
- `tinlance-app-icon.svg` — supplied standalone app mark for browser and application identity.

## Website-aligned brand palette

- Ink: `#0A0D0B` (website `--ink`)
- Lime: `#C9FF4D` (website `--acid`)
- Paper: `#F4F5F0` (website `--bg`)

## Usage

Use the light variant on light surfaces and the dark variant on dark surfaces. Use the app icon for application and browser identity. Preserve the original SVG viewBox and aspect ratio; do not recolour, stretch, or detach the connection nodes from the mark. Prefer these vector assets over recreating the mark with CSS or text.

The global site header and footer use the horizontal light logo on the site's light surface. The Next.js app icon and web manifest use the standalone app mark. The Open Graph image uses the same website-aligned palette.

## Web implementation

Use the shared SVGs from the Next.js `public/brand` directory. Keep explicit intrinsic dimensions on `next/image` to reserve layout space. Use the supplied dark variant for any future component placed on a dark surface.
