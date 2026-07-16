/**
 * Replay button UI component.
 *
 * A styled DOM button overlaid on the canvas.
 * Hidden by default, shown via show(), hidden via hide().
 */
export class ReplayButton {
  private element: HTMLButtonElement;
  private onClickCallback: (() => void) | null = null;

  constructor() {
    this.element = document.createElement("button");
    this.element.textContent = "↻ Replay";
    this.element.style.cssText = [
      "position: fixed",
      "bottom: 40px",
      "left: 50%",
      "transform: translateX(-50%)",
      "padding: 14px 36px",
      "font-family: 'Courier New', monospace",
      "font-size: 18px",
      "font-weight: bold",
      "color: #00ff41",
      "background: rgba(0, 0, 0, 0.7)",
      "border: 2px solid #00ff41",
      "border-radius: 4px",
      "cursor: pointer",
      "text-transform: uppercase",
      "letter-spacing: 2px",
      "z-index: 100",
      "display: none",
      "transition: opacity 0.3s ease",
    ].join("; ");

    this.element.addEventListener("click", () => {
      this.onClickCallback?.();
    });

    document.body.appendChild(this.element);
  }

  show(): void {
    this.element.style.display = "block";
    // Fade in
    this.element.style.opacity = "0";
    requestAnimationFrame(() => {
      this.element.style.opacity = "1";
    });
  }

  hide(): void {
    this.element.style.display = "none";
    this.element.style.opacity = "0";
  }

  onClick(callback: () => void): void {
    this.onClickCallback = callback;
  }

  /** Remove from DOM (cleanup). */
  destroy(): void {
    this.element.remove();
  }
}
