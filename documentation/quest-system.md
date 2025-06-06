# ARTELIO Quest System Documentation

This document provides detailed information about the quest system implemented in ARTELIO, including the quest generation process, item interactions, and integration with AI services.

## Overview

The ARTELIO quest system transforms traditional RPG quests into physical items that players can collect, use, and trade with NPCs. This approach creates a more tangible and interactive quest experience while showcasing the AI-powered art generation capabilities of the game.

## Key Components

### 1. Quest Giver NPC

Located in `main/events/quest-giver.ts`, this NPC serves as the primary source of quests in the game.

**Features:**
- Dynamically generates quests based on player choices
- Uses AI to create unique quest descriptions and themes
- Provides quest scrolls as physical items
- Tracks quest completion status
- Rewards players upon quest completion

**Implementation Highlights:**
```typescript
// Generate quest content using webhook
const response = await axios.post(config.webhooks.questGiver, {
    messages: conversationHistory,
    questType: choice.value,
    prompt: userMessage,
    playerName: player.name || 'Adventurer',
    format: 'json'
});

// Create quest scroll with details
QuestScroll.setQuestDetails(
    questTitle,
    responseContent,
    choice.value === 'collection' ? responseContent : 'A beautiful artwork of ' + questTitle
);

// Give the quest scroll to the player
player.addItem('quest-scroll', 1);
```

### 2. Quest Scroll Item

Defined in `main/database/items/quest-scroll.ts`, this item represents a quest in the player's inventory.

**Properties:**
- `title`: The name of the quest
- `description`: Detailed quest description
- `theme`: The artistic theme for the quest (used for art generation)

**Usage:**
- Players can view quest details by using the item
- The scroll can be given to the Artist NPC to commission a painting
- Quest scrolls are non-consumable until completed

### 3. Artist NPC Integration

The Artist NPC (in `main/events/artist.ts`) accepts quest scrolls and creates paintings based on the quest theme.

**Process Flow:**
1. Player gives a quest scroll to the Artist
2. Artist extracts the theme from the quest scroll
3. AI generates artwork based on the theme
4. Artist creates a painting item with the generated image
5. Player receives the painting and quest is marked as complete

**Code Example:**
```typescript
async handleQuestCommission(player: RpgPlayer) {
    // Read the quest details
    await player.showText(`Hmm, a painting of ${QuestScroll.theme}... That's an interesting subject!`, {
        talkWith: this
    });
    
    // Generate artwork using AI
    const response = await axios.post(config.webhooks.artGeneration, {
        prompt: QuestScroll.theme,
        playerName: player.name || 'Adventurer'
    });
    
    // Extract image URL from response
    let imageUrl = '';
    if (response.data && response.data.url) {
        imageUrl = response.data.url;
    }
    
    // Create the painting with the generated image
    VillagePainting.setCustomPainting(
        imageUrl,
        QuestScroll.title,
        `A beautiful painting based on the theme: ${QuestScroll.theme}.`
    );
    
    // Give the painting to the player
    player.addItem('village-painting', 1);
    
    // Mark quest as completed
    player.setVariable('QUEST_COMPLETED', true);
}
```

## Webhook Integration

The quest system integrates with three main webhooks:

1. **Quest Generation** (`config.webhooks.questGiver`):
   - Generates quest titles, descriptions, and themes
   - Handles different quest types (combat, exploration, collection, mystery)
   - Maintains conversation history for contextual responses

2. **Art Generation** (`config.webhooks.artGeneration`):
   - Creates artwork based on quest themes
   - Returns image URLs for display in the game
   - Supports customization via prompts

3. **NPC Dialogue** (`config.webhooks.npcDialogue`):
   - Provides dynamic dialogue for NPCs
   - Responds to player choices and previous interactions

## Data Flow

1. **Quest Creation:**
   - Player interacts with Quest Giver
   - Quest Giver calls quest generation webhook
   - Quest details are stored in a Quest Scroll item
   - Player receives the Quest Scroll

2. **Quest Completion:**
   - Player gives Quest Scroll to Artist
   - Artist calls art generation webhook
   - Generated image is stored in a Painting item
   - Player receives the Painting
   - Quest is marked as complete

3. **Reward Collection:**
   - Player returns to Quest Giver
   - Quest Giver verifies completion
   - Player receives rewards (gold, items, etc.)

## Future Enhancements

Planned improvements to the quest system include:

1. **Quest Categories**: Implementing different types of quests with unique gameplay mechanics
2. **Quest Chains**: Creating interconnected quests that form a narrative
3. **Time-Limited Quests**: Special quests that are only available for a limited time
4. **Multiplayer Quests**: Collaborative quests that require multiple players
5. **Quest Journal**: A dedicated UI for tracking active and completed quests

## Troubleshooting

Common issues and solutions:

1. **Missing Image URLs**: If the art generation webhook doesn't return a valid URL, the system falls back to a default image.
2. **Quest Scroll Not Found**: The system checks if the player has the quest scroll before attempting to remove it.
3. **Webhook Timeout**: Implemented error handling for webhook calls to prevent game crashes.

## API Reference

### QuestScroll Class

```typescript
class QuestScroll {
    static title: string;
    static description: string;
    static theme: string;
    
    static setQuestDetails(title: string, description: string, theme: string): void;
    onUse(player: RpgPlayer): Promise<boolean>;
}
```

### Quest Giver Methods

```typescript
class QuestGiverEvent extends RpgEvent {
    onAction(player: RpgPlayer): Promise<void>;
    checkQuestProgress(player: RpgPlayer): Promise<void>;
    handleQuestCompletion(player: RpgPlayer): Promise<void>;
}
```

### Artist Methods

```typescript
class ArtistEvent extends RpgEvent {
    onAction(player: RpgPlayer): Promise<void>;
    handleQuestCommission(player: RpgPlayer): Promise<void>;
}
```
