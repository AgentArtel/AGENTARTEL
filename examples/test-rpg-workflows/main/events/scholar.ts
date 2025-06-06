import { RpgEvent, EventData, RpgPlayer, EventMode, Components } from '@rpgjs/server'
import axios from 'axios'
import { config } from '../utils/config'
import { Emotions } from '../utils/emotions'

@EventData({
    name: 'village-scholar',  // Unique identifier for this NPC
    mode: EventMode.Shared,  // Visible to all players
    hitbox: {
        width: 32,
        height: 16
    }
})
export default class ScholarEvent extends RpgEvent {
    onInit() {
        // Using the female sprite
        this.setGraphic('female')
        
        // Add a visual indicator above the NPC
        this.setComponentsTop(Components.text('Scholar'))
    }
    
    async onAction(player: RpgPlayer) {
        // Track conversation history for this player
        if (!player.getVariable('SCHOLAR_HISTORY')) {
            player.setVariable('SCHOLAR_HISTORY', [])
        }
        
        // Get conversation history
        const conversationHistory = player.getVariable('SCHOLAR_HISTORY') || []
        
        // Initial greeting if this is the first interaction
        if (conversationHistory.length === 0) {
            Emotions.showOnNpc(this, Emotions.Happy)
            await player.showText("Greetings! I am Hypatia, the village scholar. I study the mysteries of the universe and the depths of human knowledge. How may I assist you today?", {
                talkWith: this
            })
            
            // Add this to conversation history
            conversationHistory.push({
                role: 'assistant',
                content: "Greetings! I am Hypatia, the village scholar. I study the mysteries of the universe and the depths of human knowledge. How may I assist you today?"
            })
            player.setVariable('SCHOLAR_HISTORY', conversationHistory)
        }
        
        // Show philosophical topic choices
        const choice = await player.showChoices("What would you like to discuss?", [
            { text: "The nature of knowledge", value: 'knowledge' },
            { text: "The structure of the universe", value: 'universe' },
            { text: "The future of humanity", value: 'future' },
            { text: "Ask a custom question", value: 'custom' },
            { text: "Continue our discussion", value: 'continue' }
        ])
        
        if (!choice) return
        
        try {
            let userMessage = ""
            
            // Prepare the user message based on the choice
            if (choice.value === 'knowledge') {
                userMessage = "Tell me about the nature of knowledge and how we can be certain of what we know."
                Emotions.showOnNpc(this, Emotions.Think)
                await player.showText("Ah, epistemology—the study of knowledge itself. A fascinating inquiry. Let me share my thoughts...", {
                    talkWith: this
                })
            }
            else if (choice.value === 'universe') {
                userMessage = "What is your understanding of the universe's structure and fundamental nature?"
                Emotions.showOnNpc(this, Emotions.Idea)
                await player.showText("The cosmos—vast and mysterious, yet governed by patterns we can discern. Allow me to elaborate...", {
                    talkWith: this
                })
            }
            else if (choice.value === 'future') {
                userMessage = "What do you think the future holds for humanity?"
                Emotions.showOnNpc(this, Emotions.Question)
                await player.showText("The trajectory of human civilization is a subject of great interest. Let me share my perspective...", {
                    talkWith: this
                })
            }
            else if (choice.value === 'custom') {
                // Allow the player to ask a custom question
                const customQuestion = await player.showInputBox("What question would you like to ask?", {
                    talkWith: this
                })
                
                if (!customQuestion || customQuestion.trim() === "") {
                    Emotions.showOnNpc(this, Emotions.Question)
                    await player.showText("I see you're contemplating in silence. Return when you have a question in mind.", {
                        talkWith: this
                    })
                    return
                }
                
                userMessage = customQuestion
                Emotions.showOnNpc(this, Emotions.Think)
                await player.showText("An intriguing question. Let me consider this carefully...", {
                    talkWith: this
                })
            }
            else if (choice.value === 'continue') {
                // Continue the existing conversation
                userMessage = "Please continue our previous discussion."
                Emotions.showOnNpc(this, Emotions.Like)
                await player.showText("Yes, let's continue exploring these ideas further...", {
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
                    name: "Hypatia",
                    role: "Village Scholar",
                    background: "A brilliant and thoughtful scholar who studies astronomy, mathematics, and philosophy. Hypatia speaks with precision and clarity, often drawing connections between different fields of knowledge."
                },
                // Request an emotion to be included in the response
                includeEmotion: true
            })
            
            // Log the response for debugging
            console.log('Webhook response:', JSON.stringify(response.data))
            
            // Extract the scholar's response and emotion
            let scholarResponse = ''
            let emotion = 'think' // Default emotion
            
            try {
                // The response format is: { index: 0, message: { role: 'assistant', content: '{"response": "...", "emotion": "..."}'}, ... }
                if (response.data && response.data.message && response.data.message.content) {
                    // The content is a JSON string that needs to be parsed
                    const contentJson = JSON.parse(response.data.message.content)
                    console.log('Parsed content:', contentJson)
                    
                    if (contentJson.response) {
                        scholarResponse = contentJson.response
                    }
                    
                    if (contentJson.emotion) {
                        emotion = contentJson.emotion
                    }
                } else if (response.data && typeof response.data === 'string') {
                    scholarResponse = response.data
                } else {
                    // Fallback response if the API call fails or format is unexpected
                    scholarResponse = "The interplay of ideas is complex indeed. Perhaps we should revisit this topic when I've had more time to organize my thoughts."
                    console.error('Unexpected response format:', response.data)
                }
            } catch (error) {
                console.error('Error parsing webhook response:', error)
                scholarResponse = "Forgive me, but I seem to be having trouble articulating my thoughts. The complexities of language sometimes fail to capture the nuances of scholarly discourse."
            }
            
            // Show the scholar's response with emotion bubbles
            // Split long responses into multiple dialogue boxes (max 200 chars per box)
            const maxLength = 200
            const chunks = []
            
            // Prepare chunks
            for (let i = 0; i < scholarResponse.length; i += maxLength) {
                chunks.push(scholarResponse.substring(i, i + maxLength))
            }
            
            // Show first chunk with emotion bubble
            if (chunks.length > 0) {
                Emotions.showOnNpc(this, emotion)
                await player.showText(chunks[0], {
                    talkWith: this
                })
            }
            
            // For remaining chunks, show each one
            for (let i = 1; i < chunks.length; i++) {
                // Show emotion bubble again for longer responses
                if (i % 2 === 0) {
                    Emotions.showOnNpc(this, emotion)
                }
                await player.showText(chunks[i], {
                    talkWith: this
                })
            }
            
            // Add the scholar's response to conversation history
            conversationHistory.push({
                role: 'assistant',
                content: scholarResponse
            })
            
            // Limit conversation history to last 10 messages to prevent it from growing too large
            if (conversationHistory.length > 10) {
                conversationHistory.splice(0, conversationHistory.length - 10)
            }
            
            // Update the conversation history in player variables
            player.setVariable('SCHOLAR_HISTORY', conversationHistory)
            
            // Closing remark
            Emotions.showOnNpc(this, Emotions.Like)
            await player.showText("I hope my insights have been helpful. Return anytime to continue our intellectual explorations.", {
                talkWith: this
            })
            
        } catch (error) {
            // Handle errors gracefully
            console.error('Error getting scholar dialogue:', error)
            Emotions.showOnNpc(this, Emotions.Sad)
            await player.showText("Forgive me, but my thoughts seem scattered today. Perhaps we can continue our discussion another time.", {
                talkWith: this
            })
        }
    }
}
