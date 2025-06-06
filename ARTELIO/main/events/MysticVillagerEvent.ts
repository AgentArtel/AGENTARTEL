import { RpgEvent, EventData, RpgPlayer, EventMode, Components } from '@rpgjs/server';
import { EmotionBubble } from '@rpgjs/plugin-emotion-bubbles';
import '../utils/npc-emotions'; // Import to extend RpgEvent with showEmotionBubble
import { NpcEmotions } from '../utils/npc-emotions';
import { config } from '../utils/config';

const HISTORY_VAR = 'MYSTIC_VILLAGER_HISTORY';
const MAX_HISTORY_LENGTH = 10; // Keep the last 5 pairs of user/assistant messages

@EventData({
    name: 'mystic-villager-event', // This MUST match the object name in Tiled
    mode: EventMode.Shared,
    hitbox: {
        width: 32,
        height: 16
    }
})
export default class MysticVillagerEvent extends RpgEvent {
    onInit() {
        this.setGraphic('female'); // You can change this to a more mystic sprite later
        this.setComponentsTop(Components.text('Mystic Villager'));
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

    async onAction(player: RpgPlayer) {
        let conversationHistory: { role: string; content: string }[] = player.getVariable(HISTORY_VAR) || [];

        if (conversationHistory.length === 0) {
            this.showEmotionBubble(EmotionBubble.Exclamation);
            const greeting = "Greetings, traveler. I sense you have questions. What troubles your mind?";
            await player.showText(greeting, { talkWith: this });
            conversationHistory.push({ role: 'assistant', content: greeting });
        }

        const choice = await player.showChoices('What would you like to ask the Mystic Villager?', [
            { text: 'Tell me about the ancient spirits.', value: 'Tell me about the ancient spirits.' },
            { text: 'What does the future hold?', value: 'What does the future hold?' },
            { text: 'Share some forgotten lore.', value: 'Share some forgotten lore.' },
            { text: 'Nevermind.', value: 'nevermind' }
        ], { talkWith: this });

        let playerInput: string | null = null;
        if (choice) {
            playerInput = choice.value;
        }

        if (!playerInput || playerInput === 'nevermind' || playerInput.trim() === '') {
            this.showEmotionBubble(EmotionBubble.Sleep);
            await player.showText("Very well, perhaps another time.", { talkWith: this });
            return;
        }

        this.showEmotionBubble(EmotionBubble.DotDotDot);
        conversationHistory.push({ role: 'user', content: playerInput });

        // Keep history from growing too large
        if (conversationHistory.length > MAX_HISTORY_LENGTH * 2) {
            conversationHistory = conversationHistory.slice(-MAX_HISTORY_LENGTH * 2);
        }

        const agentDockUrl = config.getAgentDockChatUrl('mysticVillager');
        console.log(`[MysticVillagerEvent] Attempting to contact AgentDock at: ${agentDockUrl}`);
        if (!agentDockUrl) {
            console.error('MysticVillagerEvent: AgentDock URL for mysticVillager is not configured.');
            await player.showText('My connection to the ethereal planes is currently disrupted. Please try again later.', { talkWith: this });
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
                    stream: false // Requesting non-streamed response for simplicity
                }),
            });
            console.log('[MysticVillagerEvent] Sent to AgentDock:', JSON.stringify({ messages: conversationHistory.slice(-4) }, null, 2)); // Log last 2 interactions

            console.log(`[MysticVillagerEvent] Received response status: ${response.status}`);
            if (!response.ok) {
                const errorData = await response.text();
                console.error(`[MysticVillagerEvent] API Error ${response.status}:`, errorData);
                this.showEmotionBubble(EmotionBubble.No);
                await player.showText('The spirits are unclear at this moment. Try rephrasing your query.', { talkWith: this });
                // Don't add failed AI attempt to history, but keep user's message
                player.setVariable(HISTORY_VAR, conversationHistory);
                return;
            }

            const responseText = await response.text(); // Get text first for logging
            console.log('[MysticVillagerEvent] Raw API response text:', responseText);
            let aiResponseContent = 'The mists obscure my vision...'; // Default message

            try {
                // Attempt standard JSON parsing first
                const data = JSON.parse(responseText);
                if (data.choices && data.choices.length > 0 && data.choices[0].message && data.choices[0].message.content) {
                    aiResponseContent = data.choices[0].message.content;
                } else if (data.message) { // Fallback for simpler AgentDock response structure
                    aiResponseContent = data.message;
                } else {
                    console.warn('[MysticVillagerEvent] Standard JSON parse successful, but unexpected structure. Will attempt stream parse if content is default.', data);
                    // If content is still default, it means we didn't find it in the parsed JSON. Try stream.
                    if (aiResponseContent === 'The mists obscure my vision...') throw new Error('Standard JSON parsed but no content found, trying stream.');
                }
            } catch (e) {
                // Standard JSON.parse failed or didn't yield content, try to parse as Vercel AI SDK stream
                console.warn('[MysticVillagerEvent] Standard JSON.parse failed or content not found. Attempting to parse as Vercel AI SDK stream. Error:', e instanceof Error ? e.message : String(e));
                const lines = responseText.trim().split('\n');
                let accumulatedContent = "";
                let hasStreamData = false;
                for (const line of lines) {
                    if (line.startsWith('0:')) {
                        try {
                            // Example line: 0:"Hello " -> JSON.parse("\"Hello \"") -> "Hello "
                            const contentPart = JSON.parse(line.substring(2));
                            accumulatedContent += contentPart;
                            hasStreamData = true;
                        } catch (parseError) {
                            console.warn('[MysticVillagerEvent] Could not parse stream line part content:', line.substring(2), 'Error:', parseError);
                        }
                    }
                }
                if (hasStreamData) {
                    aiResponseContent = accumulatedContent;
                    console.log('[MysticVillagerEvent] Successfully parsed stream content.');
                } else {
                    console.error('[MysticVillagerEvent] Failed to parse responseText as standard JSON or Vercel stream. Content remains default.');
                    // If stream parsing also fails, aiResponseContent remains the default.
                }
            }
            console.log('[MysticVillagerEvent] Final Parsed AI response content:', aiResponseContent);
            
            this.showEmotionBubble(NpcEmotions.HAPPY_OPEN_MOUTH); // Or another appropriate emotion
            conversationHistory.push({ role: 'assistant', content: aiResponseContent });
            player.setVariable(HISTORY_VAR, conversationHistory);

            const chunks = this.splitIntoChunks(aiResponseContent);
            for (const chunk of chunks) {
                await player.showText(chunk, { talkWith: this });
            }

        } catch (error) {
            console.error('[MysticVillagerEvent] Error calling AgentDock API:', error instanceof Error ? error.message : String(error));
            this.showEmotionBubble(EmotionBubble.Sweat);
            await player.showText('A disturbance in the astral winds prevents me from answering. Please try again.', { talkWith: this });
            player.setVariable(HISTORY_VAR, conversationHistory); // Save history up to this point
        }
    }
}
