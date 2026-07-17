/**
 * Next / envelope button — advances to the next story beat.
 *
 * A DOM button overlaid on the canvas at the bottom-center,
 * shown via show() and hidden via hide(). Only visible while
 * WaitingInput is active (after a story message is on screen).
 */
export class NextButton {
  private element: HTMLButtonElement;
  private onClickCallback: (() => void) | null = null;

  constructor() {
    this.element = document.createElement("button");
    this.element.innerHTML = "&#9993;"; // 📧 envelope Unicode
    this.element.style.cssText = [
      "position: fixed",
      "bottom: 40px",
      "left: 50%",
      "transform: translateX(-50%)",
      "width: 56px",
      "height: 56px",
      "font-size: 26px",
      "line-height: 1",
      "color: #00ff41",
      "background: rgba(0, 0, 0, 0.7)",
      "border: 2px solid #00ff41",
      "border-radius: 50%",
      "cursor: pointer",
      "z-index: 100",
      "display: none",
      "transition: opacity 0.25s ease, transform 0.15s ease",
    ].join("; ");

    this.element.addEventListener("click", (e) => {
      e.stopPropagation(); // Prevent event bubbling to window handlers
      this.onClickCallback?.();
    });

    document.body.appendChild(this.element);
  }

  show(): void {
    this.element.style.display = "block";
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

  destroy(): void {
    this.element.remove();
  }
}