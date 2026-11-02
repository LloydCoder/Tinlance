import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const readAsset = (path: string) =>
  readFileSync(new URL(path, import.meta.url), "utf8");

describe("Tinlance brand assets", () => {
  const lightLogo = readAsset("../public/brand/tinlance-logo-light.svg");
  const darkLogo = readAsset("../public/brand/tinlance-logo-dark.svg");
  const appIcon = readAsset("../public/brand/tinlance-app-icon.svg");

  it("uses the current website palette rather than the retired navy-and-mint palette", () => {
    for (const asset of [lightLogo, darkLogo, appIcon]) {
      expect(asset).toContain("#C9FF4D");
      expect(asset).toContain("#F4F5F0");
      expect(asset).not.toContain("#0B1220");
      expect(asset).not.toContain("#14D8B4");
    }

    expect(lightLogo).toContain("#0A0D0B");
    expect(appIcon).toContain("#0A0D0B");
  });

  it("preserves the supplied horizontal logo's original vector proportions", () => {
    expect(lightLogo).toContain('viewBox="0 0 234.466 64"');
    expect(darkLogo).toContain('viewBox="0 0 234.466 64"');
  });

  it("uses the supplied square app mark for browser identity", () => {
    expect(appIcon).toContain('viewBox="0 0 256 256"');
    expect(appIcon).toContain('aria-label="Tinlance app icon"');
  });
});
