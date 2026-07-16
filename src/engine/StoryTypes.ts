/** A single message in the story. */
export interface StoryMessage {
  text: string;
  hold: number;
}

/** The ending configuration. */
export interface StoryEnding {
  image: string;
}

/** The full story data loaded from story.json. */
export interface StoryData {
  title: string;
  messages: StoryMessage[];
  ending: StoryEnding;
}
