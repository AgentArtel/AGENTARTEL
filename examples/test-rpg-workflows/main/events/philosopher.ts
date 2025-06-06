import { RpgEvent, EventData, RpgPlayer, EventMode, Components } from '@rpgjs/server'
import axios from 'axios'
import { config } from '../utils/config'
import { EmotionBubble } from '@rpgjs/plugin-emotion-bubbles'
import '../utils/npc-emotions' // Import to extend RpgEvent with showEmotionBubble
import { NpcEmotions } from '../utils/npc-emotions'

@EventData({
    name: 'village-philosopher',  // Unique identifier for this NPC
    mode: EventMode.Shared,  // Visible to all players
    hitbox: {
        width: 32,
        height: 16
    }
})
export default class PhilosopherEvent extends RpgEvent {
    onInit() {
        // Using the female sprite as requested
        this.setGraphic('female')
        
        // Add a visual indicator above the NPC
        this.setComponentsTop(Components.text('Philosopher'))
    }
    
    /**
     * Display an emotion above the NPC using the Components system
     * @param emotion The emotion to display
     */
    showEmotion(emotion: string) {
        // Clear existing components first
        this.setComponentsTop(Components.text('Philosopher'))
        
        // Add the emotion bubble animation
        this.showAnimation('bubble', emotion)
        
        // Also display the emotion as text for better visibility
        const emotionText = emotion.charAt(0).toUpperCase() + emotion.slice(1)
        this.setComponentsTop(
            Components.text('Philosopher'),
            Components.text(`(${emotionText})`, { fontSize: 10, color: '#FFD700', y: -10 })
        )
        
        // Reset the components after a delay
        setTimeout(() => {
            this.setComponentsTop(Components.text('Philosopher'))
        }, 5000)
    }
    
    async onAction(player: RpgPlayer) {
        // Track conversation history for this player
        if (!player.getVariable('PHILOSOPHER_HISTORY')) {
            player.setVariable('PHILOSOPHER_HISTORY', [])
        }
        
        // Get conversation history
        const conversationHistory = player.getVariable('PHILOSOPHER_HISTORY') || []
        
        // Initial greeting if this is the first interaction
        if (conversationHistory.length === 0) {
            await player.showText("Greetings, seeker of wisdom. I am Sophia, the village philosopher. How may I illuminate your path today?", {
                talkWith: this
            })
            
            // Add this to conversation history
            conversationHistory.push({
                role: 'assistant',
                content: "Greetings, seeker of wisdom. I am Sophia, the village philosopher. How may I illuminate your path today?"
            })
            player.setVariable('PHILOSOPHER_HISTORY', conversationHistory)
        }
        
        // Show philosophical topic choices
        const choice = await player.showChoices("What philosophical topic interests you?", [
            { text: "The nature of reality", value: 'reality' },
            { text: "The meaning of life", value: 'meaning' },
            { text: "The concept of time", value: 'time' },
            { text: "Ask a custom question", value: 'custom' },
            { text: "Continue our discussion", value: 'continue' }
        ])
        
        if (!choice) return
        
        try {
            let userMessage = ""
            
            // Prepare the user message based on the choice
            if (choice.value === 'reality') {
                userMessage = "Tell me about the nature of reality."
                this.showEmotionBubble(EmotionBubble.Idea)
                await player.showText("Ah, the nature of reality... a profound inquiry. Let me share my thoughts...", {
                    talkWith: this
                })
            }
            else if (choice.value === 'meaning') {
                userMessage = "What is the meaning of life?"
                this.showEmotionBubble(EmotionBubble.Cloud)
                await player.showText("The meaning of life... perhaps the most fundamental question. Allow me to reflect...", {
                    talkWith: this
                })
            }
            else if (choice.value === 'time') {
                userMessage = "Explain the concept of time from a philosophical perspective."
                this.showEmotionBubble(EmotionBubble.ThreeDot)
                await player.showText("Time, that mysterious flow that carries us all. Let me explore this concept with you...", {
                    talkWith: this
                })
            }
            else if (choice.value === 'custom') {
                // Allow the player to ask a custom question
                const customQuestion = await player.showInputBox("What philosophical question would you like to ask?", {
                    talkWith: this
                })
                
                if (!customQuestion || customQuestion.trim() === "") {
                    this.showEmotionBubble(EmotionBubble.Question)
                    await player.showText("I see you're contemplating in silence. Return when you have a question to explore.", {
                        talkWith: this
                    })
                    return
                }
                
                userMessage = customQuestion
                this.showEmotionBubble(EmotionBubble.Exclamation)
                await player.showText("An intriguing question. Let me ponder this...", {
                    talkWith: this
                })
            }
            else if (choice.value === 'continue') {
                // Continue the existing conversation
                userMessage = "Please continue our philosophical discussion."
                this.showEmotionBubble(EmotionBubble.Like)
                await player.showText("Yes, let us delve deeper into our discourse...", {
                    talkWith: this
                })
            }
            
            // Add the user message to conversation history
            conversationHistory.push({
                role: 'user',
                content: userMessage
            })
            
            // Make the API call to get dynamic dialogue
            console.log('Sending dialogue request to webhook:', userMessage)
            const response = await axios.post(config.webhooks.npcDialogue, {
                messages: conversationHistory,
                character: {
                    name: "Sophia",
                    role: "Village Philosopher",
                    background: "A wise and contemplative philosopher who studies the fundamental nature of knowledge, reality, and existence. Sophia speaks in eloquent, thoughtful language and often uses metaphors to explain complex concepts."
                },
                // Request an emotion to be included in the response
                includeEmotion: true
            })
            
            // Log the response for debugging
            console.log('Webhook response:', JSON.stringify(response.data))
            
            // Extract the philosopher's response based on the actual response format
            let philosopherResponse = ''
            let emotion = EmotionBubble.Idea // Default emotion
            
            try {
                // The actual response format is: { index: 0, message: { role: 'assistant', content: '{"response": "...", "emotion": "..."}'}, ... }
                if (response.data && response.data.message && response.data.message.content) {
                    // The content is a JSON string that needs to be parsed
                    const contentJson = JSON.parse(response.data.message.content)
                    console.log('Parsed content:', contentJson)
                    
                    if (contentJson.response) {
                        philosopherResponse = contentJson.response
                    }
                    
                    if (contentJson.emotion) {
                        emotion = NpcEmotions.mapWebhookEmotion(contentJson.emotion)
                    }
                } else if (response.data && typeof response.data === 'string') {
                    philosopherResponse = response.data
                } else {
                    // Fallback response if the API call fails or format is unexpected
                    philosopherResponse = "The mysteries of existence are profound indeed. Perhaps we should contemplate this further when the cosmic energies are more aligned."
                    console.error('Unexpected response format:', response.data)
                }
            } catch (error) {
                console.error('Error parsing webhook response:', error)
                philosopherResponse = "Forgive me, but I seem to be having trouble organizing my thoughts. The complexities of language sometimes fail to capture the essence of philosophical truths."
            }
            
            // Show the philosopher's response with emotion bubbles
            // Split long responses into multiple dialogue boxes (max 200 chars per box)
            const maxLength = 200
            const chunks = []
            
            // Prepare chunks
            for (let i = 0; i < philosopherResponse.length; i += maxLength) {
                chunks.push(philosopherResponse.substring(i, i + maxLength))
            }
            
            // Show emotion bubble before first chunk
            this.showEmotionBubble(emotion)
            
            // Show first chunk
            if (chunks.length > 0) {
                await player.showText(chunks[0], {
                    talkWith: this
                })
            }
            
            // For remaining chunks, show emotion bubble before each one
            for (let i = 1; i < chunks.length; i++) {
                // Show emotion bubble again before each chunk to make it more visible
                this.showEmotionBubble(emotion)
                await player.showText(chunks[i], {
                    talkWith: this
                })
            }
            
            // Add the philosopher's response to conversation history
            conversationHistory.push({
                role: 'assistant',
                content: philosopherResponse
            })
            
            // Limit conversation history to last 10 messages to prevent it from growing too large
            if (conversationHistory.length > 10) {
                conversationHistory.splice(0, conversationHistory.length - 10)
            }
            
            // Update the conversation history in player variables
            player.setVariable('PHILOSOPHER_HISTORY', conversationHistory)
            
            // Closing remark
            await player.showText("Is there more you wish to explore? Return anytime to continue our philosophical journey.", {
                talkWith: this
            })
            
        } catch (error) {
            // Handle errors gracefully
            console.error('Error getting philosopher dialogue:', error)
            await player.showText("Forgive me, but the flow of wisdom seems disrupted today. Perhaps we can continue our discussion another time.", {
                talkWith: this
            })
        }
    }
}
