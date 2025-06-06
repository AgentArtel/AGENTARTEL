import { RpgEvent, EventData, RpgPlayer, EventMode, Components } from '@rpgjs/server'
import axios from 'axios'
import { config } from '../utils/config'
import { EmotionBubble } from '@rpgjs/plugin-emotion-bubbles'

@EventData({
    name: 'village-sage',  // Unique identifier for this NPC
    mode: EventMode.Shared,  // Visible to all players
    hitbox: {
        width: 32,
        height: 16
    }
})
export default class SageEvent extends RpgEvent {
    onInit() {
        // Using the female sprite
        this.setGraphic('female')
        
        // Add a visual indicator above the NPC
        this.setComponentsTop(Components.text('Sage'))
    }
    
    async onAction(player: RpgPlayer) {
        // Track conversation history for this player
        if (!player.getVariable('SAGE_HISTORY')) {
            player.setVariable('SAGE_HISTORY', [])
        }
        
        // Get conversation history
        const conversationHistory = player.getVariable('SAGE_HISTORY') || []
        
        // Initial greeting if this is the first interaction
        if (conversationHistory.length === 0) {
            await player.showText("I am Athena, the village sage. My knowledge spans the cosmos and the depths of human understanding. How may I illuminate your path?", {
                talkWith: this
            })
            
            // Add this to conversation history
            conversationHistory.push({
                role: 'assistant',
                content: "I am Athena, the village sage. My knowledge spans the cosmos and the depths of human understanding. How may I illuminate your path?"
            })
            player.setVariable('SAGE_HISTORY', conversationHistory)
        }
        
        // Show philosophical topic choices
        const choice = await player.showChoices("What wisdom do you seek?", [
            { text: "The nature of existence", value: 'existence' },
            { text: "The pursuit of happiness", value: 'happiness' },
            { text: "The concept of free will", value: 'freewill' },
            { text: "Ask a custom question", value: 'custom' },
            { text: "Continue our discussion", value: 'continue' }
        ])
        
        if (!choice) return
        
        try {
            let userMessage = ""
            
            // Prepare the user message based on the choice
            if (choice.value === 'existence') {
                userMessage = "Tell me about the nature of existence."
                player.showEmotionBubble(EmotionBubble.Think)
                await player.showText("Ah, the nature of existence... a profound inquiry. Let me share my thoughts...", {
                    talkWith: this
                })
            }
            else if (choice.value === 'happiness') {
                userMessage = "What is true happiness and how can one achieve it?"
                player.showEmotionBubble(EmotionBubble.Idea)
                await player.showText("Happiness, that elusive treasure sought by all... Allow me to reflect on its true nature...", {
                    talkWith: this
                })
            }
            else if (choice.value === 'freewill') {
                userMessage = "Do humans truly have free will?"
                player.showEmotionBubble(EmotionBubble.Question)
                await player.showText("Free will, the cornerstone of human identity, yet so difficult to define... Let me explore this concept with you...", {
                    talkWith: this
                })
            }
            else if (choice.value === 'custom') {
                // Allow the player to ask a custom question
                const customQuestion = await player.showInputBox("What philosophical question would you like to ask?", {
                    talkWith: this
                })
                
                if (!customQuestion || customQuestion.trim() === "") {
                    player.showEmotionBubble(EmotionBubble.Question)
                    await player.showText("I see you're contemplating in silence. Return when you have a question to explore.", {
                        talkWith: this
                    })
                    return
                }
                
                userMessage = customQuestion
                player.showEmotionBubble(EmotionBubble.Think)
                await player.showText("An intriguing question. Let me ponder this for a moment...", {
                    talkWith: this
                })
            }
            else if (choice.value === 'continue') {
                // Continue the existing conversation
                userMessage = "Please continue our philosophical discussion."
                player.showEmotionBubble(EmotionBubble.Like)
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
                    name: "Athena",
                    role: "Village Sage",
                    background: "A wise and contemplative sage who studies the fundamental nature of knowledge, reality, and existence. Athena speaks in eloquent, thoughtful language and often uses metaphors to explain complex concepts."
                },
                // Request an emotion to be included in the response
                includeEmotion: true
            })
            
            // Log the response for debugging
            console.log('Webhook response:', JSON.stringify(response.data))
            
            // Extract the sage's response and emotion
            let sageResponse = ''
            let emotion = EmotionBubble.Think // Default emotion
            
            try {
                // The response format is: { index: 0, message: { role: 'assistant', content: '{"response": "...", "emotion": "..."}'}, ... }
                if (response.data && response.data.message && response.data.message.content) {
                    // The content is a JSON string that needs to be parsed
                    const contentJson = JSON.parse(response.data.message.content)
                    console.log('Parsed content:', contentJson)
                    
                    if (contentJson.response) {
                        sageResponse = contentJson.response
                    }
                    
                    // Map the emotion string to EmotionBubble enum
                    if (contentJson.emotion) {
                        switch (contentJson.emotion) {
                            case 'think':
                                emotion = EmotionBubble.Think
                                break
                            case 'idea':
                                emotion = EmotionBubble.Idea
                                break
                            case 'question':
                                emotion = EmotionBubble.Question
                                break
                            case 'like':
                                emotion = EmotionBubble.Like
                                break
                            case 'surprise':
                                emotion = EmotionBubble.Surprise
                                break
                            case 'sad':
                                emotion = EmotionBubble.Sad
                                break
                            case 'happy':
                                emotion = EmotionBubble.Happy
                                break
                            default:
                                emotion = EmotionBubble.Think
                        }
                    }
                } else if (response.data && typeof response.data === 'string') {
                    sageResponse = response.data
                } else {
                    // Fallback response if the API call fails or format is unexpected
                    sageResponse = "The mysteries of existence are profound indeed. Perhaps we should contemplate this further when the cosmic energies are more aligned."
                    console.error('Unexpected response format:', response.data)
                }
            } catch (error) {
                console.error('Error parsing webhook response:', error)
                sageResponse = "Forgive me, but I seem to be having trouble organizing my thoughts. The complexities of language sometimes fail to capture the essence of philosophical truths."
            }
            
            // Show the sage's response with emotion bubbles
            // Split long responses into multiple dialogue boxes (max 200 chars per box)
            const maxLength = 200
            const chunks = []
            
            // Prepare chunks
            for (let i = 0; i < sageResponse.length; i += maxLength) {
                chunks.push(sageResponse.substring(i, i + maxLength))
            }
            
            // Show first chunk with emotion bubble
            if (chunks.length > 0) {
                player.showEmotionBubble(emotion)
                await player.showText(chunks[0], {
                    talkWith: this
                })
            }
            
            // For remaining chunks, show each one
            for (let i = 1; i < chunks.length; i++) {
                // Show emotion bubble again for longer responses
                if (i % 2 === 0) {
                    player.showEmotionBubble(emotion)
                }
                await player.showText(chunks[i], {
                    talkWith: this
                })
            }
            
            // Add the sage's response to conversation history
            conversationHistory.push({
                role: 'assistant',
                content: sageResponse
            })
            
            // Limit conversation history to last 10 messages to prevent it from growing too large
            if (conversationHistory.length > 10) {
                conversationHistory.splice(0, conversationHistory.length - 10)
            }
            
            // Update the conversation history in player variables
            player.setVariable('SAGE_HISTORY', conversationHistory)
            
            // Closing remark
            player.showEmotionBubble(EmotionBubble.Like)
            await player.showText("Is there more you wish to explore? Return anytime to continue our philosophical journey.", {
                talkWith: this
            })
            
        } catch (error) {
            // Handle errors gracefully
            console.error('Error getting sage dialogue:', error)
            player.showEmotionBubble(EmotionBubble.Sad)
            await player.showText("Forgive me, but the flow of wisdom seems disrupted today. Perhaps we can continue our discussion another time.", {
                talkWith: this
            })
        }
    }
}
