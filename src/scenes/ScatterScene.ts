import type { StateHandler } from "../engine/StateMachine.js";
import { ScatterEffect } from "../effects/ScatterEffect.js";

export type ScatterSceneCompleteCallback = () => void;

/**
 * State handler for the Scatter state.
 *
 * Shows the scatter animation: message shakes, breaks apart,
 * and particles fall as Matrix glyphs.
 */
export class ScatterScene implements StateHandler {
  private effect: ScatterEffect | null = null;
  private canvasWidth: number;
  private canvasHeight: number;
  private charPositions: readonly { x: number; y: number }[];
  private currentText: string;
  private onComplete: ScatterSceneCompleteCallback;

  constructor(
    canvasWidth: number,
    canvasHeight: number,
    charPositions: readonly { x: number; y: number }[],
    currentText: string,
    onComplete: ScatterSceneCompleteCallback,
  ) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.charPositions = charPositions;
    this.currentText = currentText;
    this.onComplete = onComplete;
  }

  enter(): void {
    this.effect = new ScatterEffect();
    this.effect.init(
      this.charPositions,
      this.currentText,
      this.canvasWidth,
      this.canvasHeight,
    );
    this.effect.start(() => {
      this.onComplete();
    });
  }

  execute(dt: number): void {
    this.effect?.update(dt);
  }

  render(ctx: CanvasRenderingContext2D): void {
    this.effect?.render(ctx);
  }

  exit(): void {
    this.effect?.kill();
    this.effect = null;
  }
}
