import { RpgEvent, EventData, RpgPlayer, EventMode, Components } from '@rpgjs/server';
import { EmotionBubble } from '@rpgjs/plugin-emotion-bubbles';
import '../utils/npc-emotions'; // Import to extend RpgEvent with showEmotionBubble
import { NpcEmotions } from '../utils/npc-emotions';
import { config } from '../utils/config';

const HISTORY_VAR = 'SERAPHINA_STAR_WEAVER_HISTORY';
const LAST_READING_VAR = 'SERAPHINA_LAST_READING_V2'; // V2 to ensure fresh start if old var exists
const MAX_HISTORY_LENGTH = 10; // Keep the last 10 pairs of user/assistant messages

// Regex to capture the URL from a standard markdown link: [text](URL)
const URL_CAPTURE_REGEX = /\[[^\]]*\]\((https?:\/\/[^\s\)]+)\)/i;

// Regex to match the entire standard markdown link for replacement: [text](URL)
const REPLACE_TARGET_REGEX = /\[[^\]]*\]\(https?:\/\/[^\s\)]+\)/i;

@EventData({
    name: 'seraphina-star-weaver', // This MUST match the object name in Tiled
    mode: EventMode.Shared,
    hitbox: {
        width: 32,
        height: 16
    }
})
export default class SeraphinaStarWeaverEvent extends RpgEvent {
    onInit() {
        this.setGraphic('female'); // Consider changing to a more astrologer-like sprite
        this.setComponentsTop(Components.text('Seraphina'));
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
        return match ? match[1] : null;
    }

    // Clear the last reading when the player leaves the map
    onLeaveMap(player: RpgPlayer) {
        player.setVariable(LAST_READING_VAR, null);
        console.log(`[${this.constructor.name}] Cleared last reading for player ${player.id} as they left the map.`);
    }

    async onAction(player: RpgPlayer) {
        let conversationHistory: { role: string; content: string }[] = player.getVariable(HISTORY_VAR) || [];
        const lastReadingSummary: string | null = player.getVariable(LAST_READING_VAR);

        let initialPlayerChoiceValue: string | null = null;

        if (lastReadingSummary) {
            this.showEmotionBubble(EmotionBubble.Thought); // Or another fitting emotion
            await player.showText(`The stars still echo the vision I shared with you: "${lastReadingSummary}"`, { talkWith: this });
            const followUpChoice = await player.showChoices('What would you like to do?', [
                { text: 'Discuss that reading further.', value: 'discuss_previous' },
                { text: 'Seek a new vision from the Tapestry.', value: 'request_new_reading' },
                { text: 'Ask about the stars in general.', value: 'ask_lore_after_memory' },
                { text: 'Perhaps another time.', value: 'goodbye' }
            ], { talkWith: this });

            if (followUpChoice) {
                if (followUpChoice.value === 'discuss_previous') {
                    initialPlayerChoiceValue = `Let's talk more about the previous reading: "${lastReadingSummary}".`;
                } else if (followUpChoice.value === 'request_new_reading') {
                    player.setVariable(LAST_READING_VAR, null); // Clear old reading before new one
                    initialPlayerChoiceValue = 'I wish to gaze anew into the Celestial Tapestry.';
                } else if (followUpChoice.value === 'ask_lore_after_memory') {
                    initialPlayerChoiceValue = 'Tell me more about the stars and their mysteries.';
                } else {
                    initialPlayerChoiceValue = 'goodbye';
                }
            }
        } else {
            if (conversationHistory.length === 0) {
                this.showEmotionBubble(EmotionBubble.Exclamation);
                const greeting = "The stars whisper your arrival. I am Seraphina. Would you seek a glimpse into the Celestial Tapestry?";
                await player.showText(greeting, { talkWith: this });
                conversationHistory.push({ role: 'assistant', content: greeting });
            }

            const choice = await player.showChoices('How may I guide you under the celestial gaze?', [
                { text: 'Gaze into the Celestial Tapestry.', value: 'request_reading' },
                { text: 'Tell me about the stars.', value: 'ask_lore' },
                { text: 'Perhaps another time.', value: 'goodbye' }
            ], { talkWith: this });

            if (choice) {
                initialPlayerChoiceValue = choice.value;
            }
        }

        if (!initialPlayerChoiceValue || initialPlayerChoiceValue === 'goodbye' || initialPlayerChoiceValue.trim() === '') {
            this.showEmotionBubble(EmotionBubble.Sleep); // Or another fitting emotion
            await player.showText("May the stars light your path. Farewell.", { talkWith: this });
            return;
        }

        let playerInput = initialPlayerChoiceValue;
        // Map choice values to more natural language for the AI if needed, or use them directly
        if (initialPlayerChoiceValue === 'request_reading') {
            playerInput = 'I wish to gaze into the Celestial Tapestry for a Star Sign Reading.';
        } else if (initialPlayerChoiceValue === 'ask_lore') {
            playerInput = 'Tell me about the mysteries of the stars and constellations.';
        }
        // 'discuss_previous' and 'request_new_reading' are already descriptive

        this.showEmotionBubble(EmotionBubble.DotDotDot);
        await player.showText("Allow me a moment to consult the cosmic currents...", { talkWith: this });
        conversationHistory.push({ role: 'user', content: playerInput });

        if (conversationHistory.length > MAX_HISTORY_LENGTH * 2) {
            conversationHistory = conversationHistory.slice(-MAX_HISTORY_LENGTH * 2);
        }

        const agentIdKey = 'seraphinaStarWeaver'; // Key from config.ts
        const agentDockUrl = config.getAgentDockChatUrl(agentIdKey);
        console.log(`[${this.constructor.name}] Attempting to contact AgentDock for agent '${config.getAgentDockAgentId(agentIdKey)}' at: ${agentDockUrl}`);

        if (!agentDockUrl) {
            console.error(`[${this.constructor.name}] AgentDock URL for '${agentIdKey}' is not configured.`);
            await player.showText('The celestial connection is faint. Please try again when the stars are clearer.', { talkWith: this });
            return;
        }

        try {
            const response = await fetch(agentDockUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: conversationHistory, stream: false }), // Set stream: false if your parsing expects full JSON
            });
            console.log(`[${this.constructor.name}] Sent to AgentDock:`, JSON.stringify({ messages: conversationHistory.slice(-4) }, null, 2));
            console.log(`[${this.constructor.name}] Received response status: ${response.status}`);

            if (!response.ok) {
                const errorData = await response.text();
                console.error(`[${this.constructor.name}] API Error ${response.status}:`, errorData);
                this.showEmotionBubble(EmotionBubble.No);
                await player.showText('The cosmic weave is tangled... I could not complete your request. Perhaps the stars will align later.', { talkWith: this });
                player.setVariable(HISTORY_VAR, conversationHistory);
                return;
            }

            const responseText = await response.text();
            console.log(`[${this.constructor.name}] Raw API response text:`, responseText);
            let aiResponseContent = 'The stars are silent for now...';

            try {
                const data = JSON.parse(responseText);
                if (data.choices && data.choices.length > 0 && data.choices[0].message && data.choices[0].message.content) {
                    aiResponseContent = data.choices[0].message.content;
                } else if (data.message && typeof data.message.content === 'string') { // Ensure data.message.content is a string
                    aiResponseContent = data.message.content;
                } else if (data.message && typeof data.message === 'string') { // If data.message is the string content itself
                    aiResponseContent = data.message;
                } else if (typeof data.content === 'string') {
                    aiResponseContent = data.content;
                } else {
                    console.warn(`[${this.constructor.name}] Standard JSON parse successful, but unexpected structure or no direct content. Will attempt stream parse if content is default. Data:`, data);
                    if (aiResponseContent === 'The stars are silent for now...') throw new Error('Standard JSON parsed but no content found, trying stream.');
                }
            } catch (e) {
                console.warn(`[${this.constructor.name}] Standard JSON.parse failed or content not found. Attempting to parse as Vercel AI SDK stream. Error:`, e instanceof Error ? e.message : String(e));
                const lines = responseText.trim().split('\n');
                let accumulatedContent = "";
                let hasStreamData = false;
                for (const line of lines) {
                    if (line.startsWith('0:')) {
                        try {
                            // The content part after '0:' is a JSON string, e.g., "hello ", so it needs to be parsed as such.
                            const contentPart = JSON.parse(line.substring(2));
                            accumulatedContent += contentPart;
                            hasStreamData = true;
                        } catch (parseError) {
                            console.warn(`[${this.constructor.name}] Could not parse stream line part content:`, line.substring(2), 'Error:', parseError);
                        }
                    } else if (line.startsWith('2:')) { // Handle tool_code_execution if needed, or other message types
                        // Example: 2:{"tool_code_execution":{"tool_call_id":"...","result":"..."}}
                        // For now, Seraphina doesn't use this, but good to be aware of.
                        console.log(`[${this.constructor.name}] Received stream line type 2 (tool_code_execution/other):`, line);
                    }
                }
                if (hasStreamData) {
                    aiResponseContent = accumulatedContent;
                    console.log(`[${this.constructor.name}] Successfully parsed stream content from '0:' lines.`);
                } else {
                    console.error(`[${this.constructor.name}] Failed to parse responseText as standard JSON or Vercel stream '0:' lines. Content remains default.`);
                }
                // If parsing fails, aiResponseContent remains "The stars are silent for now..."
            }
            console.log(`[${this.constructor.name}] Final Parsed AI response content:`, aiResponseContent);

            this.showEmotionBubble(NpcEmotions.HAPPY_OPEN_MOUTH); // Or a more serene emotion
            conversationHistory.push({ role: 'assistant', content: aiResponseContent });
            player.setVariable(HISTORY_VAR, conversationHistory);

            console.log(`[${this.constructor.name}] Attempting to extract image from content: "${aiResponseContent}"`);
            const imageUrl = this.extractImageUrl(aiResponseContent);
            console.log(`[${this.constructor.name}] Extracted Image URL: ${imageUrl === null ? 'null' : `"${imageUrl}"`}`);

            let textToShow = aiResponseContent;
            let readingForMemory = aiResponseContent; // Capture the full AI response for memory

            if (imageUrl) {
                console.log(`[${this.constructor.name}] Image URL successfully extracted: "${imageUrl}"`);
                textToShow = aiResponseContent.replace(REPLACE_TARGET_REGEX, '').trim();
                // The text for memory should ideally be the interpretation part, not just the link removed.
                // This might require the AI to structure its response, e.g., "Here is the tapestry: [link]. My interpretation is: ..."
                // For now, we'll use the text after link removal for memory.
                readingForMemory = textToShow; 
                console.log(`[${this.constructor.name}] Text to show (after image markdown removal): "${textToShow}"`);
                try {
                    player.gui('rpg-artwork-viewer').open({
                        imageUrl: imageUrl,
                        title: 'Celestial Tapestry',
                        description: 'A vision woven by Seraphina.'
                    });
                    console.log(`[${this.constructor.name}] Called rpg-artwork-viewer with imageUrl: "${imageUrl}"`);
                } catch (guiError) {
                    console.error(`[${this.constructor.name}] Error displaying image with 'rpg-artwork-viewer':`, guiError);
                    await player.showText("(I tried to show you a vision, but the tapestry seems clouded!)", { talkWith: this });
                }
            } else {
                console.log(`[${this.constructor.name}] No Image URL extracted. Text to show will be original AI content.`);
            }

            // Store a summary of the reading if an image was involved or if it was a reading request
            if (initialPlayerChoiceValue === 'request_reading' || (initialPlayerChoiceValue === 'request_new_reading' && imageUrl)) {
                const summary = readingForMemory.substring(0, 100) + (readingForMemory.length > 100 ? '...' : '');
                player.setVariable(LAST_READING_VAR, summary);
                console.log(`[${this.constructor.name}] Stored last reading summary: "${summary}"`);
            }
            
            if (textToShow && textToShow.length > 0) {
                const chunks = this.splitIntoChunks(textToShow);
                for (const chunk of chunks) {
                    await player.showText(chunk, { talkWith: this });
                }
            }

        } catch (error) {
            console.error(`[${this.constructor.name}] Failed to fetch or process AI response:`, error);
            this.showEmotionBubble(EmotionBubble.No);
            await player.showText('A cosmic disturbance interrupted our connection. Please try again when the celestial energies are more favorable.', { talkWith: this });
            player.setVariable(HISTORY_VAR, conversationHistory);
        }
    }
}