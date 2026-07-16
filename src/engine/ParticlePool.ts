import { settings } from "../config/settings.js";

/**
 * A single falling column of Matrix glyphs.
 *
 * Pre-allocated. No new allocations during the render loop.
 */
export class RainColumn {
  x = 0;
  y = 0;
  speed = 0;
  chars: string[] = [];
  trailLength = 0;
  maxTrailLength = 0;
  active = false;
  scrambleInterval = 0;
  scrambleTimer = 0;

  init(columnIndex: number, totalColumns: number, canvasHeight: number): void {
    this.x = columnIndex * (settings.rain.glyphSize + settings.rain.columnGap);
    this.y =
      -Math.random() * canvasHeight * 0.5 - Math.random() * canvasHeight * 0.3;
    this.speed = settings.rain.speed * (60 + Math.random() * 40);
    this.maxTrailLength =
      settings.rain.trailLength +
      Math.floor(Math.random() * settings.rain.trailLength * 0.5);
    this.trailLength = this.maxTrailLength;
    this.active = true;
    this.scrambleInterval = 0.05 + Math.random() * 0.1;
    this.scrambleTimer = 0;

    this.chars.length = this.maxTrailLength + 2;
    const glyphSet = settings.glyphs;
    for (let i = 0; i < this.chars.length; i++) {
      this.chars[i] =
        glyphSet[Math.floor(Math.random() * glyphSet.length)] ?? "";
    }
    void totalColumns;
  }

  scrambleGlyphs(): void {
    const glyphSet = settings.glyphs;
    const scrambleDepth = Math.min(3, this.chars.length);
    for (let i = 0; i < scrambleDepth; i++) {
      this.chars[i] =
        glyphSet[Math.floor(Math.random() * glyphSet.length)] ?? "";
    }
  }
}

/**
 * Manages a pool of RainColumn objects.
 *
 * All columns are allocated once and reused every frame.
 * Zero allocations during the render loop.
 */
export class ParticlePool {
  private columns: RainColumn[] = [];
  private columnCount = 0;
  private glyphSize = 0;

  init(canvasWidth: number, canvasHeight: number): void {
    this.glyphSize = settings.rain.glyphSize;
    this.columnCount = Math.ceil(
      canvasWidth / (this.glyphSize + settings.rain.columnGap),
    );

    while (this.columns.length < this.columnCount) {
      this.columns.push(new RainColumn());
    }

    for (let i = 0; i < this.columnCount; i++) {
      const col = this.columns[i];
      if (col) {
        col.init(i, this.columnCount, canvasHeight);
      }
    }
  }

  resize(canvasWidth: number, canvasHeight: number): void {
    this.glyphSize = settings.rain.glyphSize;
    this.columnCount = Math.ceil(
      canvasWidth / (this.glyphSize + settings.rain.columnGap),
    );

    while (this.columns.length < this.columnCount) {
      this.columns.push(new RainColumn());
    }

    for (let i = 0; i < this.columnCount; i++) {
      const col = this.columns[i];
      if (col) {
        col.init(i, this.columnCount, canvasHeight);
      }
    }
  }

  getColumns(): RainColumn[] {
    return this.columns;
  }

  getColumnCount(): number {
    return this.columnCount;
  }

  getGlyphSize(): number {
    return this.glyphSize;
  }
}
