import { RpgEvent, EventData, RpgPlayer, EventMode, Components } from '@rpgjs/server';
import { EmotionBubble } from '@rpgjs/plugin-emotion-bubbles';
import '../utils/npc-emotions'; // Extends RpgEvent with showEmotionBubble
import { config } from '../utils/config'; // Import the centralized config

// Define the expected structure of the webhook response
interface FragmentData {
    fragmentId: string;
    fragmentName: string;
    fragmentType: string;
    mediaUrl: string;
    initialDescription: string;
    initialRevelation: string;
}

@EventData({
    name: 'echo-weaver-event', // This is the name you'll use in Tiled
    mode: EventMode.Shared,
    hitbox: {
        width: 32,
        height: 16
    }
})
export default class EchoWeaverNpc extends RpgEvent {
    onInit() {
        this.setGraphic('female'); // You can change this to any sprite graphic name
        this.speed = 0; // Makes the NPC stationary
    }

    async onAction(player: RpgPlayer) {
        // Check if the player already has an active fragment to prevent getting multiple initial fragments
        if (player.getVariable('current_fragment_id')) {
            const existingFragmentName = player.getVariable('current_fragment_name') || 'your current Echo';
            await player.showText(
                `You are already attuned to ${existingFragmentName}. Seek its meaning before drawing forth another.`,
                { talkWith: this }
            );
            return;
        }

        await player.showText(
            "The echoes of Artelio resonate around you, seeker. Some are faint, others cry out to be understood. Allow me to draw one forth for you...",
            { talkWith: this }
        );

        const webhookUrl = config.getWebhookUrl('generation', 'initialFragment');
        if (!webhookUrl || webhookUrl.includes('placeholder')) {
            console.error("GET_ITEM_WEBHOOK_URL is not defined in .env file.");
            await player.showText("My connection to the echoes is faint today. Please return later.", { talkWith: this });
            return;
        }

        const systemPrompt = "As an AI agent for the game 'Fractal of You', generate the details for an initial media fragment. The player has just started their journey in the world of Artelio. This first fragment should be mysterious, hinting at deeper meanings without full disclosure. Provide a `fragmentId`, `fragmentName`, `fragmentType` (choose one from 'audio', 'image', 'video'), a placeholder `mediaUrl` (e.g., 'https://example.com/media/placeholder.[ext]' where [ext] is appropriate for the type), an `initialDescription` that evokes curiosity, and a brief `initialRevelation` that is enigmatic. The fragment should feel like a lost piece of the player's own fractal identity, not explicitly tied to Clarity or Chaos yet.";
        
        const payload = {
            system_prompt: systemPrompt,
            actionType: "generate_initial_fragment",
            playerId: player.id 
        };

        try {
            // Display a thinking bubble or message
            this.showEmotionBubble(EmotionBubble.Idea); // Show 'idea' bubble
            await player.showText("Hmm, let me concentrate...", { talkWith: this, autoNext: true, time: 1500 });

            console.log('[EchoWeaverNpc] Preparing to call webhook. Payload:', payload);

            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            console.log('[EchoWeaverNpc] Raw webhook response status:', response.status);
            const responseBody = await response.text(); // Get text first for logging
            console.log('[EchoWeaverNpc] Raw webhook response body:', responseBody);

            if (!response.ok) {
                let errorMessage = '';
                try {
                    const errorData = JSON.parse(responseBody); // Try to parse if it's JSON
                    errorMessage = errorData.message || errorData.error || responseBody;
                } catch (e) { /* ignore parsing error, use raw text */ }
                console.error(`[EchoWeaverNpc] Error fetching initial fragment: ${errorMessage}`);
                this.showEmotionBubble(EmotionBubble.Sad); // Show 'sad' bubble on error
                await player.showText(`I tried to weave an Echo for you, but something went awry with the threads... (Error: ${response.status})`, { talkWith: this });
                return;
            }

            const result = JSON.parse(responseBody);
            
            let fragmentData: FragmentData | null = null; // Initialize to null

            if (result.output && typeof result.output === 'string') {
                const jsonBlockRegex = /```json\s*([\s\S]*?)\s*```/;
                const match = result.output.match(jsonBlockRegex);

                if (match && match[1]) {
                    const innerJsonString = match[1];
                    try {
                        fragmentData = JSON.parse(innerJsonString);
                    } catch (e: any) {
                        console.error('[EchoWeaverNpc] Failed to parse JSON from code block:', e.message, "Content was:", innerJsonString);
                        this.showEmotionBubble(EmotionBubble.Confusion);
                        await player.showText("The Echo's form was distorted. I couldn't quite make it out clearly.", { talkWith: this });
                        return;
                    }
                } else {
                    // Output does not contain the expected ```json ... ``` block for a fragment
                    console.warn('[EchoWeaverNpc] Webhook response output did not contain the expected JSON code block for a fragment. Output was:', result.output);
                    this.showEmotionBubble(EmotionBubble.Question);
                    await player.showText("The echoes are faint and muddled today. I couldn't draw forth a distinct fragment for you.", { talkWith: this });
                    return;
                }
            } else if (typeof result === 'object' && result.fragmentId) {
                // This case handles if the webhook directly returns the fragment data (not nested in an 'output' string)
                fragmentData = result as FragmentData;
            } else {
                 console.error("[EchoWeaverNpc] Unexpected webhook response structure (neither 'output' string with JSON block nor direct fragment object):", result);
                this.showEmotionBubble(EmotionBubble.Sad);
                await player.showText("The echo I drew was... elusive. Its essence slipped away. Please try again.", { talkWith: this });
                return;
            }

            if (!fragmentData) {
                // This case should ideally not be reached if the above logic is sound, but as a fallback:
                console.error("[EchoWeaverNpc] Could not extract valid fragment data from webhook response for an unknown reason. Response object:", result);
                this.showEmotionBubble(EmotionBubble.Sad);
                await player.showText("I reached for an Echo, but it vanished before I could grasp it. My apologies.", { talkWith: this });
                return;
            }

            console.log('[EchoWeaverNpc] Successfully parsed fragment data:', fragmentData);
            this.showEmotionBubble(EmotionBubble.Happy); // Show 'happy' bubble on success

            // Store fragment details as player variables
            player.setVariable('current_fragment_id', fragmentData.fragmentId);
            player.setVariable('current_fragment_name', fragmentData.fragmentName);
            player.setVariable('current_fragment_type', fragmentData.fragmentType);
            player.setVariable('current_fragment_mediaUrl', fragmentData.mediaUrl);
            player.setVariable('current_fragment_description', fragmentData.initialDescription);
            player.setVariable('current_fragment_revelation_0', fragmentData.initialRevelation); // Storing the first revelation
            console.log('[EchoWeaverNpc] Fragment data stored in player variables.');

            player.addItem('unprocessed-echo', 1);
            player.showNotification('Received: Unprocessed Echo');

            await player.showText(
                `Ah, the threads have formed an Echo: '${fragmentData.fragmentName}'. It is a ${fragmentData.fragmentType} fragment that whispers of '${fragmentData.initialDescription}'.`,
                { talkWith: this }
            );
            await player.showText(
                `A deeper current reveals: "${fragmentData.initialRevelation}". Ponder this, and we shall speak more. Hold onto this Echo. Seek others in Artelio who can unravel its deeper meanings. The paths of Clarity and Chaos may offer different perspectives on what you find.`,
                { talkWith: this }
            );

        } catch (error: any) {
            // player.stopAnimation(this.id); // This was causing an error, animations usually stop on their own or are replaced
            console.error('[EchoWeaverNpc] Failed to process fragment:', error);
            this.showEmotionBubble(EmotionBubble.Confusion); // Show 'confusion' bubble on general error
            await player.showText("I seem to have tangled the threads of fate... My apologies, I couldn't retrieve your Echo.", { talkWith: this });
        }
    }
}
