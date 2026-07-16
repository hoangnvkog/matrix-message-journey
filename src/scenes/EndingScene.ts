import type { StateHandler } from "../engine/StateMachine.js";
import { settings } from "../config/settings.js";
import { ReplayButton } from "../ui/ReplayButton.js";

export type EndingReplayCallback = () => void;

/**
 * State handler for the Ending scene.
 *
 * Loads and displays the ending image, fading it in over the rain.
 * After the hold duration, shows a Replay button.
 */
export class EndingScene implements StateHandler {
  private image: HTMLImageElement | null = null;
  private imageLoaded = false;
  private imageOpacity = 0;
  private rainOpacity = 1;
  private timer = 0;
  private phase: "fadeIn" | "hold" | "showButton" = "fadeIn";
  private holdDuration: number;
  private fadeInDuration: number;
  private canvasWidth: number;
  private canvasHeight: number;
  private replayButton: ReplayButton;
  private onReplay: EndingReplayCallback;

  constructor(
    canvasWidth: number,
    canvasHeight: number,
    imagePath: string,
    onReplay: EndingReplayCallback,
  ) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.onReplay = onReplay;
    this.fadeInDuration = settings.ending.fadeInDuration;
    this.holdDuration = settings.ending.holdDuration;
    this.replayButton = new ReplayButton();
    this.replayButton.onClick(() => {
      this.onReplay();
    });

    // Preload image
    this.image = new Image();
    this.image.onload = (): void => {
      this.imageLoaded = true;
    };
    this.image.onerror = (): void => {
      console.warn("Failed to load ending image:", imagePath);
      this.imageLoaded = true; // proceed without image
    };
    this.image.src = imagePath;
  }

  enter(): void {
    this.timer = 0;
    this.imageOpacity = 0;
    this.rainOpacity = 1;
    this.phase = "fadeIn";
    this.replayButton.hide();
  }

  execute(dt: number): void {
    this.timer += dt;

    switch (this.phase) {
      case "fadeIn": {
        // Fade image in, fade rain out
        const progress = Math.min(this.timer / this.fadeInDuration, 1);
        this.imageOpacity = progress;
        this.rainOpacity = 1 - progress;

        if (progress >= 1) {
          this.phase = "hold";
          this.timer = 0;
        }
        break;
      }
      case "hold": {
        if (this.timer * 1000 >= this.holdDuration) {
          this.phase = "showButton";
          this.replayButton.show();
        }
        break;
      }
      case "showButton": {
        // Waiting for user to click Replay
        break;
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    // Rain opacity is controlled by engine via getRainOpacity()
    // Here we render the ending image

    if (this.imageLoaded && this.image && this.imageOpacity > 0) {
      ctx.save();
      ctx.globalAlpha = this.imageOpacity;

      // Scale image to fit within max dimensions
      const maxW = this.canvasWidth * settings.ending.imageMaxWidth;
      const maxH = this.canvasHeight * settings.ending.imageMaxHeight;

      const imgW = this.image.naturalWidth || maxW;
      const imgH = this.image.naturalHeight || maxH;

      const scale = Math.min(maxW / imgW, maxH / imgH, 1);
      const drawW = imgW * scale;
      const drawH = imgH * scale;

      const x = (this.canvasWidth - drawW) / 2;
      const y = (this.canvasHeight - drawH) / 2;

      ctx.drawImage(this.image, x, y, drawW, drawH);
      ctx.restore();
    }
  }

  /** Rain opacity multiplier — engine should use this when rendering rain. */
  getRainOpacity(): number {
    return this.rainOpacity;
  }

  exit(): void {
    this.replayButton.hide();
    this.image = null;
    this.imageLoaded = false;
  }
}
