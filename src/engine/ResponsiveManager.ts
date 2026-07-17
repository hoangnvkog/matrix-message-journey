import { settings } from "../config/settings.js";

export interface ResponsiveConfig {
  glyphSize: number;
  fontSize: number;
  density: number;
  trailLength: number;
  columnGap: number;
}

const BREAKPOINTS = {
  phone: 640,
  tablet: 1024,
  laptop: 1440,
} as const;

/**
 * Computes rendering parameters based on the current viewport size.
 *
 * Does NOT mutate the global settings — returns a derived config
 * that callers use instead of reading settings directly.
 */
export class ResponsiveManager {
  private width: number;
  private height: number;
  private cached: ResponsiveConfig;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.cached = this.computeConfig();
  }

  update(width: number, height: number): void {
    if (width === this.width && height === this.height) return;
    this.width = width;
    this.height = height;
    this.cached = this.computeConfig();
  }

  getConfig(): ResponsiveConfig {
    return this.cached;
  }

  getDeviceType(): "phone" | "tablet" | "laptop" | "desktop" {
    if (this.width < BREAKPOINTS.phone) return "phone";
    if (this.width < BREAKPOINTS.tablet) return "tablet";
    if (this.width < BREAKPOINTS.laptop) return "laptop";
    return "desktop";
  }

  private computeConfig(): ResponsiveConfig {
    const base = settings.rain;
    const type = this.getDeviceType();

    switch (type) {
      case "phone":
        return {
          glyphSize: 11,
          fontSize: 20,
          density: 1.0,
          trailLength: Math.max(8, Math.floor(base.trailLength * 0.5)),
          columnGap: 1,
        };
      case "tablet":
        return {
          glyphSize: 13,
          fontSize: 32,
          density: 0.95,
          trailLength: Math.max(12, Math.floor(base.trailLength * 0.7)),
          columnGap: 2,
        };
      case "laptop":
        return {
          glyphSize: base.glyphSize,
          fontSize: 40,
          density: 0.95,
          trailLength: base.trailLength,
          columnGap: base.columnGap,
        };
      case "desktop":
      default:
        return {
          glyphSize: base.glyphSize + 2,
          fontSize: settings.reveal.fontSize,
          density: base.density,
          trailLength: base.trailLength + 5,
          columnGap: base.columnGap,
        };
    }
  }
}
