import { RpgEvent, EventData, RpgPlayer, EventMode, Components } from '@rpgjs/server';
import { EmotionBubble } from '@rpgjs/plugin-emotion-bubbles';
import '../utils/npc-emotions'; // Import to extend RpgEvent with showEmotionBubble
import { NpcEmotions } from '../utils/npc-emotions';
import { config } from '../utils/config';

const HISTORY_VAR = 'PHIN_HISTORY';
const MAX_HISTORY_LENGTH = 10; // Keep the last 10 pairs of user/assistant messages

// Regex to capture the URL from a standard markdown link: [text](URL)
const URL_CAPTURE_REGEX = /\[[^\]]*\]\((https?:\/\/[^\s\)]+)\)/i;

// Regex to match the entire standard markdown link for replacement: [text](URL)
const REPLACE_TARGET_REGEX = /\[[^\]]*\]\(https?:\/\/[^\s\)]+\)/i;

@EventData({
    name: 'pixel-alchemist-phin-event', // This MUST match the object name in Tiled
    mode: EventMode.Shared,
    hitbox: {
        width: 32,
        height: 16
    }
})
export default class PixelAlchemistPhinEvent extends RpgEvent {
    onInit() {
        this.setGraphic('male'); // Change if you have a specific sprite for Phin
        this.setComponentsTop(Components.text('Pixel Alchemist Phin'));
    }

    /**
     * Splits a long message into multiple chunks for better dialogue display.
     */
    private splitIntoChunks(text: string, maxLength: number = 180): string[] {
        if (!text) return [''];
        if (text.length <= maxLength) return [text];

        const chunks: string[] = [];
        let currentChunk = '';
        const sentences = text.split(/(?<=[.!?])\s+/);

        for (const sentence of sentences) {
            if (currentChunk.length + sentence.length + 1 > maxLength && currentChunk.length > 0) {
                chunks.push(currentChunk.trim());
                currentChunk = sentence;
            } else {
                currentChunk += (currentChunk.length > 0 ? ' ' : '') + sentence;
            }
        }
        if (currentChunk.trim().length > 0) {
            chunks.push(currentChunk.trim());
        }
        return chunks.length > 0 ? chunks : [text]; // Fallback if splitting fails
    }

    private extractImageUrl(text: string): string | null {
        const match = text.match(URL_CAPTURE_REGEX);
        // For '!\[[^\]]*\]\((https?:\/\/[^\s\)]+)\)', match[1] is the captured URL.
        return match ? match[1] : null;
    }

    async onAction(player: RpgPlayer) {
        let conversationHistory: { role: string; content: string }[] = player.getVariable(HISTORY_VAR) || [];

        if (conversationHistory.length === 0) {
            this.showEmotionBubble(EmotionBubble.Exclamation);
            const greeting = "Greetings! I am Phin, the Pixel Alchemist. What wonders can I conjure for you today?";
            await player.showText(greeting, { talkWith: this });
            conversationHistory.push({ role: 'assistant', content: greeting });
        }

        const choice = await player.showChoices('How can Phin assist you?', [
            { text: 'Create an image for me.', value: 'Can you generate an image of a mythical creature in a pixel art style?' },
            { text: 'Tell me about Pixel Alchemy.', value: 'What is Pixel Alchemy?' },
            { text: 'Just admiring your work.', value: 'Your pixel art is impressive!' },
            { text: 'Nevermind.', value: 'nevermind' }
        ], { talkWith: this });

        let playerInput: string | null = null;
        if (choice) {
            playerInput = choice.value;
        }

        if (!playerInput || playerInput === 'nevermind' || playerInput.trim() === '') {
            this.showEmotionBubble(EmotionBubble.Sleep);
            await player.showText("Farewell for now. May your pixels be plentiful!", { talkWith: this });
            return;
        }

        this.showEmotionBubble(EmotionBubble.DotDotDot);
        await player.showText("Let me concentrate...", { talkWith: this }); // Thinking message
        conversationHistory.push({ role: 'user', content: playerInput });

        if (conversationHistory.length > MAX_HISTORY_LENGTH * 2) {
            conversationHistory = conversationHistory.slice(-MAX_HISTORY_LENGTH * 2);
        }

        const agentId = 'rpgjs-pixel-alchemist-phin'; // Agent ID in AgentDock
        const agentDockUrl = config.getAgentDockChatUrl(agentId);
        console.log(`[${this.constructor.name}] Attempting to contact AgentDock for agent '${agentId}' at: ${agentDockUrl}`);
        if (!agentDockUrl) {
            console.error(`[${this.constructor.name}] AgentDock URL for '${agentId}' is not configured.`);
            await player.showText('My connection to the digital ether is unstable. Please try again later.', { talkWith: this });
            return;
        }

        try {
            const response = await fetch(agentDockUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messages: conversationHistory,
                    stream: false 
                }),
            });
            console.log(`[${this.constructor.name}] Sent to AgentDock:`, JSON.stringify({ messages: conversationHistory.slice(-4) }, null, 2));
            console.log(`[${this.constructor.name}] Received response status: ${response.status}`);

            if (!response.ok) {
                const errorData = await response.text();
                console.error(`[${this.constructor.name}] API Error ${response.status}:`, errorData);
                this.showEmotionBubble(EmotionBubble.No);
                await player.showText('The pixels are fuzzy... I could not complete your request. Try again?', { talkWith: this });
                player.setVariable(HISTORY_VAR, conversationHistory);
                return;
            }

            const responseText = await response.text();
            console.log(`[${this.constructor.name}] Raw API response text:`, responseText);
            let aiResponseContent = 'The digital canvas is blank...'; 

            try {
                const data = JSON.parse(responseText);
                if (data.choices && data.choices.length > 0 && data.choices[0].message && data.choices[0].message.content) {
                    aiResponseContent = data.choices[0].message.content;
                } else if (data.message) {
                    aiResponseContent = data.message;
                } else {
                    console.warn(`[${this.constructor.name}] Standard JSON parse successful, but unexpected structure. Will attempt stream parse if content is default.`, data);
                    if (aiResponseContent === 'The digital canvas is blank...') throw new Error('Standard JSON parsed but no content found, trying stream.');
                }
            } catch (e) {
                console.warn(`[${this.constructor.name}] Standard JSON.parse failed or content not found. Attempting to parse as Vercel AI SDK stream. Error:`, e instanceof Error ? e.message : String(e));
                const lines = responseText.trim().split('\n');
                let accumulatedContent = "";
                let hasStreamData = false;
                for (const line of lines) {
                    if (line.startsWith('0:')) {
                        try {
                            const contentPart = JSON.parse(line.substring(2));
                            accumulatedContent += contentPart;
                            hasStreamData = true;
                        } catch (parseError) {
                            console.warn(`[${this.constructor.name}] Could not parse stream line part content:`, line.substring(2), 'Error:', parseError);
                        }
                    }
                }
                if (hasStreamData) {
                    aiResponseContent = accumulatedContent;
                    console.log(`[${this.constructor.name}] Successfully parsed stream content.`);
                } else {
                    console.error(`[${this.constructor.name}] Failed to parse responseText as standard JSON or Vercel stream. Content remains default.`);
                }
            }
            console.log(`[${this.constructor.name}] Final Parsed AI response content:`, aiResponseContent);
            
            this.showEmotionBubble(NpcEmotions.HAPPY_OPEN_MOUTH);
            conversationHistory.push({ role: 'assistant', content: aiResponseContent });
            player.setVariable(HISTORY_VAR, conversationHistory);

            console.log(`[${this.constructor.name}] Attempting to extract image from content: "${aiResponseContent}"`);
            const imageUrl = this.extractImageUrl(aiResponseContent);
            console.log(`[${this.constructor.name}] Extracted Image URL: ${imageUrl === null ? 'null' : `"${imageUrl}"`}`);

            let textToShow = aiResponseContent;

            if (imageUrl) {
                console.log(`[${this.constructor.name}] Image URL successfully extracted: "${imageUrl}"`);
                textToShow = aiResponseContent.replace(REPLACE_TARGET_REGEX, '').trim();
                console.log(`[${this.constructor.name}] Text to show (after image markdown removal): "${textToShow}"`);
                try {
                    // Use the ArtworkViewer GUI, matching its definition (rpg-artwork-viewer and imageUrl prop)
                    player.gui('rpg-artwork-viewer').open({
                        imageUrl: imageUrl,
                        title: 'Pixel Alchemy',
                        description: 'A vision conjured by Phin!'
                    });
                    console.log(`[${this.constructor.name}] Called rpg-artwork-viewer with imageUrl: "${imageUrl}"`);
                } catch (guiError) {
                    console.error(`[${this.constructor.name}] Error displaying image with 'rpg-artwork-viewer':`, guiError);
                    await player.showText("(I tried to show you an image, but the viewer seems to be broken!)", { talkWith: this });
                }
            } else {
                console.log(`[${this.constructor.name}] No Image URL extracted. Text to show will be original AI content.`);
            }

            // Show any accompanying text
            if (textToShow && textToShow.length > 0) {
                const chunks = this.splitIntoChunks(textToShow);
                for (const chunk of chunks) {
                    await player.showText(chunk, { talkWith: this });
                }
            }

        } catch (error) {
            console.error(`[${this.constructor.name}] Error calling AgentDock API:`, error instanceof Error ? error.message : String(error));
            this.showEmotionBubble(EmotionBubble.Sweat);
            await player.showText('A sudden surge of static corrupted my connection! Please try again.', { talkWith: this });
            player.setVariable(HISTORY_VAR, conversationHistory);
        }
    }
}
