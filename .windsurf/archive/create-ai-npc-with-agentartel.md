---
description: How to create AI-powered NPCs with dynamic dialogue using the AgentArtel API
---

# Creating AI-Powered NPCs with AgentArtel Integration

> ⚠️ **IMPORTANT API CALL PATTERN** ⚠️
> 
> The recommended and most maintainable way to specify the Agent ID is by using the `config.ts` file:
> ```typescript
> // RECOMMENDED PATTERN (works for correctly configured agents):
> const agentResponse = await AgentArtel.chat(
>     config.agentArtel.agents.yourAgentName, // e.g., config.agentArtel.agents.dreamInterpreter
>     message,
>     history
> );
> ```
> **If this pattern results in an "API key not valid" error for a specific agent, BUT WORKS FOR OTHER AGENTS (like `dreamInterpreter`), the issue is almost certainly NOT in your code's API call logic.** 
> It strongly indicates a problem on the **AgentArtel platform** regarding:
> 1. The exact Agent ID string defined in your `config.ts` for that agent (e.g., `historyMentor: 'history-mentor'`) might not perfectly match the ID on the AgentArtel platform.
> 2. Your API key may not have the necessary permissions granted on the AgentArtel platform to access that specific agent.
> 
> **See Troubleshooting Step 7 for how to resolve platform-side issues.**

This workflow guides you through creating NPCs with dynamic AI-powered dialogue using the AgentArtel API integration. Follow these steps to create NPCs that can engage in contextual conversations with players.

## Prerequisites

1. Ensure your `.env` file contains the required environment variables:
   ```
   AGENT_ARTEL_API_KEY=your_api_key_here
   AGENT_ARTEL_BASE_URL=https://agent-artel-production.up.railway.app
   ```

   **IMPORTANT:** The API key must be valid and active. You can verify your API key by:
   - Checking your AgentArtel account dashboard
   - Using a test request with curl or Postman
   - Looking for any "API key not valid" errors in your console logs

2. Make sure the `agent-artel.ts` utility and `config.ts` files are properly set up in your project.

3. **Restart your server** after making any changes to environment variables to ensure they're properly loaded.

## Step 1: Choose an AgentArtel Agent

Select an appropriate agent from the available AgentArtel agents:
- `sigmund-freud` - Psychoanalyst specializing in dream interpretation
- `uncle-bob` - Clean Code mentor for programming advice
- `history-mentor` - Expert on historical topics
- `science-mentor` - Expert on scientific topics
- `mental-health-guide` - Mental health and wellness advisor

## Step 2: Add the Agent to the Config File

1. Open `/main/utils/config.ts`
2. Add your agent to the `agents` object in the `agentArtel` section:

```typescript
// AgentArtel API configuration
agentArtel: {
  apiKey: process.env.AGENT_ARTEL_API_KEY || 'YOUR_API_KEY_HERE',
  baseUrl: process.env.AGENT_ARTEL_BASE_URL || 'https://agent-artel-production.up.railway.app',
  agents: {
    dreamInterpreter: process.env.AGENT_ARTEL_DREAM_INTERPRETER || 'sigmund-freud',
    cleanCodeMentor: process.env.AGENT_ARTEL_CLEAN_CODE_MENTOR || 'uncle-bob',
    // Add your new agent here:
    yourAgentName: process.env.AGENT_ARTEL_YOUR_AGENT_NAME || 'agent-id',
  }
},
```

## Step 3: Create the NPC Event File

### IMPORTANT: API Call Pattern

The most critical part of creating an AgentArtel-powered NPC is using the correct API call pattern. Based on our testing, you **MUST** use the direct agent ID string (not the config reference) in the `AgentArtel.chat()` method:

```typescript
// CORRECT - Working pattern (use this):
const agentResponse = await AgentArtel.chat(
    'agent-id-string', // Direct string like 'sigmund-freud' or 'uncle-bob'
    formattedUserMessage,
    limitedHistory
);

// INCORRECT - This pattern causes API key validation errors:
const agentResponse = await AgentArtel.chat(
    config.agentArtel.agents.agentName, // Using config reference doesn't work
    formattedUserMessage,
    limitedHistory
);
```

Create a new TypeScript file in the `/main/events/` directory with the following structure:

```typescript
import { RpgEvent, EventData, RpgPlayer, EventMode, Components } from '@rpgjs/server'
import { EmotionBubble } from '@rpgjs/plugin-emotion-bubbles'
import '../utils/npc-emotions' // Import to extend RpgEvent with showEmotionBubble
import { NpcEmotions } from '../utils/npc-emotions'
import { AgentArtel } from '../utils/agent-artel'
import { config } from '../utils/config'

// Variable name for storing conversation history
const HISTORY_VAR = 'YOUR_NPC_NAME_HISTORY'

@EventData({
    name: 'your-npc-name',  // Unique identifier for this NPC - MUST match map object name
    mode: EventMode.Shared,  // Visible to all players
    hitbox: {
        width: 32,
        height: 16
    }
})
export default class YourNpcNameEvent extends RpgEvent {
    onInit() {
        // Set the NPC's appearance - choose an appropriate sprite
        this.setGraphic('female') // or 'male', 'oldman', etc.
        
        // Add a visual indicator above the NPC
        this.setComponentsTop(Components.text('Your NPC Title'))
    }

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

    async onAction(player: RpgPlayer) {
        // Initialize conversation history if needed
        if (!player.getVariable(HISTORY_VAR)) {
            player.setVariable(HISTORY_VAR, []);
        }
        
        // Get conversation history
        const conversationHistory = player.getVariable(HISTORY_VAR) || [];
        
        // Initial greeting if this is the first interaction
        if (conversationHistory.length === 0) {
            this.showEmotionBubble(EmotionBubble.Exclamation);
            
            const greeting = "Hello there! I'm [Your NPC Name], the [NPC role]. How can I help you today?";
            
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
        
        // Show dialogue options - customize these based on your NPC's role
        const choice = await player.showChoices("What would you like to discuss?", [
            { text: "Topic 1", value: 'topic1' },
            { text: "Topic 2", value: 'topic2' },
            { text: "Topic 3", value: 'topic3' },
            { text: "Ask a custom question", value: 'custom' }
        ]);
        
        if (!choice) return;
        
        try {
            let userMessage = "";
            
            // Handle different dialogue options
            if (choice.value === 'topic1') {
                this.showEmotionBubble(EmotionBubble.Question);
                await player.showText("You'd like to discuss Topic 1? Great choice!", {
                    talkWith: this
                });
                
                userMessage = "Tell me about Topic 1";
            }
            else if (choice.value === 'topic2') {
                this.showEmotionBubble(EmotionBubble.Idea);
                await player.showText("Ah, Topic 2 is one of my favorites!", {
                    talkWith: this
                });
                
                userMessage = "I'd like to learn about Topic 2";
            }
            else if (choice.value === 'topic3') {
                this.showEmotionBubble(EmotionBubble.Exclamation);
                await player.showText("Topic 3 is quite fascinating!", {
                    talkWith: this
                });
                
                userMessage = "Please explain Topic 3 to me";
            }
            else if (choice.value === 'custom') {
                this.showEmotionBubble(EmotionBubble.Question);
                await player.showText("What would you like to know?", {
                    talkWith: this
                });
                
                // Get custom question from player
                const customInput = await player.showInputBox("Enter your question:", {
                    length: 200,
                    variable: true
                });
                
                if (!customInput || customInput.trim() === '') {
                    await player.showText("Hmm, it seems you're not sure what to ask. Take your time.", {
                        talkWith: this
                    });
                    return;
                }
                
                userMessage = customInput;
            }
            
            // Add user message to history
            conversationHistory.push({
                role: 'user',
                content: userMessage
            });
            
            // Show thinking emotion while waiting for API response
            this.showEmotionBubble(EmotionBubble.ThreeDot);
            await player.showText("Let me think about that for a moment...", {
                talkWith: this
            });
            
            // Limit history to last 10 messages to prevent context overflow
            const limitedHistory = conversationHistory.slice(-10);
            
            // Format the user message with instructions for proper formatting
            const formattedUserMessage = `${userMessage}\n\nIMPORTANT: Please format your response as plain text without markdown formatting. Do not use headers (##), bold (**text**), or other markdown. Keep paragraphs short (2-3 sentences max) for better readability in a dialogue box. Use simple language and natural speech patterns. For actions, use *asterisks* like *adjusts glasses* which will be preserved.`;
            
            // Get response from the agent
            // Ensure 'yourAgentName' (e.g., 'dreamInterpreter', 'cleanCodeMentor') is defined in your main/utils/config.ts
            // and corresponds to the correct Agent ID string on the AgentArtel platform.
            const agentResponse = await AgentArtel.chat(
                config.agentArtel.agents.yourAgentName, // Replace 'yourAgentName' with the key from your config
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
            await player.showText("I seem to be having trouble collecting my thoughts. Let's talk again later.", {
                talkWith: this
            });
        }
    }
}
```

## Step 4: Add the NPC to Your Map

1. Open your map file (e.g., `/main/worlds/maps/simplemap.tmx`)
2. Add a new object to the object layer with the same name as specified in your `@EventData` decorator:

```xml
<object id="[unique-id]" name="your-npc-name" x="[x-position]" y="[y-position]">
  <point/>
</object>
```

Example:
```xml
<object id="25" name="your-npc-name" x="450" y="320">
  <point/>
</object>
```

## Step 5: Test Your AI-Powered NPC

1. Start your game server:
   ```
   npm run dev
   ```

2. Open your browser and navigate to the local URL (typically http://localhost:3000)
3. Find your NPC in the game world and interact with it
4. Test different dialogue options and verify that the AI responses are working correctly

## Customization Options

### Emotion Bubbles

The NPC can display different emotion bubbles based on the context:

```typescript
// Available emotions:
EmotionBubble.Happy       // Happy face
EmotionBubble.Sad         // Sad face
EmotionBubble.Exclamation // Exclamation mark
EmotionBubble.Question    // Question mark
EmotionBubble.Music       // Music note
EmotionBubble.Love        // Heart
EmotionBubble.Angry       // Angry face
EmotionBubble.Sweat       // Sweat drop
EmotionBubble.Tired       // ZZZ (sleeping)
EmotionBubble.Confusion   // Confusion spiral
EmotionBubble.Silence     // ...
EmotionBubble.Light       // Light bulb
EmotionBubble.ThreeDot    // Three dots (loading)
EmotionBubble.Idea        // Idea light bulb
EmotionBubble.Like        // Thumbs up
```

### Dialogue Options

Customize the dialogue options based on your NPC's role and personality:

```typescript
const choice = await player.showChoices("What would you like to discuss?", [
    { text: "Your specific topic 1", value: 'topic1' },
    { text: "Your specific topic 2", value: 'topic2' },
    { text: "Your specific topic 3", value: 'topic3' },
    { text: "Ask a custom question", value: 'custom' }
]);
```

### Appearance

Set the NPC's appearance using the available sprites:

```typescript
this.setGraphic('female')  // Female character
this.setGraphic('male')    // Male character
this.setGraphic('oldman')  // Elderly male character
// Other available sprites...
```

## Troubleshooting

### API Key Issues

If you encounter "API key not valid" errors:

1. **Verify your API key**:
   - Check that your `.env` file contains the correct `AGENT_ARTEL_API_KEY`
   - Ensure there are no extra spaces or special characters in the API key
   - Verify the API key is active in your AgentArtel account dashboard

2. **Test the API key directly**:
   ```bash
   curl -X POST \
     -H "Content-Type: application/json" \
     -H "x-api-key: YOUR_API_KEY" \
     -d '{"messages": [{"role": "user", "content": "Hello"}]}' \
     https://agent-artel-production.up.railway.app/api/chat/sigmund-freud
   ```

3. **Check environment variable loading**:
   - Verify that `dotenv` is properly configured in your project
   - Add console logs to check if the API key is being loaded: `console.log('API KEY:', config.agentArtel.apiKey)`
   - Make sure you're not accidentally using a placeholder or default value

4. **Restart your server**:
   - Always restart your server after making changes to environment variables
   - Use `npm run dev` to restart with the latest environment variables

5. **Check for API rate limits**:
   - Some APIs have rate limits that might cause authentication errors
   - Check if you've exceeded your quota or plan limits

6. **Try a different agent**:
   - If one agent isn't working, try a different one to isolate the issue
   - The Dream Interpreter (sigmund-freud) agent is known to work well for testing

7. **Verify Agent ID and Permissions on AgentArtel Platform**:
   - Log in to your AgentArtel dashboard.
   - Confirm the exact, case-sensitive Agent IDs for the NPCs you are trying to use (e.g., `uncle-bob`, `history-mentor`).
   - Ensure your API key has explicit permissions granted to access these specific Agent IDs on the AgentArtel platform. Some platforms require you to enable agents per API key.
   - If the Agent IDs are correct and you believe your key should have access, contact AgentArtel support for assistance.

### NPC Not Appearing

If your NPC doesn't appear on the map:
1. Ensure the `name` in the `@EventData` decorator matches exactly with the `name` attribute in the map object
2. Check that the object is properly placed within the `<objectgroup>` tags in the TMX file
3. Verify the X and Y coordinates are within the visible map area

### Agent Not Responding

If the agent doesn't provide responses:
1. Check the console logs for any API errors
2. Verify that the agent ID is correct in your config file
3. Ensure you're using the direct config reference pattern: `config.agentArtel.agents.yourAgentName`
4. Test with a known working agent like 'sigmund-freud' temporarily

## Example: Dream Interpreter NPC

For a complete working example, refer to the Dream Interpreter NPC implementation in `/main/events/dream-interpreter.ts` which uses the Sigmund Freud agent to interpret dreams and discuss the unconscious mind.
