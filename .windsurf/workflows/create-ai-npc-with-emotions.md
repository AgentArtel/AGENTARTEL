---
description: How to create AgentDock AI-powered NPCs with dynamic dialogue and emotion bubbles in RPGJS.
---

# Creating AgentDock AI NPCs with Dynamic Dialogue & Emotion Bubbles

This workflow guides you through creating NPCs in your RPGJS game that generate dynamic dialogue using **AgentDock** as the AI backend and display appropriate emotion bubbles during conversations.

## Prerequisites

1.  **RPGJS Project:** Your `/Users/satorisan/Desktop/RPGJS_TEST/ARTELIO/` project.
2.  **Emotion Bubbles Plugin:**
    *   If not installed: In your ARTELIO project root, run `npx rpgjs add @rpgjs/plugin-emotion-bubbles`.
3.  **NPC Emotions Utility:** (See Step 1 below).
4.  **AgentDock Backend Setup:** Configured as per the `create_ai_agent.md` workflow. This includes having an AgentDock agent defined with a `template.json`.
5.  **Environment Variables:** Set up in `/Users/satorisan/Desktop/RPGJS_TEST/ARTELIO/.env` for AgentDock integration (e.g., `AGENTDOCK_CHAT_API_BASE_URL`, `AGENTDOCK_ACCESS_KEY`), loaded via `/Users/satorisan/Desktop/RPGJS_TEST/ARTELIO/main/utils/config.ts`.

## Step 1: Set Up the NPC Emotions Utility

This utility helps map emotion cues (strings) from the AI to RPGJS `EmotionBubble` enum values. Create or verify this file:

```typescript
// /Users/satorisan/Desktop/RPGJS_TEST/ARTELIO/main/utils/npc-emotions.ts
import { RpgEvent } from '@rpgjs/server'
import { EmotionBubble } from '@rpgjs/plugin-emotion-bubbles'

// Extend RpgEvent to add showEmotionBubble method for NPCs
declare module '@rpgjs/server' {
    export interface RpgEvent {
        showEmotionBubble: (emotion: string | EmotionBubble) => void
    }
}

RpgEvent.prototype.showEmotionBubble = function(emotion: string | EmotionBubble) {
    // This assumes 'bubble' is a defined animation name for your NPC sprite that can take an emotion type.
    // If your sprite setup is different, you might need to adjust this or use a different animation method.
    this.showAnimation('bubble', emotion) 
}

export const NpcEmotions = {
    mapWebhookEmotion(emotion: string): EmotionBubble {
        const emotionLower = emotion.toLowerCase().trim();
        switch (emotionLower) {
            case 'think':
            case 'thinking':
            case 'idea':
                return EmotionBubble.Idea;
            case 'question':
            case 'curious':
                return EmotionBubble.Question;
            case 'like':
            case 'love':
                return EmotionBubble.Like;
            case 'surprise':
            case 'shocked':
            case 'omg':
                return EmotionBubble.Surprise;
            case 'sad':
            case 'unhappy':
            case 'crying':
                return EmotionBubble.Sad;
            case 'happy':
            case 'joyful':
            case 'excited':
            case 'laughing':
                return EmotionBubble.Happy;
            case 'confused':
            case 'confusion':
            case 'hmm':
                return EmotionBubble.Confusion;
            case 'exclamation':
            case 'aha':
            case 'important':
                return EmotionBubble.Exclamation;
            case 'clock':
            case 'time':
            case 'waiting':
            case 'processing': // Good for when AI is 'thinking'
                return EmotionBubble.ThreeDot;
            default:
                console.warn(`[NpcEmotions] Unknown emotion cue: '${emotion}'. Defaulting to Idea.`);
                return EmotionBubble.Idea; // Default emotion
        }
    }
}

export default NpcEmotions;
```
**Note:** Ensure your NPC sprites have an animation named `bubble` compatible with the `EmotionBubble` types, or adjust `RpgEvent.prototype.showEmotionBubble` accordingly.

## Step 2: Configure Agent Personality for Emotions (AgentDock `template.json`)

To enable dynamic emotions, you need to instruct your AgentDock AI (via its `template.json`) to provide emotion cues.

1.  **Locate your agent's `template.json`** in your `Agent-artel-Dock/agents/your-agent-id/` directory.
2.  **Modify the `personality` field** to include instructions for providing emotion cues. Aim for structured output if possible, or specific text patterns.

    **Example `personality` instruction for structured emotion cues:**
    ```json
    // In template.json -> personality field (append this to existing personality description)
    "When you respond, I want you to include an 'emotion_cue' if it's natural for the context. Format this as part of a JSON object within your main content if possible, like: {\"text\": \"Your dialogue here.\", \"emotion_cue\": \"happy\"}. Valid emotion cues include: think, idea, question, like, surprise, sad, happy, confused, exclamation, processing. If you cannot provide a JSON structure, you can embed it in text like [emotion:happy]."
    ```
    **Alternatively, for text-based cues (simpler for some LLMs):**
    ```json
    // In template.json -> personality field
    "When you respond, if appropriate, embed an emotion cue in your text like [emotion:happy] or (feeling:curious). Use cues like: think, idea, question, like, surprise, sad, happy, confused, exclamation, processing."
    ```
3.  **Save `template.json`** and remember to **re-bundle and restart your AgentDock server** (`npm run prebuild` then `npm run dev` in AgentDock project root) for changes to take effect.

## Step 3: Create the Emotional AI NPC Event (RPGJS)

Create a new TypeScript file in `/Users/satorisan/Desktop/RPGJS_TEST/ARTELIO/main/events/` (e.g., `EmotionalAgentNpcEvent.ts`). This script will handle AgentDock communication and emotion display.

```typescript
// /Users/satorisan/Desktop/RPGJS_TEST/ARTELIO/main/events/EmotionalAgentNpcEvent.ts
import { RpgEvent, EventData, RpgPlayer, EventMode, Components } from '@rpgjs/server';
import { config } from '../utils/config'; // Your project's config utility
import { EmotionBubble } from '@rpgjs/plugin-emotion-bubbles';
import '../utils/npc-emotions'; // Import to extend RpgEvent with showEmotionBubble
import { NpcEmotions } from '../utils/npc-emotions';

// Define a type for the expected AI response structure from AgentDock (Vercel AI SDK based)
interface AgentDockStreamChunk {
    choices?: Array<{
        delta?: {
            content?: string;
            tool_calls?: Array<{
                index: number;
                id: string;
                type: 'function';
                function: {
                    name: string;
                    arguments: string; // JSON string
                };
            }>;
        };
        finish_reason?: string | null; // e.g., "stop", "tool_calls"
    }>;
    // For structured emotion cues sent as a separate JSON object in the stream (if applicable)
    emotion_cue?: string;
}

// Define a type for the accumulated AI response content
interface AccumulatedAiResponse {
    text: string;
    emotion_cue?: string;
    tool_calls?: Array<{
        id: string;
        type: 'function';
        function: {
            name: string;
            arguments: any; // Parsed JSON
        };
    }>;
}

@EventData({
    name: 'emotional-agent-npc', // CHANGE THIS to a unique event name for TMX maps
    mode: EventMode.Shared,
    hitbox: { width: 32, height: 16 }
})
export default class EmotionalAgentNpcEvent extends RpgEvent {
    private agentKeyInConfig: string = 'yourAgentKey'; // CHANGE THIS to the key you defined in config.ts for this agent

    onInit() {
        this.setGraphic('female'); // CHANGE THIS: e.g., 'female', 'male', 'custom_sprite_id'
        this.setComponentsTop(Components.text('Emotional AI')); // CHANGE THIS: NPC's display name
    }

    async onAction(player: RpgPlayer) {
        const HISTORY_VAR = `${this.agentKeyInConfig.toUpperCase()}_EMOTE_HISTORY`; // Unique history variable
        let conversationHistory: any[] = player.getVariable(HISTORY_VAR) || [];

        if (conversationHistory.length === 0) {
            const initialGreeting = "Hello! I can express my feelings. How can I help you today?"; // CHANGE THIS
            this.showEmotionBubble(NpcEmotions.mapWebhookEmotion('happy'));
            await player.showText(initialGreeting, { talkWith: this });
            conversationHistory.push({ role: 'assistant', content: initialGreeting });
            player.setVariable(HISTORY_VAR, conversationHistory);
        }

        const choice = await player.showChoices("What's on your mind?", [
            { text: "Ask something specific", value: 'custom' },
            { text: "How are you feeling?", value: 'feeling' },
            { text: "Nothing, goodbye.", value: 'goodbye' }
        ]);

        if (!choice || choice.value === 'goodbye') {
            this.showEmotionBubble(NpcEmotions.mapWebhookEmotion('sad'));
            await player.showText("Farewell for now!", { talkWith: this });
            return;
        }

        let userMessageContent = "";
        if (choice.value === 'custom') {
            const customInput = await player.showInputBox("What would you like to ask or say?", { talkWith: this });
            if (!customInput || customInput.trim() === "") {
                this.showEmotionBubble(NpcEmotions.mapWebhookEmotion('question'));
                await player.showText("Lost in thought? Come back when you're ready.", { talkWith: this });
                return;
            }
            userMessageContent = customInput;
        } else if (choice.value === 'feeling') {
            userMessageContent = "How are you feeling right now?";
        }
        
        this.showEmotionBubble(NpcEmotions.mapWebhookEmotion('processing')); // Show 'thinking' bubble
        conversationHistory.push({ role: 'user', content: userMessageContent });

        try {
            const agentDockUrl = config.getAgentDockChatUrl(this.agentKeyInConfig);
            const response = await fetch(agentDockUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.agentDock.accessKey}`
                },
                body: JSON.stringify({ messages: conversationHistory, stream: true }) // Use streaming
            });

            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`AgentDock API Error: ${response.status} ${response.statusText} - ${errorBody}`);
            }

            if (!response.body) {
                throw new Error('AgentDock API Error: Response body is null.');
            }

            const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
            let accumulatedResponse: AccumulatedAiResponse = { text: '' };
            let partialChunk = ''; // Buffer for incomplete JSON chunks

            // Display initial "NPC is thinking..." or similar, then replace with streamed content
            const thinkingMessage = await player.showText("...", { talkWith: this, animate: false }); // Show placeholder

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                partialChunk += value;
                
                // Process lines (Vercel AI SDK streams data line by line, prefixed)
                let lines = partialChunk.split('\n');
                for (let i = 0; i < lines.length -1; i++) { // Keep last line in partialChunk if incomplete
                    const line = lines[i].trim();
                    if (line.startsWith('0:"') && line.endsWith('"')) { // Vercel AI SDK text chunk (older format)
                        try {
                            const textContent = JSON.parse(line.substring(2)); // Remove 0: prefix and parse
                            accumulatedResponse.text += textContent;
                        } catch (e) { console.error("Error parsing Vercel text chunk:", e, "Line:", line); }
                    } else if (line.startsWith('data: ')) { // Standard SSE or Vercel AI SDK JSON chunk
                        const jsonDataString = line.substring(5).trim(); // Remove 'data: ' prefix
                        if (jsonDataString === '[DONE]') { // Stream finished by Vercel
                            break; 
                        }
                        try {
                            const chunk: AgentDockStreamChunk = JSON.parse(jsonDataString);
                            
                            if (chunk.choices && chunk.choices[0]?.delta?.content) {
                                accumulatedResponse.text += chunk.choices[0].delta.content;
                            }
                            if (chunk.choices && chunk.choices[0]?.delta?.tool_calls) {
                                if (!accumulatedResponse.tool_calls) accumulatedResponse.tool_calls = [];
                                chunk.choices[0].delta.tool_calls.forEach(tc => {
                                    // Accumulate tool call parts if they arrive in fragments (less common for the whole object)
                                    // For simplicity, this example assumes tool_calls arrive mostly complete per chunk or are re-assembled by AgentDock before this.
                                    // A more robust solution might involve accumulating tc.function.arguments if it's streamed fragmentally.
                                    try {
                                        accumulatedResponse.tool_calls!.push({
                                            id: tc.id,
                                            type: tc.type,
                                            function: {
                                                name: tc.function.name,
                                                arguments: JSON.parse(tc.function.arguments) // Parse arguments string to JSON
                                            }
                                        });
                                    } catch (e) {
                                        console.error("Error parsing tool call arguments:", e, "Arguments:", tc.function.arguments);
                                    }
                                });
                            }
                            if (chunk.emotion_cue) { // If emotion cue is sent as a separate field in the stream
                                accumulatedResponse.emotion_cue = chunk.emotion_cue;
                                this.showEmotionBubble(NpcEmotions.mapWebhookEmotion(accumulatedResponse.emotion_cue));
                            }
                        } catch (e) { console.error("Error parsing AgentDock JSON chunk:", e, "Line:", line); }
                    }
                }
                partialChunk = lines[lines.length - 1]; // Keep the last potentially incomplete line

                // Update displayed text progressively
                if (thinkingMessage && thinkingMessage.id) {
                    player.showText(accumulatedResponse.text + "...", { talkWith: this, animate: false, messageId: thinkingMessage.id });
                }
            }
            
            // Final processing after stream ends
            if (thinkingMessage && thinkingMessage.id) { // Remove the "..." from the final message
                 player.showText(accumulatedResponse.text, { talkWith: this, animate: false, messageId: thinkingMessage.id });
            } else { // Fallback if thinkingMessage wasn't set
                 await player.showText(accumulatedResponse.text, { talkWith: this });
            }

            // Attempt to parse emotion from text if not already found from structured cue
            if (!accumulatedResponse.emotion_cue && accumulatedResponse.text) {
                const emotionMatch = accumulatedResponse.text.match(/\[emotion:(\w+)\]/i);
                if (emotionMatch && emotionMatch[1]) {
                    accumulatedResponse.emotion_cue = emotionMatch[1];
                    // Optionally remove the cue from the displayed text if you haven't already
                    // accumulatedResponse.text = accumulatedResponse.text.replace(emotionMatch[0], '').trim();
                    // player.showText(accumulatedResponse.text, { talkWith: this, animate: false, messageId: thinkingMessage?.id }); // Re-render if text changed
                }
            }

            // Display emotion bubble based on final cue
            if (accumulatedResponse.emotion_cue) {
                this.showEmotionBubble(NpcEmotions.mapWebhookEmotion(accumulatedResponse.emotion_cue));
            } else {
                 this.showEmotionBubble(NpcEmotions.mapWebhookEmotion('happy')); // Default if no cue
            }

            conversationHistory.push({ role: 'assistant', content: accumulatedResponse.text, tool_calls: accumulatedResponse.tool_calls });

            // Handle tool calls if any were detected
            if (accumulatedResponse.tool_calls && accumulatedResponse.tool_calls.length > 0) {
                await player.showText("It seems I need to use a special skill for that...", { talkWith: this });
                this.showEmotionBubble(NpcEmotions.mapWebhookEmotion('idea'));
                // Note: Actual tool execution (calling external APIs, processing results, sending back to AgentDock)
                // is a complex step. Refer to the `create_ai_agent.md` workflow for detailed implementation patterns
                // similar to `SeraphinaStarWeaverEvent.ts` or `AuraWeaverElaraEvent.ts`.
                // For this emotional NPC, we are just acknowledging the tool call.
                // Example:
                // for (const toolCall of accumulatedResponse.tool_calls) {
                //     await player.showText(`I'm thinking about using my '${toolCall.function.name}' skill.`, { talkWith: this });
                // }
                //
                // To make the agent continue after a tool call, you would typically:
                // 1. Execute the tool (e.g., call another API).
                // 2. Construct a "tool result" message.
                // 3. Send this result back to AgentDock in a new API call, including the conversation history.
                //    conversationHistory.push({ role: 'tool', tool_call_id: toolCall.id, name: toolCall.function.name, content: JSON.stringify(toolResult) });
                //    // ... then make another fetch call to AgentDock with the updated history ...
            }

            if (conversationHistory.length > 10) { // Limit history
                conversationHistory.splice(0, conversationHistory.length - 10);
            }
            player.setVariable(HISTORY_VAR, conversationHistory);
            
            // No automatic "Is there anything else?" to allow natural conversation flow after tool call note or regular response.
            // Player can re-engage.

        } catch (error: any) {
            console.error('Error in EmotionalAgentNpcEvent onAction:', error);
            this.showEmotionBubble(EmotionBubble.Sad);
            await player.showText(
                `I apologize, but I'm having trouble with my thoughts right now. ${error.message ? `Details: ${error.message}` : ''} Perhaps we can talk later?`,
                { talkWith: this }
            );
        }
    }
}
```

## Step 4: Add the NPC to Your Map

Open your map file (e.g., `/Users/satorisan/Desktop/RPGJS_TEST/ARTELIO/main/worlds/maps/simplemap.tmx`) and add the NPC object to an object layer. Ensure the `name` attribute matches the `name` you defined in the `@EventData` decorator of your `EmotionalAgentNpcEvent.ts` file.

```xml
<!-- Example: Add this INSIDE an <objectgroup> tag -->
<object id="[unique-id]" name="your-emotional-agent-npc-name" x="[x-position]" y="[y-position]">
  <point/>
</object>
```

**Key points:**
*   Replace `[unique-id]` with a unique number for this object on the map.
*   Replace `your-emotional-agent-npc-name` with the exact name from `@EventData` (e.g., `emotional-agent-npc` if you didn't change the default in the example script).
*   Replace `[x-position]` and `[y-position]` with the desired coordinates on your map.
*   The object must be inside an `<objectgroup>`.
*   The `<point/>` tag is required for point objects.

## Step 5: Configure AgentDock Integration (RPGJS)

Your `EmotionalAgentNpcEvent.ts` script relies on settings from `/Users/satorisan/Desktop/RPGJS_TEST/ARTELIO/main/utils/config.ts` to connect to AgentDock. Ensure this configuration is correctly set up:

1.  **Environment Variables (`.env` file):**
    Make sure your `/Users/satorisan/Desktop/RPGJS_TEST/ARTELIO/.env` file contains the necessary AgentDock variables:
    ```env
    AGENTDOCK_CHAT_API_BASE_URL=http://localhost:3000/api/chat
    AGENTDOCK_ACCESS_KEY=your_agentdock_access_key_here
    ```
    *   Replace `your_agentdock_access_key_here` with your actual AgentDock access key if you've configured one in AgentDock's `.env.local`.

2.  **Configuration Utility (`config.ts`):
    Verify that `/Users/satorisan/Desktop/RPGJS_TEST/ARTELIO/main/utils/config.ts` loads these environment variables and makes them available. It should have a structure similar to this for AgentDock:

    ```typescript
    // /Users/satorisan/Desktop/RPGJS_TEST/ARTELIO/main/utils/config.ts
    import dotenv from 'dotenv';
    dotenv.config();

    export const config = {
        // ... other configurations ...

        agentDock: {
            chatApiBaseUrl: process.env.AGENTDOCK_CHAT_API_BASE_URL || 'http://localhost:3000/api/chat',
            accessKey: process.env.AGENTDOCK_ACCESS_KEY || '', // Provide a default or ensure it's set
            // You might have specific agent keys defined here too, e.g.:
            // yourAgentKey: process.env.AGENTDOCK_YOUR_AGENT_KEY_ID || 'default-agent-id',
        },

        // Helper function to get the full chat URL for a specific agent
        getAgentDockChatUrl(agentIdKey: string): string {
            // Assuming agentIdKey is the key in config.agentDock that holds the actual Agent ID
            // For example, if you store agent IDs like: config.agentDock.myEmotionalAgent = 'emotional-agent-guid'
            // Then you'd pass 'myEmotionalAgent' as agentIdKey.
            // For the example script, it uses `this.agentKeyInConfig` which you'd set to something like 'myEmotionalAgent'.
            // This function needs to resolve that key to an actual agent ID string.
            // This is a placeholder; adapt based on how you store/retrieve specific agent IDs.
            const agentId = (this.agentDock as any)[agentIdKey] || agentIdKey; // Fallback to using the key directly if not found
            return `${this.agentDock.chatApiBaseUrl}/${agentId}`;
        }
        // ... other configurations ...
    };
    ```
    *   **Important:** The `getAgentDockChatUrl` function in `config.ts` needs to correctly resolve the `agentKeyInConfig` from your event script to the actual Agent ID used in the AgentDock API path. Adjust this function based on how you manage multiple AgentDock agent IDs in your `config.ts`.
    *   Remember to set `this.agentKeyInConfig` in `EmotionalAgentNpcEvent.ts` to the correct key you use in `config.ts` to identify this specific emotional agent (e.g., `'myEmotionalAgentIdFromConfig'`).

## Step 6: Understanding AgentDock Streamed Responses

The `EmotionalAgentNpcEvent.ts` script is designed to handle streamed responses from AgentDock, which typically follow the Vercel AI SDK format. Here's what to expect:

*   **Stream Chunks:** The AI's response arrives in multiple chunks over the network.
*   **Text Content:** `delta.content` within a `choice` usually contains parts of the AI's text message.
*   **Emotion Cues:**
    *   **Structured:** If your AgentDock agent's `template.json` is prompted to provide a structured `emotion_cue` (e.g., as a top-level field in the JSON objects it streams, or within a specific data structure), the script attempts to parse it.
    *   **Text-Embedded:** If the AI embeds cues like `[emotion:happy]` in its text, the script also tries to extract these after the full text is assembled.
*   **Tool Calls:** If the AI decides to use a tool, `delta.tool_calls` will appear in the stream, containing the tool name and arguments. The example script detects these but notes that full execution requires more complex logic (see `create_ai_agent.md`).
*   **Stream Termination:** The stream ends, often indicated by a `[DONE]` message if using certain SDK wrappers or by the `finish_reason` in a chunk.

The script accumulates text, identifies emotion cues, and detects tool calls as these chunks arrive.

## Step 7: Test Your NPC

1.  **Restart Servers:** Ensure both your AgentDock server and RPGJS game server are running with the latest changes.
    *   AgentDock: `npm run prebuild` (if `template.json` changed) then `npm run dev` in the AgentDock project directory.
    *   RPGJS: `npm run dev` in your `/Users/satorisan/Desktop/RPGJS_TEST/ARTELIO/` project directory.
2.  **Navigate to NPC:** Go to the map where you placed your emotional AI NPC.
3.  **Interact:** Press the action key (e.g., Space or Enter).
4.  **Verify Dialogue & Emotions:**
    *   Check if the initial greeting and subsequent AI responses appear correctly.
    *   Observe if emotion bubbles are displayed and correspond to the AI's dialogue context or explicit cues.
    *   Test different dialogue choices.
5.  **Check for Tool Call Acknowledgment (If Applicable):**
    *   If you configured your agent's personality to use tools and provide a scenario that triggers one, check if the NPC acknowledges the intent to use a tool (as per the example script's placeholder logic).
6.  **Monitor Logs:**
    *   **RPGJS Server Console:** Look for any errors related to API calls, response parsing, or event logic.
    *   **Browser Developer Console:** Check for client-side errors or issues with GUI components.
    *   **AgentDock Server Console:** Monitor for logs related to the agent's processing, tool use, or any errors on the backend.

## Step 8: Troubleshooting

*   **NPC Doesn't Appear/Interact:**
    *   Verify the `name` in `@EventData` matches the object name in your TMX map file.
    *   Ensure the NPC event file is in `/Users/satorisan/Desktop/RPGJS_TEST/ARTELIO/main/events/` and RPGJS is picking it up (autoloading should handle this).
*   **No Emotion Bubbles:**
    *   Ensure `@rpgjs/plugin-emotion-bubbles` is installed and added to your game.
    *   Verify `npc-emotions.ts` utility is correctly imported and `showEmotionBubble` is working.
    *   Check if your AgentDock agent is providing emotion cues (via `template.json` personality prompt) and if the event script is parsing them.
*   **API Errors / No AI Response:**
    *   Double-check `AGENTDOCK_CHAT_API_BASE_URL` and `AGENTDOCK_ACCESS_KEY` in your `/Users/satorisan/Desktop/RPGJS_TEST/ARTELIO/.env` file.
    *   Ensure `config.ts` correctly loads and provides these to the event script.
    *   Verify the `agentKeyInConfig` in the event script matches a valid agent identifier known to your AgentDock setup and `config.ts`.
    *   Check the AgentDock server console for errors. Is the agent running? Is it receiving requests?
*   **Streaming Issues / Garbled Text:**
    *   Review the stream parsing logic in `EmotionalAgentNpcEvent.ts`. Ensure it correctly handles the format of data chunks from your AgentDock setup.
*   **Tool Calls Not Acknowledged:**
    *   Confirm your AgentDock agent's `template.json` is configured to use tools and its personality prompts it to do so.
    *   Check the stream parsing for `tool_calls` data.

## Step 9: Available Emotion Bubbles

The emotion bubbles plugin provides these standard emotions (from `@rpgjs/plugin-emotion-bubbles`):

```typescript
export enum EmotionBubble {
    Like = 'like',
    Confusion = 'confusion',
    Question = 'question',
    LikeBreak = 'like-break',
    // Note: 'Exclamation' in the enum might map to 'surprise' graphic or similar depending on spritesheet.
    // The example uses EmotionBubble.Surprise for 'surprise' and EmotionBubble.Exclamation for 'exclamation'.
    // Adjust NpcEmotions.mapWebhookEmotion if your sprite mappings differ.
    Surprise = 'surprise', // Often used for general surprise/exclamation
    Exclamation = 'exclamation', // Can be a more specific exclamation mark
    OneDot = 'one-dot',
    TwoDot = 'two-dot',
    ThreeDot = 'three-dot', // Good for 'processing' or 'thinking'
    Dollar = 'dollar',
    Stars = 'starts', // Typo in original enum? Often 'stars'.
    Music = 'music',
    Jaded = 'jaded',
    Star = 'star',
    HaHa = 'haha',
    Sad = 'sad',
    Hangry = 'hungry', // Typo in original enum? Often 'angry' or 'hungry'.
    Idea = 'idea',
    Z = 'z',
    zZ = 'zz',
    Likes = 'likes',
    Empty = 'empty',
    Circle = 'circle',
    Hangry2 = 'hungry2',
    Cross = 'cross',
    Bead = 'bead',
    Beads = 'beads',
    Happy = 'happy',
    Cloud = 'cloud'
}
```

You can use any of these emotions in your NPC's dialogue by calling `this.showEmotionBubble(NpcEmotions.mapWebhookEmotion('your_cue_here'))` or directly with `this.showEmotionBubble(EmotionBubble.SpecificEmotionName)` if not mapping from a string cue.

