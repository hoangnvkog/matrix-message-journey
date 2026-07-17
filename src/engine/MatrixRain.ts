import { settings } from "../config/settings.js";
import { ParticlePool } from "./ParticlePool.js";
import type { ResponsiveConfig } from "./ResponsiveManager.js";

/** Cached font string to avoid rebuilding every frame. */
const FONT_FAMILY = settings.reveal.font;

/**
 * Renders the Matrix digital rain effect as a full-screen background texture.
 *
 * Each cell holds a static-position glyph that scrambles independently.
 * No falling columns — just a field of constantly changing characters.
 */
export class MatrixRain {
  private pool: ParticlePool;
  private density = 1;
  private cachedFont = "";

  constructor() {
    this.pool = new ParticlePool();
  }

  applyConfig(config: ResponsiveConfig): void {
    this.density = config.density;
    this.cachedFont = `${config.glyphSize}px ${FONT_FAMILY}`;
  }

  init(canvasWidth: number, canvasHeight: number): void {
    this.pool.init(canvasWidth, canvasHeight);
  }

  resize(canvasWidth: number, canvasHeight: number): void {
    this.pool.resize(canvasWidth, canvasHeight);
  }

  /** Update all cells — zero allocations. */
  update(dt: number): void {
    const cells = this.pool.getCells();
    const count = this.pool.getCellCount();

    for (let i = 0; i < count; i++) {
      const cell = cells[i];
      if (!cell) continue;
      cell.update(dt);
    }
  }

  /** Render all cells. */
  render(ctx: CanvasRenderingContext2D): void {
    const cells = this.pool.getCells();
    const count = this.pool.getCellCount();

    const density = this.density;

    ctx.font = this.cachedFont;
    ctx.textBaseline = "top";

    // Single pass: all glyphs with subtle glow
    ctx.shadowColor = settings.rain.glowColor;
    ctx.shadowBlur = settings.rain.glowBlur;

    for (let i = 0; i < count; i++) {
      const cell = cells[i];
      if (!cell) continue;
      if (i / count > density) continue;

      const fade = 0.3 + Math.random() * 0.4; // subtle variation
      ctx.fillStyle = `rgba(0, 255, 65, ${fade.toFixed(2)})`;
      ctx.fillText(cell.char, cell.x, cell.y);
    }

    ctx.shadowBlur = 0;
    ctx.shadowColor = "transparent";
  }
}
