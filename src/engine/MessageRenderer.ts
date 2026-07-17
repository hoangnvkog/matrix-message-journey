import { settings } from "../config/settings.js";

interface ScrambleChar {
  target: string;
  current: string;
  remainingScrambles: number;
  timer: number;
  interval: number;
  settled: boolean;
}

interface CharPosition {
  x: number;
  y: number;
}

/** Cached constants — never rebuilt per frame. */
const GLYPH_SET = settings.glyphs;
const REVEAL_DURATION = settings.reveal.duration;
const SCRAMBLE_COUNT = settings.reveal.scrambleIterations;
const SCRAMBLE_DURATION = REVEAL_DURATION * 0.4;
const FONT_SIZE = settings.reveal.fontSize;
const LINE_HEIGHT = settings.reveal.lineHeight;
const FONT_FAMILY = settings.reveal.font;
const CACHED_FONT = `bold ${FONT_SIZE}px ${FONT_FAMILY}`;
const CHAR_WIDTH = FONT_SIZE * 0.6;
const SPACE_WIDTH = FONT_SIZE * 0.3;

/**
 * Renders a message with scramble-to-reveal effect.
 *
 * Optimization: cached font string, batched fillStyle for settled vs
 * scrambling characters to minimize canvas state changes.
 */
export class MessageRenderer {
  private chars: ScrambleChar[] = [];
  private positions: CharPosition[] = [];
  private complete = false;
  private glyphIndex = 0;

  /** Pre-allocated glyph index counter for randomGlyph — avoids modulo overhead. */

  init(text: string, canvasWidth: number, canvasHeight: number): void {
    this.chars.length = 0;
    this.positions.length = 0;
    this.complete = false;
    this.glyphIndex = 0;

    const lines = this.wrapText(text, canvasWidth);
    const totalTextHeight = lines.length * (FONT_SIZE * LINE_HEIGHT);
    const startY = (canvasHeight - totalTextHeight) / 2;

    let globalIndex = 0;
    const totalChars = text.length;
    const maxDelay = REVEAL_DURATION * 0.6;
    const interval =
      SCRAMBLE_COUNT > 0 ? SCRAMBLE_DURATION / SCRAMBLE_COUNT : 0;

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx] ?? "";
      const lineWidth = this.measureLineWidth(line);
      const lineX = (canvasWidth - lineWidth) / 2;
      const lineY = startY + lineIdx * (FONT_SIZE * LINE_HEIGHT);
      let cursorX = lineX;

      for (let charIdx = 0; charIdx < line.length; charIdx++) {
        const ch = line[charIdx] ?? "";
        this.positions.push({ x: cursorX, y: lineY });

        const charDelay =
          totalChars > 1 ? (globalIndex / (totalChars - 1)) * maxDelay : 0;

        this.chars.push({
          target: ch,
          current: this.randomGlyph(),
          remainingScrambles: ch === " " ? 0 : SCRAMBLE_COUNT,
          timer: charDelay,
          interval,
          settled: ch === " ",
        });

        cursorX += ch === " " ? SPACE_WIDTH : CHAR_WIDTH;
        globalIndex++;
      }
    }
  }

  update(dt: number): void {
    if (this.complete) return;

    let allSettled = true;
    const len = this.chars.length;

    for (let i = 0; i < len; i++) {
      const ch = this.chars[i];
      if (!ch || ch.settled) continue;

      ch.timer -= dt;

      if (ch.timer <= 0) {
        if (ch.remainingScrambles > 0) {
          ch.current = this.randomGlyph();
          ch.remainingScrambles--;
          ch.timer = ch.interval;
          allSettled = false;
        } else {
          ch.current = ch.target;
          ch.settled = true;
        }
      } else {
        allSettled = false;
      }
    }

    if (allSettled) {
      this.complete = true;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    // Compute text bounding box for the dark backdrop
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    const len = this.chars.length;

    for (let i = 0; i < len; i++) {
      const pos = this.positions[i];
      if (!pos) continue;
      if (pos.x < minX) minX = pos.x;
      if (pos.y < minY) minY = pos.y;
      if (pos.x + CHAR_WIDTH > maxX) maxX = pos.x + CHAR_WIDTH;
      if (pos.y + FONT_SIZE > maxY) maxY = pos.y + FONT_SIZE;
    }

    if (minX < Infinity) {
      const padX = 56;
      const padY = 40;
      const bx = minX - padX;
      const by = minY - padY;
      const bw = maxX - minX + padX * 2;
      const bh = maxY - minY + padY * 2;

      ctx.save();

      // FULL opaque black backdrop — blocks rain completely
      ctx.fillStyle = "#000000";
      ctx.fillRect(bx, by, bw, bh);

      // Clean green border — no shadow/blur
      ctx.strokeStyle = "rgba(0, 255, 65, 0.6)";
      ctx.lineWidth = 1;
      ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);

      ctx.restore();
    }

    ctx.font = CACHED_FONT;
    ctx.textBaseline = "top";
    ctx.textAlign = "left";
    ctx.shadowBlur = 0;
    ctx.shadowColor = "transparent";

    // Pass 1: Scrambling characters — green, no shadow
    ctx.fillStyle = "rgba(0, 255, 65, 0.8)";

    for (let i = 0; i < len; i++) {
      const ch = this.chars[i];
      const pos = this.positions[i];
      if (!ch || !pos || ch.settled) continue;
      ctx.fillText(ch.current, pos.x, pos.y);
    }

    // Pass 2: Settled characters — BRIGHT WHITE, crisp stroke, NO shadow/glow
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;

    for (let i = 0; i < len; i++) {
      const ch = this.chars[i];
      const pos = this.positions[i];
      if (!ch || !pos || !ch.settled) continue;
      ctx.strokeText(ch.current, pos.x, pos.y);
      ctx.fillText(ch.current, pos.x, pos.y);
    }
  }

  isComplete(): boolean {
    return this.complete;
  }

  getCurrentText(): string {
    let result = "";
    for (let i = 0; i < this.chars.length; i++) {
      result += this.chars[i]?.current ?? "";
    }
    return result;
  }

  getCharPositions(): readonly CharPosition[] {
    return this.positions;
  }

  private randomGlyph(): string {
    // Fast cycling through glyph set without modulo
    this.glyphIndex++;
    if (this.glyphIndex >= GLYPH_SET.length) this.glyphIndex = 0;
    return GLYPH_SET[this.glyphIndex] ?? "";
  }

  private measureCharWidth(ch: string): number {
    return ch === " " ? SPACE_WIDTH : CHAR_WIDTH;
  }

  private measureLineWidth(line: string): number {
    let width = 0;
    for (let i = 0; i < line.length; i++) {
      width += this.measureCharWidth(line[i] ?? "");
    }
    return width;
  }

  private wrapText(text: string, maxWidth: number): string[] {
    const words = text.split(" ");
    const lines: string[] = [];
    let currentLine = "";
    const limit = maxWidth * 0.85;

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (this.measureLineWidth(testLine) > limit && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) lines.push(currentLine);
    return lines.length > 0 ? lines : [text];
  }
}
