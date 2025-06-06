import { RpgEvent, EventData, RpgPlayer, EventMode, Components } from '@rpgjs/server';
import axios from 'axios';
import { EmotionBubble } from '@rpgjs/plugin-emotion-bubbles';
import '../utils/npc-emotions'; // Extends RpgEvent with showEmotionBubble
import { NpcEmotions } from '../utils/npc-emotions';
import { config } from '../utils/config'; // Import the centralized config

// const PROCESS_FRAGMENT_WEBHOOK_URL_PLACEHOLDER = process.env.PROCESS_FRAGMENT_WEBHOOK_URL || 'https://your-processing-webhook-url.com/placeholder';

interface FragmentDetails {
    fragmentId: string;
    fragmentName: string;
    fragmentType: string;
    mediaUrl: string;
    initialDescription: string;
    initialRevelation: string;
    // Potentially add fields for further revelations
}

@EventData({
    name: 'echo-seer-event',
    mode: EventMode.Shared,
    hitbox: {
        width: 32,
        height: 16
    }
})
export default class EchoSeerNpc extends RpgEvent {
    onInit() {
        this.setGraphic('female'); // Placeholder graphic
        this.setComponentsTop(Components.text('Echo Seer'));
        this.speed = 0; // Stationary
    }

    async onAction(player: RpgPlayer) {
        const hasUnprocessedEcho = player.hasItem('unprocessed-echo');
        const currentFragmentId = player.getVariable('current_fragment_id');

        if (!hasUnprocessedEcho || !currentFragmentId) {
            this.showEmotionBubble(EmotionBubble.Question);
            await player.showText("You don't seem to have an Echo that needs processing, or perhaps the one you have is already fully understood.", { talkWith: this });
            return;
        }

        const fragmentName = player.getVariable('current_fragment_name') || 'your current Echo';
        const fragmentDescription = player.getVariable('current_fragment_description') || 'its mysteries';
        
        // Count existing revelations by checking for variables with increasing index
        let existingRevelationCount = 0;
        while (player.getVariable(`current_fragment_revelation_${existingRevelationCount}`) !== undefined) {
            existingRevelationCount++;
        }

        this.showEmotionBubble(EmotionBubble.Idea);
        const choice = await player.showChoices(`I sense you hold an Echo: '${fragmentName}'. It whispers of '${fragmentDescription}'. Would you like me to delve deeper into its meaning? This will be revelation number ${existingRevelationCount}.`, [
            { text: 'Yes, reveal more!', value: 'process' },
            { text: 'Not right now.', value: 'cancel' }
        ], { talkWith: this });

        if (!choice || choice.value === 'cancel') {
            this.showEmotionBubble(EmotionBubble.ThreeDot);
            await player.showText("Very well. Return when you are ready to explore its depths.", { talkWith: this });
            return;
        }

        if (choice.value === 'process') {
            this.showEmotionBubble(EmotionBubble.Idea);
            await player.showText("Let me focus on the Echo's resonance...", { talkWith: this, autoNext: true, time: 1500 });

            const fragmentDetails: Partial<FragmentDetails> = {
                fragmentId: currentFragmentId,
                fragmentName: fragmentName,
                fragmentType: player.getVariable('current_fragment_type'),
                mediaUrl: player.getVariable('current_fragment_mediaUrl'),
                initialDescription: fragmentDescription,
                initialRevelation: player.getVariable('current_fragment_revelation_0')
            };
            
            // Add existing revelations to the payload if needed by the AI
            const allRevelations: string[] = [];
            for(let i = 0; i < existingRevelationCount; i++) {
                const rev = player.getVariable(`current_fragment_revelation_${i}`);
                if (rev) allRevelations.push(rev as string);
            }

            const payload = {
                actionType: 'process_fragment_stage_' + existingRevelationCount,
                playerId: player.id,
                fragment_details: fragmentDetails,
                existing_revelations: allRevelations,
                system_prompt: `As the Echo Seer AI, the player has brought you a media fragment (${fragmentDetails.fragmentType}) named '${fragmentDetails.fragmentName}' with the URL ${fragmentDetails.mediaUrl}. Its initial description is '${fragmentDetails.initialDescription}'. The known revelations so far are: [${allRevelations.join('; ')}]. Provide the NEXT layer of revelation for this fragment. It should build upon the existing information, adding depth and mystery. Respond with a JSON object containing 'newRevelationText' and an 'emotion' (e.g., 'think', 'surprise', 'happy').`
            };

            console.log('[EchoSeerNpc] Preparing to call processing webhook. Payload:', payload);

            try {
                const webhookUrl = config.getWebhookUrl('processing', 'mediaFragment');
                if (!webhookUrl || webhookUrl.includes('placeholder')) {
                    console.error("'mediaFragment' webhook URL under 'processing' category is not configured, is a placeholder, or config.getWebhookUrl returned empty.");
                    this.showEmotionBubble(EmotionBubble.Sad);
                    await player.showText("My connection to the deeper echoes is disrupted. I cannot process this now.", { talkWith: this });
                    return;
                }

                const response = await axios.post(webhookUrl, payload);
                console.log('[EchoSeerNpc] Raw processing webhook response status:', response.status);
                console.log('[EchoSeerNpc] Raw processing webhook response body:', response.data);

                if (response.data && response.data.newRevelationText) {
                    const newRevelation = response.data.newRevelationText;
                    const emotionStr = response.data.emotion || 'idea';
                    this.showEmotionBubble(NpcEmotions.mapWebhookEmotion(emotionStr));

                    player.setVariable(`current_fragment_revelation_${existingRevelationCount}`, newRevelation);
                    await player.showText(`The Echo resonates anew: "${newRevelation}"`, { talkWith: this });
                    
                    // Potentially remove the 'Unprocessed Echo' if it's considered 'processed' now, or change its state.
                    // For now, we assume multiple processing stages are possible on the same 'Unprocessed Echo' item instance.
                    // If it were a one-time processing, you might do: player.removeItem('unprocessed-echo', 1);

                } else {
                    this.showEmotionBubble(EmotionBubble.Confusion);
                    await player.showText("The Echo's voice is faint... I couldn't quite grasp its deeper meaning this time.", { talkWith: this });
                    console.error('[EchoSeerNpc] Unexpected response from processing webhook:', response.data);
                }

            } catch (error: any) {
                console.error('[EchoSeerNpc] Error processing fragment:', error.message || error);
                this.showEmotionBubble(EmotionBubble.Sad);
                await player.showText("An interference... the Echo's true voice is muddled. Please try again later.", { talkWith: this });
            }
        }
    }
}
