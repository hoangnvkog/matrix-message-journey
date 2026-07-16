import { settings } from "../config/settings.js";
import { ParticlePool } from "./ParticlePool.js";
import type { ResponsiveConfig } from "./ResponsiveManager.js";

/** Cached font string to avoid rebuilding every frame. */
const FONT_FAMILY = settings.reveal.font;

/**
 * Renders the Matrix digital rain effect.
 *
 * Optimization: two-pass rendering.
 *   Pass 1 — trail glyphs (no shadow, batched fillStyle)
 *   Pass 2 — head glyphs (shadow glow, separate pass)
 * This minimizes expensive canvas state changes.
 */
export class MatrixRain {
  private pool: ParticlePool;
  private glyphSize = 0;
  private canvasHeight = 0;
  private density = 1;
  private trailLength = 0;
  private cachedFont = "";

  constructor() {
    this.pool = new ParticlePool();
  }

  applyConfig(config: ResponsiveConfig): void {
    this.glyphSize = config.glyphSize;
    this.density = config.density;
    this.trailLength = config.trailLength;
    // Rebuild cached font string only when glyph size changes
    this.cachedFont = `${config.glyphSize}px ${FONT_FAMILY}`;
  }

  init(canvasWidth: number, canvasHeight: number): void {
    this.canvasHeight = canvasHeight;
    this.pool.init(canvasWidth, canvasHeight);
  }

  resize(canvasWidth: number, canvasHeight: number): void {
    this.canvasHeight = canvasHeight;
    this.pool.resize(canvasWidth, canvasHeight);
  }

  /** Update column positions — zero allocations. */
  update(dt: number): void {
    const columns = this.pool.getColumns();
    const count = this.pool.getColumnCount();
    const gs = this.glyphSize;
    const canvasH = this.canvasHeight;
    const speedBase = settings.rain.speed;

    for (let i = 0; i < count; i++) {
      const col = columns[i];
      if (!col || !col.active) continue;

      col.y += col.speed * dt;

      col.scrambleTimer += dt;
      if (col.scrambleTimer >= col.scrambleInterval) {
        col.scrambleTimer = 0;
        col.scrambleGlyphs();
      }

      if (col.y - col.maxTrailLength * gs > canvasH) {
        col.y = -Math.random() * canvasH * 0.3 - col.maxTrailLength * gs;
        col.speed = speedBase * (60 + Math.random() * 40);
      }
    }
  }

  /** Two-pass render for minimal canvas state changes. */
  render(ctx: CanvasRenderingContext2D): void {
    const columns = this.pool.getColumns();
    const count = this.pool.getColumnCount();
    const gs = this.glyphSize;
    const canvasH = this.canvasHeight;
    const trailLen = this.trailLength;
    const density = this.density;

    // Set font once
    ctx.font = this.cachedFont;
    ctx.textBaseline = "top";

    // ---- Pass 1: Trail glyphs (no shadow) ----
    ctx.shadowBlur = 0;
    ctx.shadowColor = "transparent";

    for (let i = 0; i < count; i++) {
      const col = columns[i];
      if (!col || !col.active) continue;
      if (i / count > density) continue;

      const headY = col.y;
      const trail = Math.min(col.trailLength, trailLen, col.chars.length);

      // Render trail characters (j = 1 to trail-1)
      for (let j = 1; j < trail; j++) {
        const charY = headY - j * gs;
        if (charY < -gs || charY > canvasH) continue;

        const fade = Math.max(0, 1 - j / trail);
        ctx.fillStyle = `rgba(0, 255, 65, ${(fade * 0.7).toFixed(2)})`;
        ctx.fillText(col.chars[j] ?? "", col.x, charY);
      }
    }

    // ---- Pass 2: Head glyphs (with shadow glow) ----
    ctx.shadowColor = settings.rain.glowColor;
    ctx.shadowBlur = settings.rain.glowBlur;

    for (let i = 0; i < count; i++) {
      const col = columns[i];
      if (!col || !col.active) continue;
      if (i / count > density) continue;

      const headY = col.y;
      if (headY < -gs || headY > canvasH) continue;

      ctx.fillStyle = "rgba(200, 255, 200, 1)";
      ctx.fillText(col.chars[0] ?? "", col.x, headY);
    }

    // Reset
    ctx.shadowBlur = 0;
    ctx.shadowColor = "transparent";
  }
}
