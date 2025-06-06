import { RpgEvent, EventData, RpgPlayer, EventMode, Components } from '@rpgjs/server'
import axios from 'axios'
import PlayerPhoto from '../database/items/player-photo'
import { config } from '../utils/config'
import { EmotionBubble } from '@rpgjs/plugin-emotion-bubbles'
import '../utils/npc-emotions' // Import to extend RpgEvent with showEmotionBubble

@EventData({
    name: 'village-photographer',  // Unique identifier for this NPC
    mode: EventMode.Shared,  // Visible to all players
    hitbox: {
        width: 32,
        height: 16
    }
})
export default class PhotographerEvent extends RpgEvent {
    /**
     * Give the player their portrait after it has developed
     */
    async givePlayerPortrait(player: RpgPlayer) {
        // Get the saved image URL from player variables
        const imageUrl = player.getVariable('PLAYER_PHOTO_URL') || config.defaultAssets.villagePainting
        
        // Show excitement when presenting the photo
        this.showEmotionBubble(EmotionBubble.Happy)
        await player.showText("Here's your portrait! I think it really captures your essence.", {
            talkWith: this
        })
        
        // Show the photo to the player
        player.gui('rpg-image-viewer').open({
            src: imageUrl,
            title: 'Your Portrait',
            description: 'A striking portrait that captures your adventurous spirit. The lighting and composition highlight your unique character.'
        })
        
        // Give the player the photo item
        player.addItem('player-photo', 1)
        player.showNotification('Received Your Portrait!')
        
        // Show a success message after giving the photo
        this.showEmotionBubble(EmotionBubble.Happy)
        await player.showText("I've added the portrait to your inventory. You can view it anytime you'd like!", {
            talkWith: this
        })
        
        // Set the variables to indicate the player has received their photo
        player.setVariable('RECEIVED_PLAYER_PHOTO', true)
        player.setVariable('PHOTO_READY', false)
        
        // Disable the recurring emotion bubble
        this.shouldShowEmotion = false
    }
    onInit() {
        // Using the female sprite as requested
        this.setGraphic('female')
        
        // Add a visual indicator above the NPC
        this.setComponentsTop(Components.text('Photographer'))
        
        // Store a reference to this instance
        const self = this
        
        // Set a property to track if we should show the emotion
        this.shouldShowEmotion = false
        
        // Set up a recurring emotion check every 3 seconds
        this.emotionInterval = setInterval(() => {
            // If we should show the emotion, do so
            if (self.shouldShowEmotion) {
                self.showEmotionBubble(EmotionBubble.Exclamation)
            }
        }, 3000) // Check every 3 seconds
    }
    
    async onAction(player: RpgPlayer) {
        // Check if photo is developing
        const isPhotoDeveloping = player.getVariable('PHOTO_DEVELOPING')
        
        // Check if player has already received a photo
        const hasPhotoAlready = player.getVariable('RECEIVED_PLAYER_PHOTO')
        
        // If the photo is developing, check if it's ready and show excitement
        if (isPhotoDeveloping) {
            this.showEmotionBubble(EmotionBubble.Exclamation)
            await player.showText("Oh, you're back! Your portrait is ready!", {
                talkWith: this
            })
            
            // Reset the developing flag
            player.setVariable('PHOTO_DEVELOPING', false)
            
            // Show the photo and give it to the player
            await this.givePlayerPortrait(player)
            return
        }
        
        // Initial greeting
        this.showEmotionBubble(EmotionBubble.Happy)
        await player.showText("*click* Perfect lighting! Oh, hello there! I'm Luna, the village photographer.", {
            talkWith: this
        })
        
        if (!hasPhotoAlready) {
            // First interaction dialogue path
            const choice = await player.showChoices("What would you like to discuss?", [
                { text: "Your photography", value: 'photography' },
                { text: "Take my portrait", value: 'portrait' },
                { text: "Photography techniques", value: 'techniques' }
            ])
            
            if (choice && choice.value === 'photography') {
                this.showEmotionBubble(EmotionBubble.Idea)
                await player.showText("I try to capture moments that tell stories. A single image can contain an entire narrative - the light, the composition, the subject's expression - all working together to evoke emotion.", {
                    talkWith: this
                })
                
                await player.showText("You have an interesting face - very photogenic! Would you like me to take your portrait? I'd be happy to give you a copy.", {
                    talkWith: this
                })
                
                const portraitChoice = await player.showChoices("Would you like me to take your portrait?", [
                    { text: "Yes, please!", value: 'yes' },
                    { text: "Maybe later", value: 'no' }
                ])
                
                if (portraitChoice && portraitChoice.value === 'yes') {
                    await this.takePlayerPortrait(player)
                }
            }
            else if (choice && choice.value === 'portrait') {
                this.showEmotionBubble(EmotionBubble.Exclamation)
                await player.showText("Oh, you'd like me to take your portrait? Wonderful! Let me set up my camera...", {
                    talkWith: this
                })
                
                await this.takePlayerPortrait(player)
            }
            else {
                this.showEmotionBubble(EmotionBubble.Idea)
                await player.showText("The secret is patience and observation. Notice how light interacts with your subject, how shadows create depth. And always be ready - the perfect moment appears when you least expect it.", {
                    talkWith: this
                })
                
                await player.showText("Speaking of perfect moments, would you mind if I took your portrait? You have such an interesting face!", {
                    talkWith: this
                })
                
                const portraitChoice = await player.showChoices("Would you like me to take your portrait?", [
                    { text: "Yes, please!", value: 'yes' },
                    { text: "Maybe later", value: 'no' }
                ])
                
                if (portraitChoice && portraitChoice.value === 'yes') {
                    await this.takePlayerPortrait(player)
                }
            }
        } else {
            // Dialogue for returning players who already have a photo
            const choice = await player.showChoices("It's good to see you again! How can I help you today?", [
                { text: "View my portrait", value: 'view' },
                { text: "Take a new portrait", value: 'new_portrait' },
                { text: "Best photography spots", value: 'spots' },
                { text: "Just saying hello", value: 'hello' }
            ])
            
            if (choice && choice.value === 'view') {
                this.showEmotionBubble(EmotionBubble.Like)
                await player.showText("I'm so glad you like your portrait! Let me show it to you again...", {
                    talkWith: this
                })
                
                // Display the photo using our image viewer component
                player.gui('rpg-image-viewer').open({
                    src: PlayerPhoto.imageUrl,
                    title: PlayerPhoto.title,
                    description: PlayerPhoto.photoDescription
                })
            }
            else if (choice && choice.value === 'new_portrait') {
                this.showEmotionBubble(EmotionBubble.Exclamation)
                await player.showText("You'd like a new portrait? Wonderful! The lighting is different today, so we'll get a completely different mood. Let me set up...", {
                    talkWith: this
                })
                
                await this.takePlayerPortrait(player)
            }
            else if (choice && choice.value === 'spots') {
                this.showEmotionBubble(EmotionBubble.Idea)
                await player.showText("The cliffside at sunset is magical - the way the golden light bathes everything. And the forest after rain has this ethereal quality, with light filtering through the mist and leaves.", {
                    talkWith: this
                })
                
                await player.showText("If you're looking for portrait locations, the old stone bridge with the ivy creates a wonderful frame. The light there in the late afternoon is simply perfect.", {
                    talkWith: this
                })
            }
            else {
                this.showEmotionBubble(EmotionBubble.Happy)
                await player.showText("It's always nice to see a friendly face! Your portrait has been one of my favorite works lately. The way the light caught your expression was just perfect.", {
                    talkWith: this
                })
            }
        }
    }
    
    /**
     * Take a portrait of the player using the AI image generation
     */
    async takePlayerPortrait(player: RpgPlayer) {
        
        // Show the camera setup and taking photo sequence
        this.showEmotionBubble(EmotionBubble.ThreeDot)
        await player.showText("Perfect! Now, hold still and look slightly to your right... that's it!", {
            talkWith: this
        })
        
        await player.showText("*click* *click* *click* Got it! Let me develop this...", {
            talkWith: this
        })
        
        // Tell the player to come back while the photo is developing
        this.showEmotionBubble(EmotionBubble.ThreeDot)
        await player.showText("The photo needs time to develop. Why don't you explore the village a bit and come back in a moment?", {
            talkWith: this
        })
        
        // Set a variable to indicate the photo is developing
        player.setVariable('PHOTO_DEVELOPING', true)
        
        try {
            // Define a prompt for the portrait
            const characterType = player.getVariable('CHARACTER_TYPE') || 'adventurer'
            const prompt = `A fantasy portrait photograph of a ${characterType} with a determined expression, professional photography, golden hour lighting, bokeh background`
            
            // Make the API call to generate the image
            console.log('Sending prompt to webhook:', prompt)
            
            // Show a processing animation to indicate waiting
            this.showEmotionBubble(EmotionBubble.Clock)
            
            const response = await axios.post(config.webhooks.artGeneration, {
                prompt: prompt
            })
            
            // Log the response for debugging
            console.log('Webhook response:', JSON.stringify(response.data))
            
            // Extract the image URL from the response
            let imageUrl = ''
            
            // The response is a JSON object with a url property
            if (response.data && response.data.url) {
                imageUrl = response.data.url
                console.log('Successfully extracted URL from response:', imageUrl)
            } else {
                // Fallback to the default image if the URL is not found
                console.error('Could not find URL in response:', response.data)
                imageUrl = config.defaultAssets.villagePainting
            }
            
            // Save the image URL and details for later use
            PlayerPhoto.setCustomPhoto(
                imageUrl,
                'Portrait of an Adventurer',
                'A striking portrait that captures your adventurous spirit. The lighting and composition highlight your unique character.'
            )
            
            // Store the photo details in player variables for persistence
            player.setVariable('PLAYER_PHOTO_URL', imageUrl)
            
            // Show an exclamation animation to notify the player that the portrait is ready
            this.showEmotionBubble(EmotionBubble.Exclamation)
            
            // Set a variable to indicate the photo is ready but not yet collected
            player.setVariable('PHOTO_READY', true)
            
            // Enable the recurring emotion bubble
            this.shouldShowEmotion = true
            
            // Return early - we'll show the photo when they come back
            return
            
        } catch (error) {
            // Show an error message if the API call fails
            this.showEmotionBubble(EmotionBubble.Sad)
            await player.showText("Oh no! There seems to be an issue with my camera. The lighting must have changed. Perhaps we can try again later?", {
                talkWith: this
            })
            console.error('Error generating portrait:', error)
        }
    }
}
