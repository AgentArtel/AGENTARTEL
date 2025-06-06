import { RpgEvent, EventData, RpgPlayer, EventMode, Components } from '@rpgjs/server';
import { EmotionBubble } from '@rpgjs/plugin-emotion-bubbles';
import '../utils/npc-emotions'; // Import to extend RpgEvent with showEmotionBubble
import { NpcEmotions } from '../utils/npc-emotions';
import { config } from '../utils/config';

const HISTORY_VAR = 'AURA_WEAVER_ELARA_HISTORY';
const MAX_HISTORY_LENGTH = 10; // Keep the last 5 pairs of user/assistant messages

@EventData({
    name: 'aura-weaver-elara-event', // This MUST match the object name in Tiled
    mode: EventMode.Shared,
    hitbox: {
        width: 32,
        height: 16
    }
})
export default class AuraWeaverElaraEvent extends RpgEvent {
    onInit() {
        this.setGraphic('female'); // Placeholder - change to Elara's specific sprite later
        this.setComponentsTop(Components.text('Elara, Aura Weaver'));
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
            this.showEmotionBubble(EmotionBubble.Exclamation); // Or a more serene bubble if available
            const greeting = "Welcome, seeker. The air around you hums with untold stories. What energies do you wish for me to perceive?";
            await player.showText(greeting, { talkWith: this });
            conversationHistory.push({ role: 'assistant', content: greeting });
        }

        const choice = await player.showChoices('How may I assist you with my sight?', [
            { text: 'Can you read my aura?', value: 'Can you tell me about my current aura?' },
            { text: 'What do you sense about this place?', value: 'What energies do you perceive in our surroundings?' },
            { text: 'Tell me about your Resonance Orb.', value: 'Can you explain more about your Resonance Orb and how it works?' },
            { text: 'Nothing right now, thank you.', value: 'nevermind' }
        ], { talkWith: this });

        let playerInput: string | null = null;
        if (choice) {
            playerInput = choice.value;
        }

        if (!playerInput || playerInput === 'nevermind' || playerInput.trim() === '') {
            this.showEmotionBubble(EmotionBubble.Sleep); // Or a gentle smile/nod
            await player.showText("May your path be clear until we meet again.", { talkWith: this });
            return;
        }

        this.showEmotionBubble(EmotionBubble.DotDotDot); // Focusing emotion
        conversationHistory.push({ role: 'user', content: playerInput });

        // Keep history from growing too large
        if (conversationHistory.length > MAX_HISTORY_LENGTH * 2) {
            conversationHistory = conversationHistory.slice(-MAX_HISTORY_LENGTH * 2);
        }

        const agentDockUrl = config.getAgentDockChatUrl('auraWeaverElara');
        console.log(`[AuraWeaverElaraEvent] Attempting to contact AgentDock at: ${agentDockUrl}`);
        if (!agentDockUrl) {
            console.error('AuraWeaverElaraEvent: AgentDock URL for auraWeaverElara is not configured.');
            await player.showText('My connection to the weave of energies is faint. Please try again later.', { talkWith: this });
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
            console.log('[AuraWeaverElaraEvent] Sent to AgentDock:', JSON.stringify({ messages: conversationHistory.slice(-4) }, null, 2));

            console.log(`[AuraWeaverElaraEvent] Received response status: ${response.status}`);
            if (!response.ok) {
                const errorData = await response.text();
                console.error(`[AuraWeaverElaraEvent] API Error ${response.status}:`, errorData);
                this.showEmotionBubble(EmotionBubble.No);
                await player.showText('The auras are muddled at this moment. Try rephrasing your query or allow the energies to settle.', { talkWith: this });
                player.setVariable(HISTORY_VAR, conversationHistory);
                return;
            }

            const responseText = await response.text();
            console.log('[AuraWeaverElaraEvent] Raw API response text:', responseText);
            let aiResponseContent = 'The flow of energies is indistinct right now...'; // Default message

            try {
                const data = JSON.parse(responseText);
                if (data.choices && data.choices.length > 0 && data.choices[0].message && data.choices[0].message.content) {
                    aiResponseContent = data.choices[0].message.content;
                } else if (data.message) {
                    aiResponseContent = data.message;
                } else {
                    console.warn('[AuraWeaverElaraEvent] Standard JSON parse successful, but unexpected structure. Will attempt stream parse if content is default.', data);
                    if (aiResponseContent === 'The flow of energies is indistinct right now...') throw new Error('Standard JSON parsed but no content found, trying stream.');
                }
            } catch (e) {
                console.warn('[AuraWeaverElaraEvent] Standard JSON.parse failed or content not found. Attempting to parse as Vercel AI SDK stream. Error:', e instanceof Error ? e.message : String(e));
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
                            console.warn('[AuraWeaverElaraEvent] Could not parse stream line part content:', line.substring(2), 'Error:', parseError);
                        }
                    }
                }
                if (hasStreamData) {
                    aiResponseContent = accumulatedContent;
                    console.log('[AuraWeaverElaraEvent] Successfully parsed stream content.');
                } else {
                    console.error('[AuraWeaverElaraEvent] Failed to parse responseText as standard JSON or Vercel stream. Content remains default.');
                }
            }
            console.log('[AuraWeaverElaraEvent] Final Parsed AI response content:', aiResponseContent);
            
            this.showEmotionBubble(NpcEmotions.HAPPY_OPEN_MOUTH); // Or a more fitting emotion for Elara
            conversationHistory.push({ role: 'assistant', content: aiResponseContent });
            player.setVariable(HISTORY_VAR, conversationHistory);

            const chunks = this.splitIntoChunks(aiResponseContent);
            for (const chunk of chunks) {
                await player.showText(chunk, { talkWith: this });
            }

        } catch (error) {
            console.error('[AuraWeaverElaraEvent] Error calling AgentDock API:', error instanceof Error ? error.message : String(error));
            this.showEmotionBubble(EmotionBubble.Sweat);
            await player.showText('A sudden dissonance in the energies prevents me from answering. Please try again when the currents are calmer.', { talkWith: this });
            player.setVariable(HISTORY_VAR, conversationHistory);
        }
    }
}
