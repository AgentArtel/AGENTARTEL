---
description: A step-by-step workflow for adding interactive NPCs with dialogue choices to your RPG-JS game.
---

Content

### Prerequisites
- Existing RPG-JS project
- Basic understanding of TypeScript

### Step 1: Create the NPC Event File
Create a new TypeScript file in your events directory:

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
        // Set appearance - using female sprite as default
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
    }
}
Step 2: Add the NPC to Your Map
Open your map file (e.g., simplemap.tmx) and add the NPC object to the object layer:

xml
CopyInsert
<!-- IMPORTANT: Add this INSIDE the <objectgroup> tags -->
<object id="[unique-id]" name="village-character" x="[x-position]" y="[y-position]">
  <point/>
</object>
Key points:

The name attribute MUST match the name in @EventData
The object must be inside the <objectgroup> tags
Each object needs a unique ID
The <point/> tag is required
Step 3: Test Your NPC
Run your game: npm run dev
Navigate to your NPC's position
Press the action key (usually Space or Enter) when facing the NPC
Verify dialogue appears and choices work
Troubleshooting
NPC doesn't appear: Verify the object name in TMX matches the @EventData name
XML errors: Ensure proper nesting of tags in TMX file
Dialogue doesn't show: Verify talkWith parameter is included