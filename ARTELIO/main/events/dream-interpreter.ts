import { RpgEvent, EventData, RpgPlayer, EventMode, Components } from '@rpgjs/server'
import { EmotionBubble } from '@rpgjs/plugin-emotion-bubbles'
import '../utils/npc-emotions' // Import to extend RpgEvent with showEmotionBubble
import { NpcEmotions } from '../utils/npc-emotions'
import { AgentArtel } from '../utils/agent-artel'
import { config } from '../utils/config'

// Variable name for storing conversation history
const HISTORY_VAR = 'DREAM_INTERPRETER_HISTORY'

@EventData({
    name: 'village-dream-interpreter',  // Unique identifier for this NPC
    mode: EventMode.Shared,    // Visible to all players
    hitbox: {
        width: 32,
        height: 16
    }
})
export default class DreamInterpreterEvent extends RpgEvent {
    onInit() {
        // Set the NPC's appearance - using elder sprite for a distinguished look
        this.setGraphic('female')
        
        // Add a visual indicator above the NPC
        this.setComponentsTop(Components.text('Dream Interpreter'))
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
            this.showEmotionBubble(EmotionBubble.Idea);
            
            const greeting = "Ah, a visitor to my humble chamber of dream analysis. I am Dr. Sigmund Freud, devoted to uncovering the mysteries of the unconscious mind. Dreams, you see, are the royal road to the unconscious. Perhaps you have come to explore the hidden meanings within your own dreams?";
            
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
            { text: "Interpret a recent dream", value: 'dream' },
            { text: "Ask about dream symbolism", value: 'symbolism' },
            { text: "Discuss the unconscious mind", value: 'unconscious' },
            { text: "Ask a custom question", value: 'custom' },
            { text: "Continue our discussion", value: 'continue' }
        ]);
        
        if (!choice) return;
        
        try {
            let userMessage = "";
            
            // Show an appropriate emotion and transition message based on the choice
            if (choice.value === 'dream') {
                this.showEmotionBubble(EmotionBubble.Cloud);
                await player.showText("Excellent. Please describe your dream in as much detail as you can recall. The symbols, emotions, and figures that appear are all significant.", {
                    talkWith: this
                });
                
                // Get dream details from player via a custom input
                const dreamInput = await player.showInputBox("Describe your dream:", {
                    length: 500, // Allow for detailed dream descriptions
                    variable: true
                });
                
                if (!dreamInput || dreamInput.trim() === '') {
                    await player.showText("I see you are hesitant to share. Perhaps another time when you feel more comfortable.", {
                        talkWith: this
                    });
                    return;
                }
                
                userMessage = `I had this dream: ${dreamInput}. What does it mean?`;
            }
            else if (choice.value === 'symbolism') {
                this.showEmotionBubble(EmotionBubble.Question);
                await player.showText("Symbols in dreams are the language of the unconscious. What particular symbol interests you?", {
                    talkWith: this
                });
                
                // Get specific symbol from player
                const symbolInput = await player.showInputBox("What dream symbol interests you?", {
                    length: 100,
                    variable: true
                });
                
                if (!symbolInput || symbolInput.trim() === '') {
                    await player.showText("Perhaps you need more time to contemplate the symbols in your dreams. We can discuss this another time.", {
                        talkWith: this
                    });
                    return;
                }
                
                userMessage = `What does the symbol of ${symbolInput} mean in dreams?`;
            }
            else if (choice.value === 'unconscious') {
                this.showEmotionBubble(EmotionBubble.Star);
                await player.showText("Ah, the unconscious mind - the vast reservoir of repressed thoughts, primitive instincts, and desires too uncomfortable for the conscious mind to acknowledge. What aspect of it shall we explore?", {
                    talkWith: this
                });
                
                userMessage = "Please explain your theory of the unconscious mind and how it influences our dreams and behavior.";
            }
            else if (choice.value === 'custom') {
                this.showEmotionBubble(EmotionBubble.Question);
                
                // Get custom question from player
                const customInput = await player.showInputBox("What would you like to ask?", {
                    length: 200,
                    variable: true
                });
                
                if (!customInput || customInput.trim() === '') {
                    await player.showText("You seem uncertain what to ask. Take your time to formulate your thoughts, and return when you are ready.", {
                        talkWith: this
                    });
                    return;
                }
                
                userMessage = customInput;
            }
            else if (choice.value === 'continue') {
                this.showEmotionBubble(EmotionBubble.Idea);
                await player.showText("Yes, let us continue where we left off. The unconscious mind reveals itself gradually.", {
                    talkWith: this
                });
                
                // If continuing, use the last exchange as context
                if (conversationHistory.length >= 2) {
                    const lastAssistantMessage = conversationHistory[conversationHistory.length - 1].content;
                    userMessage = "Please continue explaining based on what you just told me.";
                } else {
                    userMessage = "Let's continue our discussion about dreams and the unconscious mind.";
                }
            }
            
            // Add user message to history
            conversationHistory.push({
                role: 'user',
                content: userMessage
            });
            
            // Show thinking emotion while waiting for API response
            this.showEmotionBubble(EmotionBubble.ThreeDot);
            await player.showText("Hmm, let me contemplate this for a moment...", {
                talkWith: this
            });
            
            // Limit history to last 10 messages to prevent context overflow
            const limitedHistory = conversationHistory.slice(-10);
            
            // Format the user message with instructions for proper formatting
            const formattedUserMessage = `${userMessage}\n\nIMPORTANT: Please format your response as plain text without markdown formatting. Do not use headers (##), bold (**text**), or other markdown. Keep paragraphs short (2-3 sentences max) for better readability in a dialogue box. Use simple language and natural speech patterns. For actions, use *asterisks* like *adjusts glasses* which will be preserved.`;
            
            // Get response from Sigmund Freud agent
            const agentResponse = await AgentArtel.chat(
                config.agentArtel.agents.dreamInterpreter,
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
            
            // Closing remarks
            this.showEmotionBubble(EmotionBubble.Idea);
            await player.showText("Is there anything else you'd like to explore about your inner psyche? The unconscious reveals itself in layers, and our work is never truly complete.", {
                talkWith: this
            });
            
        } catch (error) {
            console.error('Error in dream interpreter dialogue:', error);
            
            // Fallback response in case of error
            this.showEmotionBubble(EmotionBubble.Confusion);
            await player.showText("Curious... my mind seems clouded at the moment. Perhaps we should continue this analysis in our next session.", {
                talkWith: this
            });
        }
    }
}
