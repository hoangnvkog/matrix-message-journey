/**
 * Central configuration for the Matrix Rain Story application.
 *
 * All visual, timing, and behavioral parameters are defined here
 * to allow easy tuning without touching engine code.
 */
export const settings = {
  /** Canvas rendering */
  canvas: {
    background: "#000000",
    pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
  },

  /** Matrix rain parameters */
  rain: {
    speed: 1.2,
    glyphSize: 16,
    columnGap: 2,
    glowColor: "#00ff41",
    glowBlur: 8,
    headBrightness: 1.0,
    trailFade: 0.05,
    trailLength: 20,
    density: 0.95,
  },

  /** Glyph set used for the rain */
  glyphs:
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ" +
    "0123456789" +
    "アイウエオカキクケコサシスセソ" +
    "タチツテトナニヌネノハヒフヘホ" +
    "マミムメモヤユヨラリルレロワヲン",

  /** Message reveal animation */
  reveal: {
    duration: 2.0,
    scrambleIterations: 3,
    font: '"Courier New", monospace',
    fontSize: 48,
    color: "#00ff41",
    lineHeight: 1.4,
  },

  /** Gather effect: rain → message formation */
  gather: {
    duration: 1.5,
    easing: "power2.inOut",
  },

  /** Scatter effect: message → rain */
  scatter: {
    duration: 1.2,
    shakeDuration: 0.3,
    shakeIntensity: 4,
    easing: "power2.in",
  },

  /** Glow effect on revealed text */
  glow: {
    intensity: 1.0,
    spread: 10,
    pulseSpeed: 2.0,
  },

  /** Hold duration (ms) after reveal before waiting for input */
  hold: {
    defaultMs: 3000,
  },

  /** Intro scene */
  intro: {
    title: "THE MATRIX",
    subtitle: "A STORY IN RAIN",
    fadeInDuration: 1.5,
    holdDuration: 2.0,
    fadeOutDuration: 1.0,
  },

  /** Ending scene */
  ending: {
    fadeInDuration: 2.0,
    holdDuration: 5.0,
    imageMaxWidth: 0.8,
    imageMaxHeight: 0.6,
  },

  /** Audio */
  audio: {
    rainVolume: 0.3,
    revealVolume: 0.5,
    scatterVolume: 0.4,
    endingVolume: 0.6,
  },

  /** Input debouncing */
  input: {
    ignoreDuringAnimation: true,
    cooldownMs: 300,
  },
} as const;

export type Settings = typeof settings;
