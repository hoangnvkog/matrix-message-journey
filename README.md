# Matrix Rain Story

An interactive storytelling experience inspired by The Matrix digital rain.

Messages are gradually decoded from falling glyphs. The user clicks to continue. After all messages, the Matrix transforms into an ending image.

**Live Demo:** [https://yourusername.github.io/matrix-rain-story/](https://yourusername.github.io/matrix-rain-story/)

## Tech Stack

- **Vite** — Build tool
- **TypeScript** — Strict mode
- **Canvas 2D** — Rendering
- **GSAP** — Animations
- **Howler.js** — Audio
- **ESLint + Prettier** — Code quality

## Features

- Matrix digital rain with glow effects
- Scramble-to-reveal message animation
- Gather & scatter particle effects
- Responsive design (phone → desktop)
- Audio system with mute toggle
- 60fps optimized rendering
- Zero-allocation render loop
- GitHub Pages auto-deploy

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint
npm run lint

# Format
npm run format
```

## Project Structure

```
src/
├── engine/          Core engine modules
├── effects/         Visual effects (Gather, Scatter)
├── scenes/          State handlers (Rain, Message, Ending)
├── ui/              DOM UI components
├── config/          Settings
├── data/            Story data (story.json)
└── assets/          Audio, fonts, images
```

## Customization

Edit `src/data/story.json` to change messages:

```json
{
  "title": "Your Title",
  "messages": [
    { "text": "First message.", "hold": 3000 },
    { "text": "Second message.", "hold": 3000 }
  ],
  "ending": {
    "image": "images/final.jpg"
  }
}
```

Edit `src/config/settings.ts` to adjust visual parameters.

## Deployment

Push to `main` branch. GitHub Actions will automatically build and deploy to GitHub Pages.

## License

MIT
