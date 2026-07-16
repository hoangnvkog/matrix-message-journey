/**
 * Mute/unmute toggle button.
 *
 * A small DOM button overlaid on the canvas.
 * Displays 🔊 when unmuted, 🔇 when muted.
 */
export class MuteButton {
  private element: HTMLButtonElement;
  private onClickCallback: (() => void) | null = null;

  constructor() {
    this.element = document.createElement("button");
    this.element.textContent = "🔊";
    this.element.style.cssText = [
      "position: fixed",
      "top: 16px",
      "right: 16px",
      "width: 40px",
      "height: 40px",
      "font-size: 20px",
      "color: #00ff41",
      "background: rgba(0, 0, 0, 0.6)",
      "border: 1px solid rgba(0, 255, 65, 0.3)",
      "border-radius: 4px",
      "cursor: pointer",
      "z-index: 100",
      "display: flex",
      "align-items: center",
      "justify-content: center",
      "line-height: 1",
    ].join("; ");

    this.element.addEventListener("click", () => {
      this.onClickCallback?.();
    });

    document.body.appendChild(this.element);
  }

  /** Update the icon based on muted state. */
  updateIcon(muted: boolean): void {
    this.element.textContent = muted ? "🔇" : "🔊";
  }

  onClick(callback: () => void): void {
    this.onClickCallback = callback;
  }

  show(): void {
    this.element.style.display = "flex";
  }

  hide(): void {
    this.element.style.display = "none";
  }

  destroy(): void {
    this.element.remove();
  }
}
