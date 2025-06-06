import { RpgEvent } from '@rpgjs/server'
import { EmotionBubble } from '@rpgjs/plugin-emotion-bubbles'

/**
 * Extends RpgEvent with emotion bubble capabilities
 * This follows the same pattern as the emotion-bubbles plugin but for NPCs
 */
declare module '@rpgjs/server' {
    export interface RpgEvent {
        showEmotionBubble: (emotion: string | EmotionBubble) => void
    }
}

// Add the showEmotionBubble method to the RpgEvent prototype
RpgEvent.prototype.showEmotionBubble = function(emotion: string | EmotionBubble) {
    this.showAnimation('bubble', emotion)
}

/**
 * Utility functions for working with NPC emotions
 */
export const NpcEmotions = {
    /**
     * Maps webhook emotion strings to EmotionBubble enum values
     * @param emotion The emotion string from the webhook
     * @returns The corresponding EmotionBubble enum value
     */
    mapWebhookEmotion(emotion: string): EmotionBubble {
        switch (emotion) {
            case 'think':
                return EmotionBubble.Idea
            case 'idea':
                return EmotionBubble.Idea
            case 'question':
                return EmotionBubble.Question
            case 'like':
                return EmotionBubble.Like
            case 'surprise':
                return EmotionBubble.Surprise
            case 'sad':
                return EmotionBubble.Sad
            case 'happy':
                return EmotionBubble.Happy
            case 'confused':
                return EmotionBubble.Confusion
            case 'exclamation':
                return EmotionBubble.Exclamation
            case 'clock':
            case 'time':
                return EmotionBubble.ThreeDot
            default:
                return EmotionBubble.Idea
        }
    }
}

export default NpcEmotions
