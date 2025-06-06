import { RpgEvent, RpgPlayer } from '@rpgjs/server'
import { EmotionBubble } from '@rpgjs/plugin-emotion-bubbles'

/**
 * Utility functions for displaying emotion bubbles on NPCs and players
 */
export const Emotions = {
    /**
     * Show an emotion bubble on an NPC
     * @param npc The NPC event to show the emotion on
     * @param emotion The emotion to display
     */
    showOnNpc(npc: RpgEvent, emotion: string): void {
        if (npc) {
            // Use the lower-level animation API that works on all events
            npc.showAnimation('bubble', emotion)
        }
    },

    /**
     * Show an emotion bubble on a player
     * @param player The player to show the emotion on
     * @param emotion The emotion to display
     */
    showOnPlayer(player: RpgPlayer, emotion: string): void {
        if (player) {
            player.showEmotionBubble(emotion)
        }
    },

    /**
     * Common emotions for easy access
     */
    Think: 'think',
    Idea: 'idea',
    Question: 'question',
    Exclamation: 'surprise',
    Like: 'like',
    Sad: 'sad',
    Happy: 'happy',
    Surprise: 'surprise',
    Clock: 'clock'
}

export default Emotions
