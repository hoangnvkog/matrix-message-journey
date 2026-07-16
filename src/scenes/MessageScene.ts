import type { StateHandler } from "../engine/StateMachine.js";
import { MessageRenderer } from "../engine/MessageRenderer.js";

export type MessageSceneCompleteCallback = () => void;

/**
 * State handler for the Reveal + Hold states.
 *
 * Lifecycle:
 *   1. Enter → init MessageRenderer with target text
 *   2. Run scramble reveal animation
 *   3. When reveal complete → start hold timer
 *   4. When hold expires → signal completion
 */
export class MessageScene implements StateHandler {
  private renderer: MessageRenderer | null = null;
  private canvasWidth: number;
  private canvasHeight: number;
  private text: string;
  private holdDurationMs: number;
  private holdTimer = 0;
  private revealDone = false;
  private onComplete: MessageSceneCompleteCallback;

  constructor(
    canvasWidth: number,
    canvasHeight: number,
    text: string,
    holdDurationMs: number,
    onComplete: MessageSceneCompleteCallback,
  ) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.text = text;
    this.holdDurationMs = holdDurationMs;
    this.onComplete = onComplete;
  }

  enter(): void {
    this.holdTimer = 0;
    this.revealDone = false;

    this.renderer = new MessageRenderer();
    this.renderer.init(this.text, this.canvasWidth, this.canvasHeight);
  }

  execute(dt: number): void {
    if (!this.renderer) return;

    if (!this.revealDone) {
      // Scramble reveal in progress
      this.renderer.update(dt);

      if (this.renderer.isComplete()) {
        this.revealDone = true;
        this.holdTimer = 0;
      }
    } else {
      // Hold phase — wait for the configured duration
      this.holdTimer += dt * 1000; // convert to ms
      if (this.holdTimer >= this.holdDurationMs) {
        this.onComplete();
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.renderer) return;
    this.renderer.render(ctx);
  }

  exit(): void {
    this.renderer = null;
    this.revealDone = false;
    this.holdTimer = 0;
  }

  /** Get the MessageRenderer (useful for scatter effect to read char positions). */
  getMessageRenderer(): MessageRenderer | null {
    return this.renderer;
  }
}
