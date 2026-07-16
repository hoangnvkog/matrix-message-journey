/**
 * Finite State Machine for the Matrix Rain Story.
 *
 * Each state is handled by a StateHandler with enter/execute/exit lifecycle.
 * Transitions are explicit and validated against an allowed-transition map.
 */

export enum AppState {
  Loading = "Loading",
  Rain = "Rain",
  Gather = "Gather",
  Reveal = "Reveal",
  Hold = "Hold",
  WaitingInput = "WaitingInput",
  Scatter = "Scatter",
  Ending = "Ending",
  Replay = "Replay",
}

export interface StateHandler {
  /** Called once when entering this state. */
  enter(): void;
  /** Called every frame while this state is active. */
  execute(dt: number): void;
  /** Called once when leaving this state. */
  exit(): void;
}

/** Which states each state is allowed to transition to. */
const ALLOWED_TRANSITIONS: Record<AppState, readonly AppState[]> = {
  [AppState.Loading]: [AppState.Rain],
  [AppState.Rain]: [AppState.Gather, AppState.Ending],
  [AppState.Gather]: [AppState.Reveal],
  [AppState.Reveal]: [AppState.Hold, AppState.WaitingInput],
  [AppState.Hold]: [AppState.WaitingInput],
  [AppState.WaitingInput]: [AppState.Scatter],
  [AppState.Scatter]: [AppState.Rain, AppState.Ending],
  [AppState.Ending]: [AppState.Replay],
  [AppState.Replay]: [AppState.Loading],
};

export class StateMachine {
  private handlers = new Map<AppState, StateHandler>();
  private current: AppState | null = null;

  /** Register a handler for a given state. */
  register(state: AppState, handler: StateHandler): void {
    this.handlers.set(state, handler);
  }

  /** Set the initial state without calling exit on any previous state. */
  start(initialState: AppState): void {
    this.current = initialState;
    const handler = this.handlers.get(initialState);
    if (!handler) {
      throw new Error(`No handler registered for state: ${initialState}`);
    }
    handler.enter();
  }

  /** Transition to a new state. Throws if transition is not allowed. */
  transitionTo(next: AppState): void {
    if (this.current === null) {
      throw new Error("StateMachine not started. Call start() first.");
    }

    const allowed = ALLOWED_TRANSITIONS[this.current];
    if (!allowed.includes(next)) {
      throw new Error(
        `Invalid transition: ${this.current} → ${next}. ` +
          `Allowed: [${allowed.join(", ")}]`,
      );
    }

    const prevHandler = this.handlers.get(this.current);
    prevHandler?.exit();

    this.current = next;

    const nextHandler = this.handlers.get(next);
    if (!nextHandler) {
      throw new Error(`No handler registered for state: ${next}`);
    }
    nextHandler.enter();
  }

  /** Called every frame by MatrixEngine. */
  update(dt: number): void {
    if (this.current === null) return;
    const handler = this.handlers.get(this.current);
    handler?.execute(dt);
  }

  /** Current active state (read-only). */
  getState(): AppState | null {
    return this.current;
  }
}
