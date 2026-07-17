import { settings } from "../config/settings.js";

/**
 * Manages the HTML Canvas element and the render loop.
 *
 * Responsibilities:
 * - Create and size the canvas
 * - Handle device pixel ratio scaling
 * - Provide a stable requestAnimationFrame loop
 * - Expose canvas dimensions for other modules
 */
export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private rafId = 0;
  private running = false;
  private boundFrame: FrameRequestCallback;

  /** Logical (CSS) dimensions — already divided by DPR */
  public width = 0;
  public height = 0;

  /** Raw pixel dimensions (width × DPR) */
  public pixelWidth = 0;
  public pixelHeight = 0;

  public dpr: number;

  /** Registered per-frame callback */
  private onFrame: ((dt: number) => void) | null = null;

  /** Timestamp of previous frame (seconds) */
  private prevTime = 0;

  constructor(canvasId = "canvas") {
    const el = document.getElementById(canvasId);
    if (!el || !(el instanceof HTMLCanvasElement)) {
      throw new Error(`Canvas #${canvasId} not found`);
    }
    this.canvas = el;

    const ctx = this.canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Failed to get CanvasRenderingContext2D");
    }
    this.ctx = ctx;

    this.dpr = Math.min(Math.max(settings.canvas.pixelRatio, 1), 3);

    this.boundFrame = this.frame.bind(this);
    this.resize();
    window.addEventListener("resize", () => this.resize());
  }

  /* ------------------------------------------------------------------ */
  /*  Canvas sizing                                                      */
  /* ------------------------------------------------------------------ */

  resize(): void {
    this.dpr = Math.min(Math.max(settings.canvas.pixelRatio, 1), 3);
    this.pixelWidth = window.innerWidth * this.dpr;
    this.pixelHeight = window.innerHeight * this.dpr;
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.canvas.width = this.pixelWidth;
    this.canvas.height = this.pixelHeight;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  /* ------------------------------------------------------------------ */
  /*  Render loop                                                        */
  /* ------------------------------------------------------------------ */

  /** Register the per-frame callback (receives delta-time in seconds). */
  setOnFrame(callback: (dt: number) => void): void {
    this.onFrame = callback;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.prevTime = performance.now() / 1000;
    this.rafId = requestAnimationFrame(this.boundFrame);
  }

  stop(): void {
    this.running = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
  }

  private frame(timestamp: number): void {
    if (!this.running) return;

    const now = timestamp / 1000;
    const dt = Math.min(now - this.prevTime, 0.1); // cap at 100ms
    this.prevTime = now;

    // Clear entire canvas
    this.ctx.fillStyle = settings.canvas.background;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Delegate to the registered callback
    if (this.onFrame) {
      this.onFrame(dt);
    }

    this.rafId = requestAnimationFrame(this.boundFrame);
  }

  /* ------------------------------------------------------------------ */
  /*  Accessors                                                          */
  /* ------------------------------------------------------------------ */

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }
}
