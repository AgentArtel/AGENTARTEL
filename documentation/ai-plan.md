ARTELIO Project Enhancement Plan
## 1. Project Overview
ARTELIO is an RPG-JS game featuring AI-powered NPCs and dynamic environments. The project leverages external APIs for generating dialogue and artwork, creating a unique and engaging player experience.

## 2. Current Implementation
- Environment variables for external API integration
- AI-powered NPCs (Artist and Philosopher)
- Emotion bubbles for NPCs
- Custom artwork viewing system
- Basic map in simplemap2.tmx
## 3. Enhancement Plan
### 3.1 Improved AI NPC Framework
```typescript
// main/utils/ai-npc.ts
import axios from 'axios';
import { RpgEvent, RpgPlayer } from '@rpgjs/server';
import { config } from './config';
import { EmotionBubble } from './emotion-bubbles';

/**
 * Base class for AI-powered NPCs
 * Provides common functionality for API communication and dialogue handling
 */
export class AiNpcBase extends RpgEvent {
    // Maximum conversation history to store
    protected readonly MAX_HISTORY_LENGTH = 10;
    
    // NPC personality description for API context
    protected personalityDescription: string = 'A friendly NPC';
    
    // Webhook URL for dialogue generation
    protected dialogueWebhookUrl: string = config.webhooks.npcDialogue;
    
    /**
     * Initialize conversation history in player variables if not present
     * @param player The player to initialize history for
     * @param historyKey The variable key for storing history
     */
    protected initConversationHistory(player: RpgPlayer, historyKey: string): void {
        if (!player.getVariable(historyKey)) {
            player.setVariable(historyKey, []);
        }
    }
    
    /**
     * Add a message to the conversation history
     * @param player The player to update history for
     * @param historyKey The variable key for storing history
     * @param role The role of the message sender ('user' or 'assistant')
     * @param content The message content
     */
    protected addToHistory(player: RpgPlayer, historyKey: string, role: 'user' | 'assistant', content: string): void {
        const history = player.getVariable(historyKey) || [];
        
        // Add new message
        history.push({ role, content });
        
        // Limit history length
        if (history.length > this.MAX_HISTORY_LENGTH) {
            history.shift();
        }
        
        player.setVariable(historyKey, history);
    }
    
    /**
     * Generate dialogue response from AI API
     * @param player The player interacting with the NPC
     * @param userMessage The player's message
     * @param historyKey The variable key for storing history
     * @returns The generated response
     */
    protected async generateDialogueResponse(
        player: RpgPlayer, 
        userMessage: string, 
        historyKey: string
    ): Promise<string> {
        try {
            // Initialize history if needed
            this.initConversationHistory(player, historyKey);
            
            // Add user message to history
            this.addToHistory(player, historyKey, 'user', userMessage);
            
            // Show thinking emotion while waiting for API
            this.showEmotionBubble(EmotionBubble.Thinking);
            
            // Get conversation history
            const history = player.getVariable(historyKey) || [];
            
            // Make API request
            const response = await axios.post(this.dialogueWebhookUrl, {
                messages: [
                    // System message with NPC personality
                    { role: 'system', content: this.personalityDescription },
                    // Conversation history
                    ...history
                ]
            });
            
            // Parse response
            const aiResponse = response.data.choices[0].message.content;
            
            // Add assistant response to history
            this.addToHistory(player, historyKey, 'assistant', aiResponse);
            
            // Show happy emotion after successful response
            this.showEmotionBubble(EmotionBubble.Happy);
            
            return aiResponse;
        } catch (error) {
            console.error('Error generating dialogue:', error);
            
            // Show confused emotion on error
            this.showEmotionBubble(EmotionBubble.Confused);
            
            // Return fallback response
            return "I'm sorry, I'm having trouble finding the right words. Let's talk about something else.";
        }
    }
    
    /**
     * Show dialogue in chunks if it's too long
     * @param player The player to show text to
     * @param text The text to show
     * @param options Options for showText
     */
    protected async showDialogueInChunks(
        player: RpgPlayer, 
        text: string, 
        options: any = { talkWith: this }
    ): Promise<void> {
        // Split text into chunks of max 150 characters, at sentence boundaries
        const chunks = this.splitTextIntoChunks(text, 150);
        
        // Show each chunk
        for (const chunk of chunks) {
            await player.showText(chunk, options);
        }
    }
    
    /**
     * Split text into chunks at sentence boundaries
     * @param text The text to split
     * @param maxLength Maximum length of each chunk
     * @returns Array of text chunks
     */
    private splitTextIntoChunks(text: string, maxLength: number): string[] {
        const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
        const chunks: string[] = [];
        let currentChunk = '';
        
        for (const sentence of sentences) {
            if (currentChunk.length + sentence.length <= maxLength) {
                currentChunk += sentence;
            } else {
                if (currentChunk) {
                    chunks.push(currentChunk);
                }
                currentChunk = sentence;
            }
        }
        
        if (currentChunk) {
            chunks.push(currentChunk);
        }
        
        return chunks;
    }
    
    /**
     * Show emotion bubble above NPC
     * @param emotion The emotion to display
     */
    protected showEmotionBubble(emotion: EmotionBubble): void {
        // Implementation should be provided by the emotion-bubbles utility
    }
}
### 3.2 Enhanced Philosopher NPC
```typescript
// main/events/philosopher.ts
import { RpgEvent, EventData, RpgPlayer, EventMode } from '@rpgjs/server';
import { Components } from '@rpgjs/client';
import { AiNpcBase } from '../utils/ai-npc';
import { EmotionBubble } from '../utils/emotion-bubbles';
import { config } from '../utils/config';

@EventData({
    name: 'village-philosopher',
    mode: EventMode.Shared,
    hitbox: {
        width: 32,
        height: 16
    }
})
export default class PhilosopherEvent extends AiNpcBase {
    // History key for storing conversation with this NPC
    private readonly HISTORY_KEY = 'PHILOSOPHER_CONVERSATION_HISTORY';
    
    onInit() {
        // Set appearance
        this.setGraphic('female');
        
        // Add label above NPC
        this.setComponentsTop(Components.text('Philosopher'));
        
        // Set personality for AI context
        this.personalityDescription = 
            'You are Sophia, a wise philosopher in a magical village. ' +
            'You speak thoughtfully and enjoy discussing deep philosophical questions. ' +
            'Your responses should be insightful but accessible, using metaphors related to ' +
            'nature and village life. Keep responses under 150 characters when possible.';
    }
    
    async onAction(player: RpgPlayer) {
        // Initial greeting
        await player.showText("Greetings, seeker of wisdom. I am Sophia, the village philosopher.", {
            talkWith: this
        });
        
        // Main conversation loop
        let conversationActive = true;
        
        while (conversationActive) {
            // Present dialogue options
            const choice = await player.showChoices("What philosophical topic interests you?", [
                { text: "The nature of reality", value: 'reality' },
                { text: "The meaning of life", value: 'meaning' },
                { text: "The concept of time", value: 'time' },
                { text: "Ask a custom question", value: 'custom' },
                { text: "Continue our discussion", value: 'continue' },
                { text: "End conversation", value: 'end' }
            ]);
            
            if (!choice) {
                conversationActive = false;
                continue;
            }
            
            switch (choice.value) {
                case 'reality':
                    await this.discussPhilosophicalTopic(
                        player, 
                        "What is the nature of reality in your philosophical view?"
                    );
                    break;
                    
                case 'meaning':
                    await this.discussPhilosophicalTopic(
                        player, 
                        "What do you believe is the meaning of life?"
                    );
                    break;
                    
                case 'time':
                    await this.discussPhilosophicalTopic(
                        player, 
                        "How do you understand the concept of time?"
                    );
                    break;
                    
                case 'custom':
                    // Allow player to ask a custom question
                    const question = await player.showInputBox("What would you like to ask?");
                    
                    if (question) {
                        await this.discussPhilosophicalTopic(player, question);
                    }
                    break;
                    
                case 'continue':
                    // Continue previous conversation thread
                    await this.discussPhilosophicalTopic(
                        player, 
                        "Please continue our previous discussion."
                    );
                    break;
                    
                case 'end':
                    await player.showText(
                        "May your journey bring you wisdom. Return when you wish to explore more philosophical questions.", 
                        { talkWith: this }
                    );
                    conversationActive = false;
                    break;
            }
        }
    }
    
    /**
     * Handle philosophical discussion with AI-generated responses
     * @param player The player in conversation
     * @param question The philosophical question
     */
    private async discussPhilosophicalTopic(player: RpgPlayer, question: string): Promise<void> {
        // Show transition while waiting for API
        await player.showText(
            "Hmm, let me contemplate that for a moment...", 
            { talkWith: this }
        );
        
        // Generate response from AI
        const response = await this.generateDialogueResponse(
            player,
            question,
            this.HISTORY_KEY
        );
        
        // Show response in manageable chunks
        await this.showDialogueInChunks(player, response);
    }
}
### 3.3 Enhanced Artist NPC with Art Generation
```typescript
// main/events/artist.ts
import { RpgEvent, EventData, RpgPlayer, EventMode } from '@rpgjs/server';
import { Components } from '@rpgjs/client';
import axios from 'axios';
import { AiNpcBase } from '../utils/ai-npc';
import { EmotionBubble } from '../utils/emotion-bubbles';
import { config } from '../utils/config';

@EventData({
    name: 'village-artist',
    mode: EventMode.Shared,
    hitbox: {
        width: 32,
        height: 16
    }
})
export default class ArtistEvent extends AiNpcBase {
    // History key for storing conversation with this NPC
    private readonly HISTORY_KEY = 'ARTIST_CONVERSATION_HISTORY';
    
    // Default village painting URL
    private readonly DEFAULT_PAINTING_URL = config.defaultAssets.villagePainting;
    
    // Art generation webhook URL
    private readonly ART_GENERATION_URL = config.webhooks.artGeneration;
    
    onInit() {
        // Set appearance
        this.setGraphic('female');
        
        // Add label above NPC
        this.setComponentsTop(Components.text('Artist'));
        
        // Set personality for AI context
        this.personalityDescription = 
            'You are Aria, a talented artist in a magical village. ' +
            'You speak passionately about art, color, and beauty. ' +
            'Your responses should be creative and visual, using artistic terminology ' +
            'in an accessible way. Keep responses under 150 characters when possible.';
    }
    
    async onAction(player: RpgPlayer) {
        // Initial greeting
        await player.showText("Hello! I'm Aria, the village artist.", {
            talkWith: this
        });
        
        // Main conversation loop
        let conversationActive = true;
        
        while (conversationActive) {
            // Present dialogue options
            const choice = await player.showChoices("What would you like to talk about?", [
                { text: "Your artwork", value: 'artwork' },
                { text: "The village", value: 'village' },
                { text: "See new painting", value: 'new-painting' },
                { text: "Ask about art", value: 'custom' },
                { text: "End conversation", value: 'end' }
            ]);
            
            if (!choice) {
                conversationActive = false;
                continue;
            }
            
            switch (choice.value) {
                case 'artwork':
                    await this.discussArtTopic(
                        player, 
                        "Tell me about your artistic style and what inspires you."
                    );
                    break;
                    
                case 'village':
                    await this.discussArtTopic(
                        player, 
                        "How does this village influence your art?"
                    );
                    break;
                    
                case 'new-painting':
                    await this.generateNewPainting(player);
                    break;
                    
                case 'custom':
                    // Allow player to ask a custom question about art
                    const question = await player.showInputBox("What would you like to ask about art?");
                    
                    if (question) {
                        await this.discussArtTopic(player, question);
                    }
                    break;
                    
                case 'end':
                    await player.showText(
                        "Feel free to visit my studio anytime! The light is always best in the morning.", 
                        { talkWith: this }
                    );
                    conversationActive = false;
                    break;
            }
        }
    }
    
    /**
     * Handle art discussion with AI-generated responses
     * @param player The player in conversation
     * @param question The art-related question
     */
    private async discussArtTopic(player: RpgPlayer, question: string): Promise<void> {
        // Show transition while waiting for API
        await player.showText(
            "Ah, let me gather my thoughts on that...", 
            { talkWith: this }
        );
        
        // Generate response from AI
        const response = await this.generateDialogueResponse(
            player,
            question,
            this.HISTORY_KEY
        );
        
        // Show response in manageable chunks
        await this.showDialogueInChunks(player, response);
    }
    
    /**
     * Generate a new AI painting and give it to the player
     * @param player The player requesting a painting
     */
    private async generateNewPainting(player: RpgPlayer): Promise<void> {
        try {
            // Show working message
            await player.showText(
                "I've been working on something special. Let me show you...", 
                { talkWith: this }
            );
            
            // Show creative emotion
            this.showEmotionBubble(EmotionBubble.Creative);
            
            // Generate art prompt
            const artPrompt = "A magical fantasy village with glowing lanterns, surrounded by ancient trees and a starry sky";
            
            // Make API request to generate art
            const response = await axios.post(this.ART_GENERATION_URL, {
                prompt: artPrompt
            });
            
            // Get image URL from response
            const imageUrl = response.data.imageUrl || this.DEFAULT_PAINTING_URL;
            
            // Show the painting to the player
            player.gui('rpg-artwork-viewer').open({
                imageUrl: imageUrl,
                title: "Village at Twilight",
                description: "A magical view of our village as the stars begin to appear."
            });
            
            // Ask if player wants to keep the painting
            const keepChoice = await player.showChoices("Would you like to keep this painting?", [
                { text: "Yes, I'll treasure it", value: 'yes' },
                { text: "No, thank you", value: 'no' }
            ]);
            
            if (keepChoice && keepChoice.value === 'yes') {
                // Give painting item to player
                player.addItem('village-painting', 1);
                
                // Set custom properties for this specific painting
                player.setVariable('VILLAGE_PAINTING_URL', imageUrl);
                
                await player.showText(
                    "I'm so glad you like it! I've signed it for you.", 
                    { talkWith: this }
                );
                
                // Show happy emotion
                this.showEmotionBubble(EmotionBubble.Happy);
            } else {
                await player.showText(
                    "That's alright. Art is subjective, after all.", 
                    { talkWith: this }
                );
            }
        } catch (error) {
            console.error('Error generating painting:', error);
            
            // Show confused emotion
            this.showEmotionBubble(EmotionBubble.Confused);
            
            // Fallback to default painting
            await player.showText(
                "I seem to be having trouble with my latest piece. Let me show you one I completed earlier.", 
                { talkWith: this }
            );
            
            // Show default painting
            player.gui('rpg-artwork-viewer').open({
                imageUrl: this.DEFAULT_PAINTING_URL,
                title: "Village at Twilight",
                description: "A magical view of our village as the stars begin to appear."
            });
        }
    }
}
### 3.4 Village Painting Item
```typescript
// main/items/village-painting.ts
import { Item, ItemData, RpgPlayer } from '@rpgjs/server';
import { config } from '../utils/config';

@ItemData({
    id: 'village-painting',
    name: 'Village Painting',
    description: 'A beautiful painting of the village by Aria.',
    price: 0,
    consumable: true
})
export class VillagePainting extends Item {
    /**
     * Called when the player uses the painting from inventory
     * @param player The player using the item
     * @returns true to allow consumption, but we'll add it back immediately
     */
    onUse(player: RpgPlayer): boolean {
        // Get custom painting URL if it exists, otherwise use default
        const imageUrl = player.getVariable('VILLAGE_PAINTING_URL') || config.defaultAssets.villagePainting;
        
        // Show the painting in the artwork viewer
        player.gui('rpg-artwork-viewer').open({
            imageUrl: imageUrl,
            title: "Village at Twilight",
            description: "A magical view of the village as the stars begin to appear."
        });
        
        // Add the item back to prevent actual consumption
        player.addItem('village-painting', 1);
        
        return true;
    }
}
### 3.5 Artwork Viewer Component
```vue
<!-- main/gui/ArtworkViewer.vue -->
<template>
  <div class="artwork-viewer">
    <div class="artwork-container">
      <div v-if="loading" class="loading">
        <p>Loading artwork...</p>
      </div>
      <div v-else-if="error" class="error">
        <p>{{ error }}</p>
        <button @click="close">Close</button>
      </div>
      <div v-else class="artwork">
        <h2>{{ title }}</h2>
        <div class="image-container">
          <img :src="imageUrl" @load="imageLoaded" @error="imageError" />
        </div>
        <p class="description">{{ description }}</p>
        <div class="controls">
          <button @click="close">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Control } from '@rpgjs/client'

export default {
  name: 'ArtworkViewer',
  
  inject: ['rpgKeypress', 'rpgGuiClose'],
  
  data() {
    return {
      imageUrl: '',
      title: '',
      description: '',
      loading: true,
      error: null,
      obsKeyPress: null
    }
  },
  
  mounted() {
    // Set up key press listener for closing with action button
    this.obsKeyPress = this.rpgKeypress.subscribe(({ control }) => {
      if (control && control.actionName == Control.Action) {
        this.close()
      }
    })
  },
  
  unmounted() {
    // Clean up subscription
    if (this.obsKeyPress) {
      this.obsKeyPress.unsubscribe()
    }
  },
  
  methods: {
    /**
     * Called when the component is opened
     * @param {Object} data Parameters passed to the component
     */
    open(data) {
      this.imageUrl = data.imageUrl || ''
      this.title = data.title || 'Artwork'
      this.description = data.description || ''
      this.loading = true
      this.error = null
      
      // Preload image if URL is provided
      if (!this.imageUrl) {
        this.error = 'No image available'
        this.loading = false
      }
    },
    
    /**
     * Called when image is successfully loaded
     */
    imageLoaded() {
      this.loading = false
    },
    
    /**
     * Called when image fails to load
     */
    imageError() {
      this.error = 'Failed to load image'
      this.loading = false
    },
    
    /**
     * Close the viewer
     */
    close() {
      this.rpgGuiClose('rpg-artwork-viewer')
    }
  }
}
</script>

<style scoped>
.artwork-viewer {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.artwork-container {
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 20px;
  max-width: 80%;
  max-height: 80%;
  overflow: auto;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
}

.artwork h2 {
  text-align: center;
  margin-top: 0;
  color: #333;
}

.image-container {
  text-align: center;
  margin: 15px 0;
}

.image-container img {
  max-width: 100%;
  max-height: 60vh;
  border: 3px solid #333;
  border-radius: 4px;
}

.description {
  text-align: center;
  font-style: italic;
  margin-bottom: 20px;
  color: #555;
}

.controls {
  text-align: center;
}

button {
  background-color: #4a6fa5;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

button:hover {
  background-color: #3a5a8a;
}

.loading, .error {
  text-align: center;
  padding: 20px;
}

.error {
  color: #d9534f;
}
</style>
### 3.6 Configuration Utility
```typescript
// main/utils/config.ts
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Central configuration for external integrations and default assets
 */
export const config = {
    // Webhook URLs for external services
    webhooks: {
        // AI dialogue generation for NPCs
        npcDialogue: process.env.NPC_DIALOGUE_WEBHOOK_URL || 
            'https://theagentartel.app.n8n.cloud/webhook-test/chat',
            
        // AI art generation for paintings
        artGeneration: process.env.ART_GENERATION_WEBHOOK_URL || 
            'https://theagentartel.app.n8n.cloud/webhook-test/generate-art'
    },
    
    // Default asset URLs for fallbacks
    defaultAssets: {
        // Default village painting URL
        villagePainting: process.env.DEFAULT_PAINTING_URL || 
            'https://example.com/default-village-painting.jpg'
    }
};
### 3.7 Emotion Bubbles Utility
```typescript
// main/utils/emotion-bubbles.ts
import { RpgEvent, RpgPlayer } from '@rpgjs/server';

/**
 * Enum of available emotion bubbles
 */
export enum EmotionBubble {
    Happy = 'happy',
    Sad = 'sad',
    Angry = 'angry',
    Confused = 'confused',
    Surprised = 'surprised',
    Thinking = 'thinking',
    Creative = 'creative',
    Love = 'love'
}

/**
 * Map of emotions to webhook response emotions
 */
export const WebhookEmotionMap: Record<string, EmotionBubble> = {
    'happy': EmotionBubble.Happy,
    'joy': EmotionBubble.Happy,
    'excited': EmotionBubble.Happy,
    
    'sad': EmotionBubble.Sad,
    'unhappy': EmotionBubble.Sad,
    'depressed': EmotionBubble.Sad,
    
    'angry': EmotionBubble.Angry,
    'mad': EmotionBubble.Angry,
    'furious': EmotionBubble.Angry,
    
    'confused': EmotionBubble.Confused,
    'puzzled': EmotionBubble.Confused,
    'uncertain': EmotionBubble.Confused,
    
    'surprised': EmotionBubble.Surprised,
    'shocked': EmotionBubble.Surprised,
    'astonished': EmotionBubble.Surprised,
    
    'thinking': EmotionBubble.Thinking,
    'contemplating': EmotionBubble.Thinking,
    'pondering': EmotionBubble.Thinking,
    
    'creative': EmotionBubble.Creative,
    'inspired': EmotionBubble.Creative,
    'artistic': EmotionBubble.Creative,
    
    'love': EmotionBubble.Love,
    'affection': EmotionBubble.Love,
    'caring': EmotionBubble.Love
};

/**
 * Extension of RpgEvent to add emotion bubble functionality
 */
export class RpgEventWithEmotions extends RpgEvent {
    /**
     * Show an emotion bubble above the NPC
     * @param emotion The emotion to display
     * @param duration Duration in milliseconds (default: 3000)
     */
    showEmotionBubble(emotion: EmotionBubble, duration: number = 3000): void {
        // Implementation depends on your emotion bubble system
        // This could use Components.text() with emoji or custom sprites
        
        // Example implementation with text component
        const emotionSymbol = this.getEmotionSymbol(emotion);
        this.setComponentsTop({
            text: {
                text: emotionSymbol,
                fontSize: 24,
                padding: 5,
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                borderRadius: 15
            }
        });
        
        // Reset after duration
        setTimeout(() => {
            this.setComponentsTop(null);
        }, duration);
    }
    
    /**
     * Map emotion to display symbol
     * @param emotion The emotion to get symbol for
     * @returns Symbol representing the emotion
     */
    private getEmotionSymbol(emotion: EmotionBubble): string {
        switch (emotion) {
            case EmotionBubble.Happy: return '😊';
            case EmotionBubble.Sad: return '😢';
            case EmotionBubble.Angry: return '😠';
            case EmotionBubble.Confused: return '😕';
            case EmotionBubble.Surprised: return '😮';
            case EmotionBubble.Thinking: return '🤔';
            case EmotionBubble.Creative: return '🎨';
            case EmotionBubble.Love: return '❤️';
            default: return '❓';
        }
    }
    
    /**
     * Map webhook emotion string to EmotionBubble enum
     * @param emotion String emotion from webhook
     * @returns Corresponding EmotionBubble or Thinking as default
     */
    mapWebhookEmotion(emotion: string): EmotionBubble {
        const lowerEmotion = emotion.toLowerCase();
        return WebhookEmotionMap[lowerEmotion] || EmotionBubble.Thinking;
    }
}
## 4. Implementation Steps
1. Create the utility files first:
   - config.ts
   - emotion-bubbles.ts
   - ai-npc.ts
2. Create or update the GUI components:
   - ArtworkViewer.vue
3. Create or update the item classes:
   - village-painting.ts
4. Create or update the NPC event classes:
   - philosopher.ts
   - artist.ts
5. Register components in the client module:
   - Update client.ts to include the ArtworkViewer component
6. Update the map to include the NPCs:
   - Add NPCs to simplemap2.tmx
7. Test and refine:
   - Test NPC interactions
   - Test artwork generation and viewing
   - Test dialogue generation
## 5. Future Enhancements
1. Add more AI-powered NPCs with different personalities and functions
2. Implement quest system with dynamic AI-generated quests
3. Create a journal system to track conversations with NPCs
4. Add more interactive elements to the map
5. Implement a day/night cycle that affects NPC behavior
6. Create a reputation system that influences NPC dialogue
This plan provides a comprehensive framework for enhancing your ARTELIO project with AI-powered NPCs and dynamic content. The code is modular and reusable, making it easy to add new features and NPCs in the future.