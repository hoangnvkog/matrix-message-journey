import { gsap } from "gsap";
import { settings } from "../config/settings.js";

/** A single particle in the gather animation. */
interface GatherParticle {
  /** Current x position (animated) */
  x: number;
  /** Current y position (animated) */
  y: number;
  /** Current opacity (animated) */
  opacity: number;
  /** Glyph character displayed */
  glyph: string;
  /** Target x (message layout position) */
  targetX: number;
  /** Target y (message layout position) */
  targetY: number;
}

export type GatherCompleteCallback = () => void;

/**
 * Animates glyphs from random screen positions toward the message layout.
 *
 * Particles start scattered across the screen (simulating rain glyphs)
 * and converge to the positions where the message text will be rendered.
 *
 * Usage:
 *   1. Call init(targetPositions, canvasWidth, canvasHeight)
 *   2. Call start(onComplete)
 *   3. Call update(dt) + render(ctx) each frame
 *   4. Check isComplete() or wait for callback
 */
export class GatherEffect {
  private particles: GatherParticle[] = [];
  private complete = false;
  private onComplete: GatherCompleteCallback | null = null;
  private glyphSet: string;

  constructor() {
    this.glyphSet = settings.glyphs;
  }

  /**
   * Initialize particles for the gather animation.
   * @param targetPositions - Pre-computed char positions from MessageRenderer
   * @param canvasWidth - Canvas logical width
   * @param canvasHeight - Canvas logical height
   */
  init(
    targetPositions: readonly { x: number; y: number }[],
    canvasWidth: number,
    canvasHeight: number,
  ): void {
    this.particles = [];
    this.complete = false;

    for (let i = 0; i < targetPositions.length; i++) {
      const target = targetPositions[i];
      if (!target) continue;

      // Start from random positions across the screen
      const startX = Math.random() * canvasWidth;
      const startY = Math.random() * canvasHeight;

      this.particles.push({
        x: startX,
        y: startY,
        opacity: 0,
        glyph: this.randomGlyph(),
        targetX: target.x,
        targetY: target.y,
      });
    }
  }

  /** Start the GSAP-powered gather animation. */
  start(onComplete: GatherCompleteCallback): void {
    this.onComplete = onComplete;
    this.complete = false;

    if (this.particles.length === 0) {
      this.complete = true;
      onComplete();
      return;
    }

    // Create a GSAP timeline with staggered particle animations
    const tl = gsap.timeline({
      onComplete: () => {
        this.complete = true;
        this.onComplete?.();
      },
    });

    const gatherDuration = settings.gather.duration;
    const stagger = (gatherDuration * 0.6) / this.particles.length;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (!p) continue;

      // Randomize glyph periodically during animation
      const scrambleInterval = setInterval(() => {
        if (!p) return;
        p.glyph = this.randomGlyph();
      }, 50);

      tl.to(
        p,
        {
          x: p.targetX,
          y: p.targetY,
          opacity: 1,
          duration: gatherDuration,
          ease: settings.gather.easing,
          onComplete: () => {
            clearInterval(scrambleInterval);
            if (p) {
              p.glyph = this.getSettledGlyph(i);
            }
          },
        },
        i * stagger,
      );
    }
  }

  update(_dt: number): void {
    // GSAP handles animation; update is a no-op
    // but we keep it for API consistency
  }

  render(ctx: CanvasRenderingContext2D): void {
    const fontSize = settings.reveal.fontSize;

    ctx.font = `bold ${fontSize}px ${settings.reveal.font}`;
    ctx.textBaseline = "top";
    ctx.textAlign = "left";

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (!p || p.opacity <= 0) continue;

      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = settings.reveal.color;
      ctx.fillText(p.glyph, p.x, p.y);
    }

    ctx.globalAlpha = 1;
  }

  isComplete(): boolean {
    return this.complete;
  }

  /** Kill all GSAP tweens (cleanup on state exit). */
  kill(): void {
    gsap.killTweensOf(this.particles);
    this.complete = true;
  }

  /* ------------------------------------------------------------------ */
  /*  Private helpers                                                    */
  /* ------------------------------------------------------------------ */

  private randomGlyph(): string {
    return (
      this.glyphSet[Math.floor(Math.random() * this.glyphSet.length)] ?? ""
    );
  }

  /**
   * Get the real glyph for the settled position.
   * This is the character at the target index in the message text.
   */
  private getSettledGlyph(_index: number): string {
    // After gather, the Reveal state will take over with the real text.
    // During gather we show random glyphs, so this is just the final random glyph.
    return this.randomGlyph();
  }
}
