import { RpgEvent, EventData, RpgPlayer, EventMode, Components } from '@rpgjs/server'
import axios from 'axios'
import { config } from '../utils/config'
import { EmotionBubble } from '@rpgjs/plugin-emotion-bubbles'
import '../utils/npc-emotions' // Import to extend RpgEvent with showEmotionBubble
import { NpcEmotions } from '../utils/npc-emotions'

@EventData({
    name: 'village-mentor',  // Unique identifier for this NPC
    mode: EventMode.Shared,  // Visible to all players
    hitbox: {
        width: 32,
        height: 16
    }
})
export default class MentorEvent extends RpgEvent {
    onInit() {
        // Using the female sprite
        this.setGraphic('female')
        
        // Add a visual indicator above the NPC
        this.setComponentsTop(Components.text('Mentor'))
    }
    
    async onAction(player: RpgPlayer) {
        // Track conversation history for this player
        if (!player.getVariable('MENTOR_HISTORY')) {
            player.setVariable('MENTOR_HISTORY', [])
        }
        
        // Get conversation history
        const conversationHistory = player.getVariable('MENTOR_HISTORY') || []
        
        // Initial greeting if this is the first interaction
        if (conversationHistory.length === 0) {
            this.showEmotionBubble(EmotionBubble.Happy)
            await player.showText("Welcome, seeker of wisdom. I am Minerva, the village mentor. My purpose is to guide those who wish to understand the deeper truths of existence.", {
                talkWith: this
            })
            
            // Add this to conversation history
            conversationHistory.push({
                role: 'assistant',
                content: "Welcome, seeker of wisdom. I am Minerva, the village mentor. My purpose is to guide those who wish to understand the deeper truths of existence."
            })
            player.setVariable('MENTOR_HISTORY', conversationHistory)
        }
        
        // Show philosophical topic choices
        const choice = await player.showChoices("What wisdom do you seek today?", [
            { text: "The meaning of wisdom", value: 'wisdom' },
            { text: "Finding inner peace", value: 'peace' },
            { text: "Overcoming challenges", value: 'challenges' },
            { text: "Ask a custom question", value: 'custom' },
            { text: "Continue our discussion", value: 'continue' }
        ])
        
        if (!choice) return
        
        try {
            let userMessage = ""
            
            // Prepare the user message based on the choice
            if (choice.value === 'wisdom') {
                userMessage = "What is true wisdom and how can one cultivate it?"
                this.showEmotionBubble(EmotionBubble.Idea)
                await player.showText("Ah, wisdom—the treasure sought by all who value the examined life. Let me share my perspective...", {
                    talkWith: this
                })
            }
            else if (choice.value === 'peace') {
                userMessage = "How can one find inner peace in a chaotic world?"
                this.showEmotionBubble(EmotionBubble.Cloud)
                await player.showText("Inner peace, that elusive state of tranquility amidst life's storms. Allow me to reflect on this...", {
                    talkWith: this
                })
            }
            else if (choice.value === 'challenges') {
                userMessage = "What is the best approach to overcoming life's challenges?"
                this.showEmotionBubble(EmotionBubble.Star)
                await player.showText("Life presents us with obstacles that test our resolve and character. Let me share what I've learned...", {
                    talkWith: this
                })
            }
            else if (choice.value === 'custom') {
                // Allow the player to ask a custom question
                const customQuestion = await player.showInputBox("What question would you like to ask?", {
                    talkWith: this
                })
                
                if (!customQuestion || customQuestion.trim() === "") {
                    this.showEmotionBubble(EmotionBubble.Question)
                    await player.showText("I see you're contemplating in silence. Return when your question has formed in your mind.", {
                        talkWith: this
                    })
                    return
                }
                
                userMessage = customQuestion
                this.showEmotionBubble(EmotionBubble.Idea)
                await player.showText("A thoughtful inquiry. Let me consider this carefully...", {
                    talkWith: this
                })
            }
            else if (choice.value === 'continue') {
                // Continue the existing conversation
                userMessage = "Please continue our previous discussion."
                this.showEmotionBubble(EmotionBubble.Like)
                await player.showText("Yes, let us continue our exploration of these ideas...", {
                    talkWith: this
                })
            }
            
            // Add the user message to conversation history
            conversationHistory.push({
                role: 'user',
                content: userMessage
            })
            
            // Show a thinking emotion while waiting for the API response
            this.showEmotionBubble(EmotionBubble.ThreeDot)
            
            // Make the API call to get dynamic dialogue
            console.log('Sending dialogue request to webhook:', userMessage)
            const response = await axios.post(config.webhooks.npcDialogue, {
                messages: conversationHistory,
                character: {
                    name: "Minerva",
                    role: "Village Mentor",
                    background: "A wise and compassionate mentor who guides others on their path to self-discovery and understanding. Minerva speaks with warmth and clarity, drawing from a deep well of experience and insight."
                },
                // Request an emotion to be included in the response
                includeEmotion: true
            })
            
            // Log the response for debugging
            console.log('Webhook response:', JSON.stringify(response.data))
            
            // Extract the mentor's response and emotion
            let mentorResponse = ''
            let emotion = EmotionBubble.Idea // Default emotion
            
            try {
                // The response format is: { index: 0, message: { role: 'assistant', content: '{"response": "...", "emotion": "..."}'}, ... }
                if (response.data && response.data.message && response.data.message.content) {
                    // The content is a JSON string that needs to be parsed
                    const contentJson = JSON.parse(response.data.message.content)
                    console.log('Parsed content:', contentJson)
                    
                    if (contentJson.response) {
                        mentorResponse = contentJson.response
                    }
                    
                    // Map the emotion string to EmotionBubble enum
                    if (contentJson.emotion) {
                        emotion = NpcEmotions.mapWebhookEmotion(contentJson.emotion)
                    }
                } else if (response.data && typeof response.data === 'string') {
                    mentorResponse = response.data
                } else {
                    // Fallback response if the API call fails or format is unexpected
                    mentorResponse = "The path of wisdom often winds through unexpected terrain. Perhaps we should revisit this topic when the way forward becomes clearer."
                    console.error('Unexpected response format:', response.data)
                }
            } catch (error) {
                console.error('Error parsing webhook response:', error)
                mentorResponse = "Forgive me, but I find myself at a loss for words. Sometimes the deepest truths resist being captured in language."
            }
            
            // Show the mentor's response with emotion bubbles
            // Split long responses into multiple dialogue boxes (max 200 chars per box)
            const maxLength = 200
            const chunks = []
            
            // Prepare chunks
            for (let i = 0; i < mentorResponse.length; i += maxLength) {
                chunks.push(mentorResponse.substring(i, i + maxLength))
            }
            
            // Show first chunk with emotion bubble
            if (chunks.length > 0) {
                this.showEmotionBubble(emotion)
                await player.showText(chunks[0], {
                    talkWith: this
                })
            }
            
            // For remaining chunks, show each one
            for (let i = 1; i < chunks.length; i++) {
                // Show emotion bubble again for longer responses
                if (i % 2 === 0) {
                    this.showEmotionBubble(emotion)
                }
                await player.showText(chunks[i], {
                    talkWith: this
                })
            }
            
            // Add the mentor's response to conversation history
            conversationHistory.push({
                role: 'assistant',
                content: mentorResponse
            })
            
            // Limit conversation history to last 10 messages to prevent it from growing too large
            if (conversationHistory.length > 10) {
                conversationHistory.splice(0, conversationHistory.length - 10)
            }
            
            // Update the conversation history in player variables
            player.setVariable('MENTOR_HISTORY', conversationHistory)
            
            // Closing remark
            this.showEmotionBubble(EmotionBubble.Like)
            await player.showText("I hope my guidance has been of value. Return whenever you seek further wisdom on your journey.", {
                talkWith: this
            })
            
        } catch (error) {
            // Handle errors gracefully
            console.error('Error getting mentor dialogue:', error)
            this.showEmotionBubble(EmotionBubble.Sad)
            await player.showText("Forgive me, but I find my thoughts clouded today. Perhaps we can continue our discussion when clarity returns.", {
                talkWith: this
            })
        }
    }
}
