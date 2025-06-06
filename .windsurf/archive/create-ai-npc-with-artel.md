---
description: How to create AI-powered NPCs with dynamic dialogue and emotion bubbles
---

# Creating AI-Powered NPCs with Dynamic Dialogue and Emotion Bubbles

This workflow guides you through creating interactive NPCs that use the AgentArtel API to generate dynamic, contextual dialogue responses with appropriate emotion bubbles.

## Prerequisites

1. Ensure you have the following utilities set up:
   - `agent-artel.ts` - For API communication
   - `npc-emotions.ts` - For emotion bubble handling
   - `config.ts` - For API keys and configuration

2. Make sure your environment variables are properly set up with your AgentArtel API key.

## Step 1: Choose an Agent for Your NPC

1. Review available agents in the AgentArtel documentation or your `config.ts` file.
2. Select an agent that matches the personality and expertise you want for your NPC.
3. Note the agent ID for use in your NPC event class.

## Step 2: Create the NPC Event Class

1. Create a new TypeScript file in the `main/events/` directory (e.g., `my-ai-npc.ts`).
2. Import the necessary modules and utilities:

```typescript
import { RpgEvent, EventData, RpgPlayer, EventMode, Components } from '@rpgjs/server'
import { EmotionBubble } from '@rpgjs/plugin-emotion-bubbles'
import '../utils/npc-emotions' // Import to extend RpgEvent with showEmotionBubble
import { NpcEmotions } from '../utils/npc-emotions'
import { AgentArtel } from '../utils/agent-artel'
import { config } from '../utils/config'

// Variable name for storing conversation history
const HISTORY_VAR = 'YOUR_NPC_HISTORY_VAR'
```

3. Create the event class with appropriate metadata:

```typescript
@EventData({
    name: 'your-unique-npc-id',  // Unique identifier for this NPC
    mode: EventMode.Shared,      // Visible to all players
    hitbox: {
        width: 32,
        height: 16
    }
})
export default class YourAiNpcEvent extends RpgEvent {
    // Implementation will go here
}
```

## Step 3: Implement the Basic NPC Structure

1. Add the `onInit` method to set up the NPC's appearance and label:

```typescript
onInit() {
    // Set the NPC's appearance - choose an appropriate sprite
    this.setGraphic('your-character-spritesheet')
    
    // Add a visual indicator above the NPC
    this.setComponentsTop(Components.text('Your NPC Name'))
}
```

2. Add a helper method to split long responses into manageable chunks:

```typescript
/**
 * Split a long message into multiple chunks for better dialogue display
 */
splitIntoChunks(text: string, maxLength: number = 150): string[] {
    // If text is short enough, return it as a single chunk
    if (text.length <= maxLength) return [text];
    
    const chunks = [];
    let currentChunk = '';
    
    // Split by sentences to keep context
    const sentences = text.split(/(?<=[.!?])\s+/);
    
    for (const sentence of sentences) {
        // If adding this sentence would exceed maxLength, push current chunk and start new one
        if (currentChunk.length + sentence.length > maxLength && currentChunk.length > 0) {
            chunks.push(currentChunk.trim());
            currentChunk = sentence;
        } else {
            // Otherwise, add sentence to current chunk
            currentChunk += (currentChunk.length > 0 ? ' ' : '') + sentence;
        }
    }
    
    // Add the last chunk if not empty
    if (currentChunk.trim().length > 0) {
        chunks.push(currentChunk.trim());
    }
    
    return chunks;
}
```

## Step 4: Implement the Interaction Logic

1. Add the `onAction` method to handle player interactions:

```typescript
async onAction(player: RpgPlayer) {
    // Initialize conversation history if needed
    if (!player.getVariable(HISTORY_VAR)) {
        player.setVariable(HISTORY_VAR, []);
    }
    
    // Get conversation history
    const conversationHistory = player.getVariable(HISTORY_VAR) || [];
    
    // Initial greeting if this is the first interaction
    if (conversationHistory.length === 0) {
        this.showEmotionBubble(EmotionBubble.Idea);
        
        const greeting = "Your NPC's initial greeting message here.";
        
        await player.showText(greeting, {
            talkWith: this
        });
        
        // Add this to conversation history
        conversationHistory.push({
            role: 'assistant',
            content: greeting
        });
        
        player.setVariable(HISTORY_VAR, conversationHistory);
    }
    
    // Show dialogue options
    const choice = await player.showChoices("What would you like to discuss?", [
        { text: "Option 1", value: 'option1' },
        { text: "Option 2", value: 'option2' },
        { text: "Ask a custom question", value: 'custom' },
        { text: "Continue our discussion", value: 'continue' }
    ]);
    
    if (!choice) return;
    
    try {
        let userMessage = "";
        
        // Handle different dialogue options
        if (choice.value === 'option1') {
            this.showEmotionBubble(EmotionBubble.Exclamation);
            await player.showText("You selected option 1. Let me think about that...", {
                talkWith: this
            });
            userMessage = "Specific question or prompt for option 1";
        }
        else if (choice.value === 'option2') {
            this.showEmotionBubble(EmotionBubble.Question);
            await player.showText("You selected option 2. Interesting choice...", {
                talkWith: this
            });
            userMessage = "Specific question or prompt for option 2";
        }
        else if (choice.value === 'custom') {
            this.showEmotionBubble(EmotionBubble.Question);
            await player.showText("What would you like to know?", {
                talkWith: this
            });
            
            // Get custom question from player
            const customInput = await player.showInputBox("What would you like to ask?", {
                length: 200,
                variable: true
            });
            
            if (!customInput || customInput.trim() === '') {
                await player.showText("You seem uncertain what to ask. Take your time.", {
                    talkWith: this
                });
                return;
            }
            
            userMessage = customInput;
        }
        else if (choice.value === 'continue') {
            this.showEmotionBubble(EmotionBubble.Idea);
            await player.showText("Let's continue our discussion.", {
                talkWith: this
            });
            
            // If continuing, use the last exchange as context
            if (conversationHistory.length >= 2) {
                userMessage = "Please continue explaining based on what you just told me.";
            } else {
                userMessage = "Let's continue our discussion.";
            }
        }
        
        // Add user message to history
        conversationHistory.push({
            role: 'user',
            content: userMessage
        });
        
        // Show thinking emotion while waiting for API response
        this.showEmotionBubble(EmotionBubble.ThreeDot);
        await player.showText("Hmm, let me think about that...", {
            talkWith: this
        });
        
        // Limit history to last 10 messages to prevent context overflow
        const limitedHistory = conversationHistory.slice(-10);
        
        // Format the user message with instructions for proper formatting
        const formattedUserMessage = `${userMessage}\n\nIMPORTANT: Please format your response as plain text without markdown formatting. Do not use headers (##), bold (**text**), or other markdown. Keep paragraphs short (2-3 sentences max) for better readability in a dialogue box. Use simple language and natural speech patterns. For actions, use *asterisks* like *adjusts glasses* which will be preserved.`;
        
        // Get response from the agent
        const agentResponse = await AgentArtel.chat(
            config.agentArtel.agents.yourChosenAgent, // Replace with your chosen agent ID
            formattedUserMessage,
            limitedHistory
        );
        
        // Detect emotion based on response
        const emotion = AgentArtel.detectEmotion(agentResponse);
        this.showEmotionBubble(NpcEmotions.mapWebhookEmotion(emotion));
        
        // Split response into chunks for better readability
        const responseChunks = this.splitIntoChunks(agentResponse);
        
        // Display each chunk as a separate dialogue box
        for (const chunk of responseChunks) {
            await player.showText(chunk, {
                talkWith: this
            });
        }
        
        // Add assistant response to history
        conversationHistory.push({
            role: 'assistant',
            content: agentResponse
        });
        
        // Update the conversation history
        player.setVariable(HISTORY_VAR, conversationHistory);
        
        // Closing remarks or prompt for further interaction
        this.showEmotionBubble(EmotionBubble.Idea);
        await player.showText("Is there anything else you'd like to discuss?", {
            talkWith: this
        });
        
    } catch (error) {
        console.error('Error in NPC dialogue:', error);
        
        // Fallback response in case of error
        this.showEmotionBubble(EmotionBubble.Confusion);
        await player.showText("I'm sorry, I seem to be having trouble with my thoughts right now. Let's talk again later.", {
            talkWith: this
        });
    }
}
```

## Step 5: Add the NPC to Your Map

1. Open your map file (e.g., `main/worlds/maps/yourmap.tmx`).
2. Add a new object to the object layer with the following properties:
   - Set the `name` property to match the event name in your `@EventData` decorator.
   - Position the object where you want the NPC to appear.

Example:
```xml
<object id="5" name="your-unique-npc-id" x="320" y="240" width="32" height="32"/>
```

## Step 6: Customize the NPC's Appearance and Behavior

1. Update the character sprite by changing the parameter in `this.setGraphic()`.
2. Customize the dialogue options to fit your NPC's role and personality.
3. Adjust the emotion bubbles to match the NPC's character.
4. Modify the greeting and closing messages to suit your NPC.

## Step 7: Test and Refine

1. Start your RPG-JS development server.
2. Interact with your NPC in the game.
3. Test different dialogue options and custom questions.
4. Check the terminal for any errors or issues with the API responses.
5. Refine the NPC's dialogue options and responses as needed.

## Advanced Customization

### Adding Memory or State

For NPCs that need to remember specific player actions or game state:

```typescript
// In your onAction method
const playerProgress = player.getVariable('SOME_PROGRESS_VARIABLE');
if (playerProgress === 'completed_quest') {
    // Modify dialogue options or responses based on player progress
}
```

### Adding Conditional Dialogue

For dialogue that changes based on game conditions:

```typescript
// Different dialogue options based on time of day or game state
const gameTime = player.getVariable('GAME_TIME');
if (gameTime === 'night') {
    // Show night-specific dialogue options
} else {
    // Show day-specific dialogue options
}
```

### Adding Item Interactions

For NPCs that can give or receive items:

```typescript
// Check if player has a specific item
if (player.hasItem('special-item', 1)) {
    // Special dialogue for players with the item
    await player.showText("I see you have the special item!", {
        talkWith: this
    });
    
    // Optionally take the item
    player.removeItem('special-item', 1);
}
```

## Troubleshooting

### API Response Issues

If the API responses aren't formatting correctly:
1. Check the terminal logs for the raw API response.
2. Verify that the `stripMarkdown` method in `agent-artel.ts` is working correctly.
3. Ensure the formatting instructions in the user message are clear and specific.

### Conversation History Issues

If the NPC doesn't seem to remember previous interactions:
1. Check that the conversation history variable is being properly set and retrieved.
2. Verify that the history is being correctly passed to the AgentArtel API.
3. Make sure the history isn't being truncated too aggressively.

### Performance Issues

If the NPC responses are slow:
1. Consider reducing the amount of conversation history sent to the API.
2. Implement a loading indicator or animation during API calls.
3. Add more engaging "thinking" dialogue while waiting for the API response.
