import type { StateHandler } from "../engine/StateMachine.js";
import type { MatrixRain } from "../engine/MatrixRain.js";

export type RainTransitionCallback = () => void;

/**
 * State handler for the Rain state.
 *
 * Runs the MatrixRain animation for a short duration,
 * then signals the engine to transition to the next state.
 */
export class RainScene implements StateHandler {
  private rain: MatrixRain;
  private onTransition: RainTransitionCallback;
  private timer = 0;

  private static readonly RAIN_DURATION = 1.5;

  constructor(rain: MatrixRain, onTransition: RainTransitionCallback) {
    this.rain = rain;
    this.onTransition = onTransition;
  }

  enter(): void {
    this.timer = 0;
  }

  execute(dt: number): void {
    this.rain.update(dt);

    this.timer += dt;
    if (this.timer >= RainScene.RAIN_DURATION) {
      this.onTransition();
    }
  }

  exit(): void {
    // Rain keeps rendering via the engine's ambient render pass.
  }
}
