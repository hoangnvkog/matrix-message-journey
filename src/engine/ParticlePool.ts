import { settings } from "../config/settings.js";

/**
 * A single cell in the full-screen Matrix rain grid.
 *
 * Each cell holds a glyph that scrambles independently.
 * No falling motion — static position, dynamic glyph.
 */
export class RainCell {
  x = 0;
  y = 0;
  char = "";
  scrambleInterval = 0;
  scrambleTimer = 0;
  settled = false;

  init(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.scrambleInterval = 0.08 + Math.random() * 0.15; // 80-230ms
    this.scrambleTimer = Math.random() * this.scrambleInterval;
    this.settled = false;
    this.randomizeChar();
  }

  randomizeChar(): void {
    const glyphSet = settings.glyphs;
    this.char = glyphSet[Math.floor(Math.random() * glyphSet.length)] ?? "";
  }

  /** Called every frame. Randomly scrambles the glyph. */
  update(dt: number): void {
    this.scrambleTimer += dt;
    if (this.scrambleTimer >= this.scrambleInterval) {
      this.scrambleTimer = 0;
      this.scrambleInterval = 0.08 + Math.random() * 0.15;
      this.randomizeChar();
    }
  }
}

/**
 * Manages a grid of RainCell objects covering the entire canvas.
 *
 * All cells are allocated once and reused. Zero allocations per frame.
 */
export class ParticlePool {
  private cells: RainCell[] = [];
  private cols = 0;
  private rows = 0;
  private glyphSize = 0;

  init(canvasWidth: number, canvasHeight: number): void {
    this.glyphSize = settings.rain.glyphSize;
    const gap = settings.rain.columnGap;
    this.cols = Math.ceil(canvasWidth / (this.glyphSize + gap));
    this.rows = Math.ceil(canvasHeight / (this.glyphSize + gap));

    const total = this.cols * this.rows;
    while (this.cells.length < total) {
      this.cells.push(new RainCell());
    }

    let idx = 0;
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const cell = this.cells[idx++];
        if (cell) {
          cell.init(col * (this.glyphSize + gap), row * (this.glyphSize + gap));
        }
      }
    }
  }

  resize(canvasWidth: number, canvasHeight: number): void {
    this.glyphSize = settings.rain.glyphSize;
    const gap = settings.rain.columnGap;
    this.cols = Math.ceil(canvasWidth / (this.glyphSize + gap));
    this.rows = Math.ceil(canvasHeight / (this.glyphSize + gap));

    const total = this.cols * this.rows;
    while (this.cells.length < total) {
      this.cells.push(new RainCell());
    }

    let idx = 0;
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const cell = this.cells[idx++];
        if (cell) {
          cell.init(col * (this.glyphSize + gap), row * (this.glyphSize + gap));
        }
      }
    }
  }

  /** Get all cells as a flat array. */
  getCells(): RainCell[] {
    return this.cells;
  }

  getCellCount(): number {
    return this.cols * this.rows;
  }

  getCols(): number {
    return this.cols;
  }

  getRows(): number {
    return this.rows;
  }

  getGlyphSize(): number {
    return this.glyphSize;
  }
}
