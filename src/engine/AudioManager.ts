import { Howl, Howler } from "howler";
import { settings } from "../config/settings.js";

type SoundName = "rain" | "reveal" | "scatter" | "ending";

interface SoundEntry {
  howl: Howl;
  volume: number;
}

/**
 * Manages all audio playback via Howler.js.
 *
 * Preloads all sounds on init. Provides play/stop/mute controls.
 * Gracefully handles missing audio files.
 *
 * Browser autoplay policy: Web Audio can only be (re)started after a user
 * gesture. We buffer any play() calls made before the first gesture and
 * replay them once the user interacts with the page.
 */
export class AudioManager {
  private sounds = new Map<SoundName, SoundEntry>();
  private muted = false;
  private initialized = false;
  private unlocked = false;
  private pendingPlays: SoundName[] = [];

  /** Preload all audio files. Call once on app init. */
  init(): void {
    if (this.initialized) return;

    const soundDefs: [SoundName, string, number][] = [
      ["rain", "assets/audio/rain.mp3", settings.audio.rainVolume],
      ["reveal", "assets/audio/reveal.mp3", settings.audio.revealVolume],
      ["scatter", "assets/audio/scatter.mp3", settings.audio.scatterVolume],
      ["ending", "assets/audio/ending.mp3", settings.audio.endingVolume],
    ];

    for (const [name, src, volume] of soundDefs) {
      const howl = new Howl({
        src: [src],
        volume: volume,
        loop: name === "rain",
        preload: true,
        html5: true, // Use HTML5 Audio for better mobile compatibility
        onloaderror: (_id: unknown, err: unknown): void => {
          console.warn(`Audio "${name}" load error:`, err);
        },
      });

      this.sounds.set(name, { howl, volume });
    }

    this.initialized = true;
    this.registerUnlockHandlers();
  }

  /**
   * Register one-time listeners that mark the audio system as "unlocked"
   * once the user interacts with the page. This is required by Chrome
   * (and other modern browsers) to satisfy the autoplay policy.
   */
  private registerUnlockHandlers(): void {
    const unlock = (): void => {
      if (this.unlocked) return;
      this.unlocked = true;

      // Force-resume the AudioContext (Howler exposes a noop if it can't).
      try {
        if (Howler.ctx && Howler.ctx.state === "suspended") {
          void Howler.ctx.resume();
        }
      } catch {
        /* ignore */
      }

      // Drain queued plays. For sounds that are still relevant to current
      // state, re-trigger them. We only re-trigger "rain" (looping ambient)
      // to keep the behavior predictable; one-shots (reveal/scatter/ending)
      // that were queued before user gesture are simply dropped to avoid
      // playing stale audio events.
      if (!this.muted) {
        const queued = this.pendingPlays;
        this.pendingPlays = [];
        if (queued.includes("rain")) {
          this.play("rain");
        }
      } else {
        this.pendingPlays = [];
      }

      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      window.removeEventListener("touchstart", unlock);
      window.removeEventListener("touchend", unlock);
      window.removeEventListener("click", unlock);
    };

    window.addEventListener("pointerdown", unlock, { passive: true });
    window.addEventListener("keydown", unlock);
    window.addEventListener("touchstart", unlock, { passive: true });
    window.addEventListener("touchend", unlock, { passive: true });
    window.addEventListener("click", unlock);
  }

  /** Play a named sound. */
  play(name: SoundName): void {
    if (this.muted) return;

    // Before the first user gesture, Web Audio can't start. Buffer the
    // request and replay on unlock so the ambient rain isn't lost.
    if (!this.unlocked) {
      this.pendingPlays.push(name);
      return;
    }

    const entry = this.sounds.get(name);
    if (entry) {
      // Stop first to handle re-play (e.g. rain loop restart)
      entry.howl.stop();
      entry.howl.volume(entry.volume);
      entry.howl.play();
    }
  }

  /** Stop a named sound. */
  stop(name: SoundName): void {
    const entry = this.sounds.get(name);
    if (entry) {
      entry.howl.stop();
    }
  }

  /** Stop all sounds. */
  stopAll(): void {
    for (const entry of this.sounds.values()) {
      entry.howl.stop();
    }
  }

  /** Toggle mute on/off. Returns new muted state. */
  toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.muted) {
      this.stopAll();
    } else {
      // Ensure audio is unlocked when unmuting
      this.ensureUnlocked();
    }
    return this.muted;
  }

  /** Set mute state explicitly. */
  setMuted(value: boolean): void {
    this.muted = value;
    if (this.muted) {
      this.stopAll();
    }
  }

  isMuted(): boolean {
    return this.muted;
  }

  /** Whether the audio system has been unlocked by a user gesture. */
  isUnlocked(): boolean {
    return this.unlocked;
  }

  /** Ensure audio is unlocked - call on first user interaction. */
  ensureUnlocked(): void {
    if (!this.unlocked) {
      // Trigger unlock sequence
      try {
        if (Howler.ctx && Howler.ctx.state === "suspended") {
          void Howler.ctx.resume();
        }
      } catch {
        /* ignore */
      }
      this.unlocked = true;
      
      // Drain queued plays - only re-trigger rain
      if (!this.muted) {
        const queued = this.pendingPlays;
        this.pendingPlays = [];
        if (queued.includes("rain")) {
          this.play("rain");
        }
      } else {
        this.pendingPlays = [];
      }
    }
  }
}
