import { gsap } from "gsap";
import { settings } from "../config/settings.js";

/** A single particle in the scatter animation. */
interface ScatterParticle {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  opacity: number;
  glyph: string;
  rotation: number;
  rotationSpeed: number;
}

export type ScatterCompleteCallback = () => void;

/**
 * Animates message characters breaking apart and falling as Matrix glyphs.
 *
 * Two phases:
 *   1. Shake — characters vibrate in place
 *   2. Scatter — particles fly outward with gravity, fade, and fall off screen
 *
 * Usage:
 *   1. Call init(charPositions, currentText, canvasWidth, canvasHeight)
 *   2. Call start(onComplete)
 *   3. Call update(dt) + render(ctx) each frame
 *   4. Check isComplete() or wait for callback
 */
export class ScatterEffect {
  private particles: ScatterParticle[] = [];
  private complete = false;
  private onComplete: ScatterCompleteCallback | null = null;
  private gsapTimeline: gsap.core.Timeline | null = null;

  /**
   * Initialize scatter particles from message character positions.
   */
  init(
    charPositions: readonly { x: number; y: number }[],
    currentText: string,
    _canvasWidth: number,
    canvasHeight: number,
  ): void {
    this.particles = [];
    this.complete = false;

    for (let i = 0; i < charPositions.length; i++) {
      const pos = charPositions[i];
      if (!pos) continue;

      const ch = currentText[i] ?? " ";

      this.particles.push({
        x: pos.x,
        y: pos.y,
        velocityX: 0,
        velocityY: 0,
        opacity: 1,
        glyph: ch,
        rotation: 0,
        rotationSpeed: (Math.random() - 0.5) * 10,
      });
    }

    void canvasHeight; // reserved for boundary checks
  }

  /** Start the two-phase scatter animation. */
  start(onComplete: ScatterCompleteCallback): void {
    this.onComplete = onComplete;
    this.complete = false;

    if (this.particles.length === 0) {
      this.complete = true;
      onComplete();
      return;
    }

    const shakeDur = settings.scatter.shakeDuration;
    const scatterDur = settings.scatter.duration;
    const shakeIntensity = settings.scatter.shakeIntensity;

    this.gsapTimeline = gsap.timeline({
      onComplete: () => {
        this.complete = true;
        this.onComplete?.();
      },
    });

    // Phase 1: Shake — yoyo vibration
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (!p) continue;

      this.gsapTimeline.to(
        p,
        {
          x: p.x + (Math.random() - 0.5) * shakeIntensity * 2,
          y: p.y + (Math.random() - 0.5) * shakeIntensity * 2,
          duration: shakeDur / 3,
          yoyo: true,
          repeat: 2,
          ease: "power1.inOut",
        },
        0,
      );
    }

    // Phase 2: Scatter — fly outward with gravity + fade
    const scatterStart = shakeDur;
    const gravity = 400;
    const stagger = (scatterDur * 0.3) / this.particles.length;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (!p) continue;

      const angle = Math.random() * Math.PI * 2;
      const force = 100 + Math.random() * 200;

      this.gsapTimeline.to(
        p,
        {
          x: p.x + Math.cos(angle) * force,
          y: p.y + Math.sin(angle) * force + gravity * scatterDur,
          opacity: 0,
          rotation: p.rotation + (Math.random() - 0.5) * 720,
          duration: scatterDur,
          ease: settings.scatter.easing,
          onUpdate: () => {
            // Apply gravity progressively
            p.velocityY += gravity * 0.016;
            p.y += p.velocityY * 0.016;
            p.x += p.velocityX * 0.016;
          },
        },
        scatterStart + i * stagger,
      );
    }
  }

  update(_dt: number): void {
    // GSAP handles animation
  }

  render(ctx: CanvasRenderingContext2D): void {
    const fontSize = settings.reveal.fontSize;

    ctx.font = `bold ${fontSize}px ${settings.reveal.font}`;
    ctx.textBaseline = "top";
    ctx.textAlign = "left";

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (!p || p.opacity <= 0) continue;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = settings.reveal.color;
      ctx.fillText(p.glyph, 0, 0);
      ctx.restore();
    }

    ctx.globalAlpha = 1;
  }

  isComplete(): boolean {
    return this.complete;
  }

  /** Kill all GSAP tweens (cleanup on state exit). */
  kill(): void {
    if (this.gsapTimeline) {
      this.gsapTimeline.kill();
      this.gsapTimeline = null;
    }
    this.complete = true;
  }
}
