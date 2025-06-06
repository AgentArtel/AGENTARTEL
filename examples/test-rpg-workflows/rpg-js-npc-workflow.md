# RPG-JS Workflow: Creating Interactive NPCs

This document outlines a verified workflow for adding interactive NPCs to your RPG-JS game. This process has been tested with multiple character types (Artist, Philosopher, Photographer) and provides a reliable pattern for creating rich, narrative-driven characters.

## 🎯 Overview

This workflow allows you to create NPCs that:
- Have unique dialogue and personality
- Offer multiple conversation options
- Respond to player choices
- Enhance your game's storytelling

## 📋 Prerequisites

- Existing RPG-JS project
- Basic understanding of TypeScript
- Access to edit TMX map files

## 🚶 Step-by-Step Process

### Step 1: Create the NPC Event File

Create a new TypeScript file in your events directory with this template:

```typescript
// src/modules/main/events/character.ts
import { RpgEvent, EventData, RpgPlayer, EventMode } from '@rpgjs/server'

@EventData({
    name: 'village-character',  // Unique identifier - MUST match object name in TMX file
    mode: EventMode.Shared,     // Shared (visible to all) or Scenario (player-specific)
    hitbox: {
        width: 32,
        height: 16
    }
})
export default class CharacterEvent extends RpgEvent {
    onInit() {
        // Set appearance
        this.setGraphic('female')
    }
    
    async onAction(player: RpgPlayer) {
        // Initial greeting
        await player.showText("Hello! I'm [Character Name], the village [role].", {
            talkWith: this
        })
        
        // Dialogue choices
        const choice = await player.showChoices("What would you like to talk about?", [
            { text: "Option 1", value: 'option1' },
            { text: "Option 2", value: 'option2' },
            { text: "Option 3", value: 'option3' }
        ])
        
        // Handle player choice
        if (choice && choice.value === 'option1') {
            await player.showText("This is the response to option 1.", {
                talkWith: this
            })
        }
        else if (choice && choice.value === 'option2') {
            await player.showText("This is the response to option 2.", {
                talkWith: this
            })
        }
        else {
            await player.showText("This is the response to option 3.", {
                talkWith: this
            })
        }
        
        // Farewell message
        await player.showText("Come back anytime!", {
            talkWith: this
        })
    }
}
```

### Step 2: Add the NPC to Your Map

Open your map file (e.g., simplemap.tmx) and add the NPC object to the object layer:

```xml
<!-- IMPORTANT: Add this INSIDE the <objectgroup> tags -->
<object id="[unique-id]" name="village-character" x="[x-position]" y="[y-position]">
  <point/>
</object>
```

Example:
```xml
<objectgroup id="3" name="Object Layer 1" offsetx="1" offsety="0">
  <!-- Other objects... -->
  <object id="16" name="village-character" x="400" y="300">
    <point/>
  </object>
</objectgroup>
```

**Critical Points:**
- The `name` attribute MUST match the name in `@EventData`
- The object must be inside the `<objectgroup>` tags
- Each object needs a unique ID
- The `<point/>` tag is required

### Step 3: Test Your NPC

1. Run your game: `npm run dev`
2. Navigate to your NPC's position
3. Press the action key (usually Space or Enter) when facing the NPC
4. Verify dialogue appears and choices work

## 🌟 Customization Options

### Add Visual Components Above NPC

```typescript
onInit() {
    this.setGraphic('female')
    this.setComponentsTop(Components.text('Artist'))
}
```

### Conditional Dialogue Based on Player Variables

```typescript
async onAction(player: RpgPlayer) {
    const questCompleted = player.getVariable('QUEST_COMPLETED')
    
    if (questCompleted) {
        await player.showText("Thank you for helping me find my paintbrush!")
    } else {
        await player.showText("I've lost my special paintbrush. Could you help me find it?")
        player.setVariable('QUEST_STARTED', true)
    }
}
```

### Give Items to Player

```typescript
async onAction(player: RpgPlayer) {
    await player.showText("Please take this healing potion for your journey.")
    player.addItem('healing-potion', 1)
}
```

## 🔍 Troubleshooting

- **NPC doesn't appear**: Verify the object name in TMX matches the @EventData name
- **NPC appears but doesn't interact**: Check onAction implementation
- **XML errors**: Ensure proper nesting of tags in TMX file
- **Dialogue doesn't show**: Verify talkWith parameter is included

## 📝 Example: Philosopher NPC

```typescript
@EventData({
    name: 'village-philosopher',
    mode: EventMode.Shared,
    hitbox: {
        width: 32,
        height: 16
    }
})
export default class PhilosopherEvent extends RpgEvent {
    onInit() {
        this.setGraphic('female')
    }
    
    async onAction(player: RpgPlayer) {
        await player.showText("Greetings, seeker of wisdom. I am Sophia, the village philosopher.", {
            talkWith: this
        })
        
        const choice = await player.showChoices("What philosophical topic interests you?", [
            { text: "The nature of reality", value: 'reality' },
            { text: "The meaning of life", value: 'meaning' },
            { text: "The concept of time", value: 'time' }
        ])
        
        if (choice && choice.value === 'reality') {
            await player.showText("Reality is not merely what we perceive with our senses, but a complex tapestry woven from consciousness, experience, and perhaps forces beyond our comprehension.", {
                talkWith: this
            })
        }
        else if (choice && choice.value === 'meaning') {
            await player.showText("The meaning of life is not found, but created. Through our actions, relationships, and the stories we tell ourselves, we craft purpose from the raw materials of existence.", {
                talkWith: this
            })
        }
        else {
            await player.showText("Time is the river we cannot step into twice. Yet paradoxically, in our memories and anticipations, we transcend its linear flow, suggesting our consciousness exists somewhat outside its boundaries.", {
                talkWith: this
            })
        }
        
        await player.showText("Return when you wish to explore more philosophical questions. The unexamined game is not worth playing.", {
            talkWith: this
        })
    }
}
```

## 💡 Best Practices

- Give NPCs meaningful names and roles that enhance your world
- Write dialogue that reflects the character's personality
- Use player variables to track interactions and quest progress
- Position NPCs logically in your game world
- Consider how NPCs relate to each other to build a cohesive narrative
- Test interactions thoroughly to ensure proper dialogue flow

## 🔄 Next Steps

After mastering NPC creation, consider:
- Creating quests that involve multiple NPCs
- Adding inventory interactions (trading, gifting)
- Implementing time-based NPC behaviors
- Developing relationship systems between player and NPCs
