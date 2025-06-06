import { RpgEvent, EventData, RpgPlayer, EventMode, Components } from '@rpgjs/server'
import axios from 'axios'
import { config } from '../utils/config'
import { EmotionBubble } from '@rpgjs/plugin-emotion-bubbles'
import '../utils/npc-emotions' // Import to extend RpgEvent with showEmotionBubble
import { NpcEmotions } from '../utils/npc-emotions'
import QuestScroll from '../database/items/quest-scroll'

@EventData({
    name: 'village-quest-giver',  // Unique identifier for this NPC
    mode: EventMode.Shared,    // Visible to all players
    hitbox: {
        width: 32,
        height: 16
    }
})
export default class QuestGiverEvent extends RpgEvent {
    // Property to track if we should show the emotion
    shouldShowEmotion = false;
    // Interval for recurring emotion bubble
    emotionInterval: any;

    onInit() {
        // Set the NPC's appearance - using a different sprite than other NPCs
        this.setGraphic('female')
        
        // Add a visual indicator above the NPC
        this.setComponentsTop(Components.text('Quest Master'))

        // Store a reference to this instance for the interval
        const self = this;
        
        // Set up a recurring emotion check every 3 seconds for active quests
        this.emotionInterval = setInterval(() => {
            // If we should show the emotion, do so
            if (self.shouldShowEmotion) {
                self.showEmotionBubble(EmotionBubble.Exclamation)
            }
        }, 3000);
    }
    
    async onAction(player: RpgPlayer) {
        // Track conversation history for this player
        const HISTORY_VAR = 'QUEST_GIVER_HISTORY'
        if (!player.getVariable(HISTORY_VAR)) {
            player.setVariable(HISTORY_VAR, [])
        }
        
        // Get conversation history
        const conversationHistory = player.getVariable(HISTORY_VAR) || []
        
        // Check if player has active quests
        const hasActiveQuest = player.getVariable('ACTIVE_QUEST')
        const questCompleted = player.getVariable('QUEST_COMPLETED')
        
        // If player has completed a quest, handle the reward
        if (questCompleted) {
            await this.handleQuestCompletion(player)
            return
        }
        
        // If player has an active quest, check progress
        if (hasActiveQuest) {
            await this.checkQuestProgress(player)
            return
        }
        
        // Initial greeting if this is the first interaction
        if (conversationHistory.length === 0) {
            this.showEmotionBubble(EmotionBubble.Happy)
            await player.showText("Greetings, adventurer! I am Eldric, the Quest Master of this realm. I have many tasks that need a brave soul like yourself.", {
                talkWith: this
            })
            
            // Add this to conversation history
            conversationHistory.push({
                role: 'assistant',
                content: "Greetings, adventurer! I am Eldric, the Quest Master of this realm. I have many tasks that need a brave soul like yourself."
            })
            player.setVariable(HISTORY_VAR, conversationHistory)
        } else {
            // Returning player greeting
            this.showEmotionBubble(EmotionBubble.Happy)
            await player.showText("Welcome back, adventurer! Ready for a new challenge?", {
                talkWith: this
            })
        }
        
        // Show quest topic choices
        const choice = await player.showChoices("What kind of quest interests you?", [
            { text: "Combat Quest", value: 'combat' },
            { text: "Exploration Quest", value: 'exploration' },
            { text: "Collection Quest", value: 'collection' },
            { text: "Mystery Quest", value: 'mystery' },
            { text: "Ask about the realm", value: 'lore' }
        ])
        
        if (!choice) return
        
        try {
            // Show thinking animation while preparing the quest
            this.showEmotionBubble(EmotionBubble.ThreeDot)
            await player.showText("Let me think of a suitable quest for you...", {
                talkWith: this
            })
            
            let userMessage = ""
            
            // Prepare the user message based on the choice
            if (choice.value === 'combat') {
                userMessage = "Give me a combat quest that involves defeating enemies"
            }
            else if (choice.value === 'exploration') {
                userMessage = "Give me an exploration quest that involves discovering new areas"
            }
            else if (choice.value === 'collection') {
                userMessage = "Give me a collection quest that involves gathering items"
            }
            else if (choice.value === 'mystery') {
                userMessage = "Give me a mystery quest that involves solving puzzles or uncovering secrets"
            }
            else if (choice.value === 'lore') {
                userMessage = "Tell me about the history and lore of this realm"
            }
            
            // Add the user's choice to the conversation history
            conversationHistory.push({
                role: 'user',
                content: userMessage
            })
            
            // Make the API call to get a dynamic response
            console.log('Sending request to quest giver webhook:', {
                messages: conversationHistory,
                questType: choice.value,
                prompt: userMessage,
                playerName: player.name || 'Adventurer'
            });
            
            const response = await axios.post(config.webhooks.questGiver, {
                messages: conversationHistory,
                questType: choice.value,
                prompt: userMessage,  // Include the prompt directly
                playerName: player.name || 'Adventurer',  // Include player name
                format: 'json'  // Request JSON response format
            }, {
                // Add a timeout to prevent hanging on slow responses
                timeout: 10000,
                // Add headers to potentially improve response format
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            })
            
            // Log the raw response for debugging
            console.log('Raw webhook response:', response);
            console.log('Response data:', JSON.stringify(response.data, null, 2));
            
            // Default values for quest properties
            let responseContent = "I'm sorry, I couldn't generate a quest right now. Please try again later."
            let emotion = EmotionBubble.Sad
            let questTitle = `${choice.value.charAt(0).toUpperCase() + choice.value.slice(1)} Quest`
            let questReward = "50 gold"
            let questTarget = 100
            
            // Parse the response data
            try {
                // Check if response has the output field (which contains a JSON string)
                if (response.data && response.data.output) {
                    // Parse the JSON string in the output field
                    const parsedOutput = JSON.parse(response.data.output)
                    console.log('Parsed output JSON:', parsedOutput)
                    
                    // Extract data from the parsed output
                    if (parsedOutput.content) {
                        responseContent = parsedOutput.content
                        console.log('Using content:', responseContent)
                    }
                    
                    if (parsedOutput.emotion) {
                        emotion = NpcEmotions.mapWebhookEmotion(parsedOutput.emotion)
                        console.log('Using emotion:', parsedOutput.emotion)
                    }
                    
                    if (parsedOutput.title) {
                        questTitle = parsedOutput.title
                        console.log('Using title:', questTitle)
                    }
                    
                    if (parsedOutput.reward) {
                        questReward = parsedOutput.reward
                        console.log('Using reward:', questReward)
                    }
                    
                    if (parsedOutput.target) {
                        questTarget = parsedOutput.target
                        console.log('Using target:', questTarget)
                    }
                }
                // Fallback to direct fields if available
                else if (response.data) {
                    if (response.data.content) responseContent = response.data.content
                    if (response.data.emotion) emotion = NpcEmotions.mapWebhookEmotion(response.data.emotion)
                    if (response.data.title) questTitle = response.data.title
                    if (response.data.reward) questReward = response.data.reward
                    if (response.data.target) questTarget = response.data.target
                }
            } catch (error) {
                console.error('Error parsing webhook response:', error)
            }
            
            // Add the assistant's response to the conversation history
            conversationHistory.push({
                role: 'assistant',
                content: responseContent
            })
            
            // Update the conversation history
            player.setVariable(HISTORY_VAR, conversationHistory)
            
            // Show the emotion and the response
            this.showEmotionBubble(emotion)
            await player.showText(responseContent, {
                talkWith: this
            })
            
            // If this is a quest (not lore), give the player a quest scroll
            if (choice.value !== 'lore') {
                console.log('Creating quest scroll with:', { title: questTitle })
                
                // Set the quest scroll details
                QuestScroll.setQuestDetails(
                    questTitle,
                    responseContent,
                    choice.value === 'collection' ? responseContent : 'A beautiful artwork of ' + questTitle
                )
                
                // Give the player the quest scroll item
                player.addItem('quest-scroll', 1)
                
                // Enable the exclamation bubble for active quests
                this.shouldShowEmotion = true
                
                // Show confirmation message
                this.showEmotionBubble(EmotionBubble.Star)
                await player.showText(`Quest accepted: ${questTitle}. Take this scroll to the Artist to commission a painting!`, {
                    talkWith: this
                })
                
                // Show notification
                player.showNotification(`New Quest: ${questTitle}`)
            }
        } catch (error) {
            console.error('Error with quest generation:', error)
            
            // Log more detailed error information if available
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                console.error('Error response data:', error.response.data)
                console.error('Error response status:', error.response.status)
                console.error('Error response headers:', error.response.headers)
            } else if (error.request) {
                // The request was made but no response was received
                console.error('No response received:', error.request)
            } else {
                // Something happened in setting up the request that triggered an Error
                console.error('Error message:', error.message)
            }
            
            // Show an error message
            this.showEmotionBubble(EmotionBubble.Sad)
            await player.showText("I apologize, but I seem to be having trouble recalling the details of that quest. Perhaps we can try again later?", {
                talkWith: this
            })
        }
    }
    
    /**
     * Check if the player has a quest scroll
     */
    async checkQuestProgress(player: RpgPlayer) {
        // Check if the player has the quest scroll item
        const hasQuestScroll = player.hasItem('quest-scroll')
        
        if (!hasQuestScroll) {
            // If the player doesn't have the quest scroll, remind them
            this.showEmotionBubble(EmotionBubble.Idea)
            await player.showText("Don't forget to take the Quest Scroll to the Artist to commission a painting!", {
                talkWith: this
            })
            return
        }
        
        // Check if the quest is completed
        const questCompleted = player.getVariable('QUEST_COMPLETED')
        
        if (questCompleted) {
            // If the quest is completed, handle the reward
            await this.handleQuestCompletion(player)
            return
        }
        
        // If the player has the quest scroll but hasn't completed it yet
        this.showEmotionBubble(EmotionBubble.Idea)
        await player.showText("I see you have the Quest Scroll. Take it to the Artist to commission a painting!", {
            talkWith: this
        })
    }
    
    /**
     * Handle quest completion and rewards
     */
    async handleQuestCompletion(player: RpgPlayer) {
        // Show congratulations
        this.showEmotionBubble(EmotionBubble.Happy)
        await player.showText(`Congratulations on completing your quest! The painting looks beautiful.`, {
            talkWith: this
        })
        
        // Give the player a reward
        player.gold += 50
        player.showNotification('Received: 50 gold')
        
        // Reset quest status
        player.setVariable('QUEST_COMPLETED', false)
        
        // Turn off the exclamation bubble
        this.shouldShowEmotion = false
        
        // Show follow-up message
        this.showEmotionBubble(EmotionBubble.Idea)
        await player.showText("I have more quests available if you're interested. Just speak to me again when you're ready for a new challenge!", {
            talkWith: this
        })
    }
}
