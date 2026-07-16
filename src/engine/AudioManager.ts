import { Howl } from "howler";
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
 */
export class AudioManager {
  private sounds = new Map<SoundName, SoundEntry>();
  private muted = false;
  private initialized = false;

  /** Preload all audio files. Call once on app init. */
  init(): void {
    if (this.initialized) return;

    const soundDefs: [SoundName, string, number][] = [
      ["rain", "assets/audio/rain.m4a", settings.audio.rainVolume],
      ["reveal", "assets/audio/reveal.m4a", settings.audio.revealVolume],
      ["scatter", "assets/audio/scatter.m4a", settings.audio.scatterVolume],
      ["ending", "assets/audio/ending.m4a", settings.audio.endingVolume],
    ];

    for (const [name, src, volume] of soundDefs) {
      const howl = new Howl({
        src: [src],
        volume: volume,
        loop: name === "rain",
        preload: true,
        onloaderror: (_id: unknown, err: unknown): void => {
          console.warn(`Audio "${name}" load error:`, err);
        },
      });

      this.sounds.set(name, { howl, volume });
    }

    this.initialized = true;
  }

  /** Play a named sound. */
  play(name: SoundName): void {
    if (this.muted) return;
    const entry = this.sounds.get(name);
    if (entry) {
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
}
