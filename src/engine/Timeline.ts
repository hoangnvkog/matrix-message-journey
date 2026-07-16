import type { StoryData, StoryMessage } from "./StoryTypes.js";

/**
 * Manages story progression — which message to show, hold duration,
 * and what state comes next after each phase.
 *
 * This is pure data/logic. It knows nothing about rendering or canvas.
 */
export class Timeline {
  private story: StoryData | null = null;
  private messageIndex = -1;

  /** Load story data from a JSON file path (relative to origin). */
  async load(jsonPath: string): Promise<void> {
    const res = await fetch(jsonPath);
    if (!res.ok) {
      throw new Error(`Failed to load story: ${res.status} ${res.statusText}`);
    }
    this.story = (await res.json()) as StoryData;
    this.messageIndex = -1;
  }

  /** Whether a story has been loaded. */
  isLoaded(): boolean {
    return this.story !== null;
  }

  /** Total number of messages in the story. */
  getMessageCount(): number {
    return this.story?.messages.length ?? 0;
  }

  /** Current message index (0-based, -1 if not started). */
  getMessageIndex(): number {
    return this.messageIndex;
  }

  /** Get the current message object. Returns null if not started. */
  getCurrentMessage(): StoryMessage | null {
    if (!this.story || this.messageIndex < 0) return null;
    return this.story.messages[this.messageIndex] ?? null;
  }

  /** Hold duration (ms) for the current message. Falls back to default. */
  getHoldDuration(): number {
    const msg = this.getCurrentMessage();
    return msg?.hold ?? 3000;
  }

  /** Story title (shown in intro). */
  getTitle(): string {
    return this.story?.title ?? "";
  }

  /** Ending image path. */
  getEndingImage(): string {
    return this.story?.ending?.image ?? "";
  }

  /* ------------------------------------------------------------------ */
  /*  Progression queries — called by state handlers to decide           */
  /*  which state to transition to next.                                 */
  /* ------------------------------------------------------------------ */

  /**
   * After Rain state completes, should we:
   * - Gather the next message?  → returns true
   * - Jump to Ending?           → returns false
   */
  shouldGatherNext(): boolean {
    if (!this.story) return false;
    return this.messageIndex + 1 < this.story.messages.length;
  }

  /** Advance to the next message. Call BEFORE transitioning to Gather. */
  advanceMessage(): void {
    this.messageIndex++;
  }

  /** Whether we have shown all messages. */
  isComplete(): boolean {
    if (!this.story) return false;
    return this.messageIndex >= this.story.messages.length - 1;
  }

  /** Reset to the beginning (for replay). */
  reset(): void {
    this.messageIndex = -1;
  }
}
