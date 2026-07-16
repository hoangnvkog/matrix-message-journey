import { Renderer } from "./Renderer.js";
import { StateMachine, AppState, type StateHandler } from "./StateMachine.js";
import { Timeline } from "./Timeline.js";
import { MatrixRain } from "./MatrixRain.js";
import { AudioManager } from "./AudioManager.js";
import { ResponsiveManager } from "./ResponsiveManager.js";
import { RainScene } from "../scenes/RainScene.js";
import { MessageScene } from "../scenes/MessageScene.js";
import { ScatterScene } from "../scenes/ScatterScene.js";
import { EndingScene } from "../scenes/EndingScene.js";
import { MuteButton } from "../ui/MuteButton.js";

function createPlaceholderHandler(label: string): StateHandler {
  return {
    enter(): void {
      console.log(`[State] → ${label}`);
    },
    execute(_dt: number): void {},
    exit(): void {},
  };
}

/**
 * Top-level orchestrator for the Matrix Rain Story.
 */
export class MatrixEngine {
  private renderer: Renderer;
  private stateMachine: StateMachine;
  private timeline: Timeline;
  private rain: MatrixRain;

  private activeMessageScene: MessageScene | null = null;
  private activeScatterScene: ScatterScene | null = null;
  private activeEndingScene: EndingScene | null = null;
  private audio: AudioManager;
  private muteButton: MuteButton;
  private responsive: ResponsiveManager;

  /** Rain opacity multiplier (1 = full, 0 = invisible) */
  private rainAlpha = 1;

  /** Cached from MessageScene before scatter starts */
  private lastCharPositions: { x: number; y: number }[] = [];
  private lastMessageText = "";

  constructor() {
    this.renderer = new Renderer("canvas");
    this.stateMachine = new StateMachine();
    this.timeline = new Timeline();
    this.rain = new MatrixRain();

    this.audio = new AudioManager();
    this.responsive = new ResponsiveManager(
      window.innerWidth,
      window.innerHeight,
    );
    this.muteButton = new MuteButton();
    this.muteButton.onClick(() => {
      const muted = this.audio.toggleMute();
      this.muteButton.updateIcon(muted);
    });

    this.renderer.setOnFrame((dt) => this.update(dt));
    this.registerStates();

    window.addEventListener("resize", () => {
      this.responsive.update(this.renderer.width, this.renderer.height);
      this.rain.applyConfig(this.responsive.getConfig());
      this.rain.resize(this.renderer.width, this.renderer.height);
    });
  }

  private registerStates(): void {
    this.stateMachine.register(
      AppState.Loading,
      createPlaceholderHandler("Loading"),
    );

    // Rain
    this.stateMachine.register(
      AppState.Rain,
      new RainScene(this.rain, () => {
        this.audio.play("rain");
        if (this.timeline.shouldGatherNext()) {
          this.timeline.advanceMessage();
          this.stateMachine.transitionTo(AppState.Gather);
        } else {
          this.stateMachine.transitionTo(AppState.Ending);
        }
      }),
    );

    // Gather placeholder → Reveal
    this.stateMachine.register(
      AppState.Gather,
      new (class implements StateHandler {
        private engine: MatrixEngine;
        constructor(engine: MatrixEngine) {
          this.engine = engine;
        }
        enter(): void {
          console.log("[State] → Gather");
          setTimeout(() => {
            this.engine.getStateMachine().transitionTo(AppState.Reveal);
          }, 800);
        }
        execute(_dt: number): void {}
        exit(): void {}
      })(this),
    );

    // Reveal — MessageScene handles Reveal + Hold
    this.stateMachine.register(
      AppState.Reveal,
      new (class implements StateHandler {
        private engine: MatrixEngine;
        private scene: MessageScene | null = null;
        constructor(engine: MatrixEngine) {
          this.engine = engine;
        }
        enter(): void {
          this.engine.getAudio().play("reveal");
          const msg = this.engine.getTimeline().getCurrentMessage();
          if (!msg) return;

          const r = this.engine.getRenderer();
          this.scene = new MessageScene(
            r.width,
            r.height,
            msg.text,
            msg.hold,
            () => {
              const mr = this.scene?.getMessageRenderer();
              if (mr) {
                this.engine.setLastMessageData(
                  mr.getCharPositions() as { x: number; y: number }[],
                  msg.text,
                );
              }
              this.engine.getStateMachine().transitionTo(AppState.WaitingInput);
            },
          );
          this.scene.enter();
          this.engine.setActiveMessageScene(this.scene);
        }
        execute(dt: number): void {
          this.scene?.execute(dt);
        }
        exit(): void {
          this.scene?.exit();
          this.scene = null;
          this.engine.setActiveMessageScene(null);
        }
      })(this),
    );

    // WaitingInput placeholder
    this.stateMachine.register(
      AppState.WaitingInput,
      createPlaceholderHandler("WaitingInput"),
    );

    // Scatter
    this.stateMachine.register(
      AppState.Scatter,
      new (class implements StateHandler {
        private engine: MatrixEngine;
        private scene: ScatterScene | null = null;
        constructor(engine: MatrixEngine) {
          this.engine = engine;
        }
        enter(): void {
          this.engine.getAudio().play("scatter");
          const r = this.engine.getRenderer();
          this.scene = new ScatterScene(
            r.width,
            r.height,
            this.engine.getLastCharPositions(),
            this.engine.getLastMessageText(),
            () => {
              this.engine.getStateMachine().transitionTo(AppState.Rain);
            },
          );
          this.scene.enter();
          this.engine.setActiveScatterScene(this.scene);
        }
        execute(dt: number): void {
          this.scene?.execute(dt);
        }
        exit(): void {
          this.scene?.exit();
          this.scene = null;
          this.engine.setActiveScatterScene(null);
        }
      })(this),
    );

    // Ending
    this.stateMachine.register(
      AppState.Ending,
      new (class implements StateHandler {
        private engine: MatrixEngine;
        private scene: EndingScene | null = null;
        constructor(engine: MatrixEngine) {
          this.engine = engine;
        }
        enter(): void {
          this.engine.getAudio().play("ending");
          const r = this.engine.getRenderer();
          const imagePath = this.engine.getTimeline().getEndingImage();
          this.scene = new EndingScene(r.width, r.height, imagePath, () => {
            // Replay — reset timeline, hide ending, go to Rain
            this.engine.getTimeline().reset();
            this.engine.getStateMachine().transitionTo(AppState.Replay);
          });
          this.scene.enter();
          this.engine.setActiveEndingScene(this.scene);
        }
        execute(dt: number): void {
          this.scene?.execute(dt);
          // Update rain alpha from ending scene
          this.engine.setRainAlpha(this.scene?.getRainOpacity() ?? 1);
        }
        exit(): void {
          this.scene?.exit();
          this.scene = null;
          this.engine.setActiveEndingScene(null);
          this.engine.setRainAlpha(1);
        }
      })(this),
    );

    // Replay — just transition back to Rain
    this.stateMachine.register(
      AppState.Replay,
      new (class implements StateHandler {
        private engine: MatrixEngine;
        constructor(engine: MatrixEngine) {
          this.engine = engine;
        }
        enter(): void {
          console.log("[State] → Replay");
          this.engine.getStateMachine().transitionTo(AppState.Rain);
        }
        execute(_dt: number): void {}
        exit(): void {}
      })(this),
    );
  }

  async init(): Promise<void> {
    await this.timeline.load("src/data/story.json");
    this.responsive.update(this.renderer.width, this.renderer.height);
    this.rain.applyConfig(this.responsive.getConfig());
    this.rain.init(this.renderer.width, this.renderer.height);
    this.audio.init();
    this.stateMachine.start(AppState.Rain);
    this.renderer.start();
  }

  private update(dt: number): void {
    this.stateMachine.update(dt);

    const ctx = this.renderer.getContext();

    // Rain with alpha
    ctx.save();
    ctx.globalAlpha = this.rainAlpha;
    this.rain.render(ctx);
    ctx.restore();

    // Active scenes render on top
    if (this.activeMessageScene) {
      this.activeMessageScene.render(ctx);
    }
    if (this.activeScatterScene) {
      this.activeScatterScene.render(ctx);
    }
    if (this.activeEndingScene) {
      this.activeEndingScene.render(ctx);
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Setters for state handlers                                         */
  /* ------------------------------------------------------------------ */

  setActiveMessageScene(scene: MessageScene | null): void {
    this.activeMessageScene = scene;
  }

  setActiveScatterScene(scene: ScatterScene | null): void {
    this.activeScatterScene = scene;
  }

  setActiveEndingScene(scene: EndingScene | null): void {
    this.activeEndingScene = scene;
  }

  setRainAlpha(alpha: number): void {
    this.rainAlpha = alpha;
  }

  setLastMessageData(
    positions: { x: number; y: number }[],
    text: string,
  ): void {
    this.lastCharPositions = positions;
    this.lastMessageText = text;
  }

  getLastCharPositions(): { x: number; y: number }[] {
    return this.lastCharPositions;
  }

  getLastMessageText(): string {
    return this.lastMessageText;
  }

  /* ------------------------------------------------------------------ */
  /*  Accessors                                                          */
  /* ------------------------------------------------------------------ */

  getRenderer(): Renderer {
    return this.renderer;
  }

  getStateMachine(): StateMachine {
    return this.stateMachine;
  }

  getTimeline(): Timeline {
    return this.timeline;
  }

  getRain(): MatrixRain {
    return this.rain;
  }

  getAudio(): AudioManager {
    return this.audio;
  }

  getResponsive(): ResponsiveManager {
    return this.responsive;
  }
}
