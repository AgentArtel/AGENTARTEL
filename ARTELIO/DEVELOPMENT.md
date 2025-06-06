# ARTELIO Development Documentation

This document outlines the development process, architecture decisions, and future plans for the ARTELIO project.

## Project Structure

ARTELIO follows the standard RPG-JS project structure with some custom additions:

```
ARTELIO/
├── main/
│   ├── database/
│   │   └── items/          # Game items (paintings, photos, etc.)
│   ├── events/             # NPC and event definitions
│   │   ├── index.ts        # Event registry
│   │   ├── artist.ts       # Artist NPC implementation
│   │   ├── photographer.ts # Photographer NPC implementation
│   │   └── ...
│   ├── gui/                # Custom UI components
│   │   └── ImageViewer.vue # Component for displaying artwork
│   ├── spritesheets/       # Character and tileset definitions
│   ├── utils/              # Utility functions and configurations
│   │   ├── config.ts       # Configuration from environment variables
│   │   └── npc-emotions.ts # Emotion bubble utilities
│   └── worlds/             # Map definitions and tilesets
│       └── maps/           # TMX map files
├── .env                    # Environment variables for API endpoints
└── .gitignore             # Git ignore file
```

## AI NPC Implementation

### Artist NPC

The Artist NPC generates custom artwork based on player interactions:

1. Greets the player and offers to create a painting
2. Presents dialogue options to determine the painting style
3. Constructs a prompt based on player choices
4. Sends the prompt to an external AI image generation API
5. Displays the generated artwork using the ImageViewer component
6. Adds the painting to the player's inventory

### Photographer NPC

The Photographer NPC takes portrait photos of the player:

1. Greets the player and offers to take their portrait
2. Takes the photo and tells the player to return later
3. Processes the photo using an external AI image generation API
4. Shows a recurring exclamation bubble to notify the player when the photo is ready
5. When the player returns, displays the photo and adds it to their inventory

## Emotion Bubble System

We've implemented an emotion bubble system that allows NPCs to express emotions:

1. Uses the `@rpgjs/plugin-emotion-bubbles` package
2. Displays emotions above NPCs during interactions
3. Supports various emotions: Happy, Sad, Exclamation, Question, etc.
4. Can show recurring emotions to notify players of state changes

## External API Integration

ARTELIO integrates with external APIs for AI-powered features:

1. **Art Generation API**: Creates custom artwork based on text prompts
2. **NPC Dialogue API**: Generates dynamic dialogue responses (planned)

API endpoints are configured through environment variables in the `.env` file.

## Future Development Plans

### Planned Features

1. **AI-Powered Dialogue**: Implement dynamic dialogue generation for all NPCs
2. **New Map Areas**: Expand the game world with additional maps and environments
3. **Quest System**: Create a quest system with AI-generated objectives and rewards
4. **Character Customization**: Allow players to customize their appearance
5. **Multiplayer Interactions**: Enable players to share and view each other's artwork

### Technical Improvements

1. **Caching System**: Implement caching for generated images to reduce API calls
2. **Offline Fallbacks**: Add fallback options when external APIs are unavailable
3. **Performance Optimization**: Optimize image loading and rendering
4. **Mobile Support**: Enhance mobile device compatibility

## Development Guidelines

When contributing to ARTELIO, follow these guidelines:

1. **Code Style**: Follow TypeScript best practices and maintain consistent formatting
2. **Error Handling**: Always include proper error handling for external API calls
3. **Documentation**: Document all new features and update existing documentation
4. **Testing**: Test all features with and without internet connectivity
5. **Environment Variables**: Never hardcode API endpoints or keys; use environment variables

## Known Issues

1. **API Rate Limiting**: External APIs may have rate limits that affect gameplay
2. **Image Loading**: Some generated images may take time to load or occasionally fail
3. **Mobile Performance**: Complex UI components may affect performance on mobile devices

## Resources

- [RPG-JS Documentation](https://docs.rpgjs.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Vue.js Documentation](https://vuejs.org/guide/introduction.html) (for GUI components)
