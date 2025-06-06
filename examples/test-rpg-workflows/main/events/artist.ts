import { RpgEvent, EventData, RpgPlayer, EventMode, Components } from '@rpgjs/server'
import axios from 'axios'
import VillagePainting from '../database/items/village-painting'
import { config } from '../utils/config'
import { EmotionBubble } from '@rpgjs/plugin-emotion-bubbles'
import '../utils/npc-emotions' // Import to extend RpgEvent with showEmotionBubble

@EventData({
    name: 'village-artist',  // Unique identifier for this NPC
    mode: EventMode.Shared,  // Visible to all players
    hitbox: {
        width: 32,
        height: 16
    }
})
export default class ArtistEvent extends RpgEvent {
    onInit() {
        // Using the female sprite as requested
        this.setGraphic('female')
        
        // Add a visual indicator above the NPC
        this.setComponentsTop(Components.text('Artist'))
    }
    
    async onAction(player: RpgPlayer) {
        // Check if player has already received the painting
        const hasPaintingAlready = player.getVariable('RECEIVED_VILLAGE_PAINTING')
        
        // Initial greeting
        this.showEmotionBubble(EmotionBubble.Happy)
        await player.showText("Hello! I'm Aria, the village artist.", {
            talkWith: this
        })
        
        if (!hasPaintingAlready) {
            // First interaction dialogue path
            const choice = await player.showChoices("What would you like to talk about?", [
                { text: "Your artwork", value: 'artwork' },
                { text: "The village", value: 'village' },
                { text: "Just saying hello", value: 'hello' }
            ])
            
            if (choice && choice.value === 'artwork') {
                this.showEmotionBubble(EmotionBubble.Idea)
                await player.showText("I find inspiration in the natural beauty surrounding our village. Each painting captures a moment in time, a feeling that might otherwise be forgotten.", {
                    talkWith: this
                })
                
                await player.showText("You know what? You seem to have a genuine appreciation for art. I'd like you to have one of my paintings of the village at sunset.", {
                    talkWith: this
                })
                
                // Give the player the village painting
                player.addItem('village-painting', 1)
                player.showNotification('Received Village Painting!')
                player.setVariable('RECEIVED_VILLAGE_PAINTING', true)
                
                await player.showText("I hope it brings you joy and reminds you of our little village wherever your journey takes you.", {
                    talkWith: this
                })
            }
            else if (choice && choice.value === 'village') {
                this.showEmotionBubble(EmotionBubble.Think)
                await player.showText("This village has such character! The way the light falls between the buildings at sunset... simply magical. I've been trying to capture that in my latest piece.", {
                    talkWith: this
                })
                
                await player.showText("Speaking of which, I just finished a painting of that very scene. Would you like to have it? I'd be honored if you'd take it with you on your journey.", {
                    talkWith: this
                })
                
                // Give the player the village painting
                player.addItem('village-painting', 1)
                player.showNotification('Received Village Painting!')
                player.setVariable('RECEIVED_VILLAGE_PAINTING', true)
                
                await player.showText("Art is meant to be shared. I hope this painting reminds you of the beauty you can find in unexpected places.", {
                    talkWith: this
                })
            }
            else {
                this.showEmotionBubble(EmotionBubble.Happy)
                await player.showText("It's always nice to meet a friendly traveler. Feel free to visit my studio anytime!", {
                    talkWith: this
                })
            }
        } else {
            // Dialogue for returning players who already have the painting
            const choice = await player.showChoices("It's good to see you again! How can I help you today?", [
                { text: "View the painting", value: 'view' },
                { text: "See new painting", value: 'new_painting' },
                { text: "Ask about your painting", value: 'painting' },
                { text: "Your inspiration", value: 'inspiration' },
                { text: "Just saying hello", value: 'hello' }
            ])
            
            if (choice && choice.value === 'view') {
                this.showEmotionBubble(EmotionBubble.Think)
                await player.showText("I'll create something new for you. Let me think of a magical scene...", {
                    talkWith: this
                })
                
                // Display the artwork using our custom viewer component with the current painting details
                player.gui('rpg-artwork-viewer').open({
                    imageUrl: VillagePainting.imageUrl,
                    title: VillagePainting.title,
                    description: VillagePainting.paintingDescription
                })
            }
            else if (choice && choice.value === 'new_painting') {
                // Show a loading message
                await player.showText("I've gotten better since then! I've been experimenting with a new technique that captures magical elements. Let me show you my latest creation...", {
                    talkWith: this
                })
                
                try {
                    // Define a prompt for the new painting
                    const prompt = 'A magical fantasy village with glowing lanterns and ethereal creatures, painted in a vibrant impressionist style'
                    
                    // Make the API call to generate the image
                    console.log('Sending prompt to webhook:', prompt)
                    const response = await axios.post(config.webhooks.artGeneration, {
                        prompt: prompt
                    })
                    
                    // Log the response for debugging
                    console.log('Webhook response:', JSON.stringify(response.data))
                    
                    // Extract the image URL from the response - handling the actual webhook response format
                    let imageUrl = ''
                    
                    // Log the full response for debugging
                    console.log('Full response data:', JSON.stringify(response.data))
                    
                    // The response is a JSON object with a url property
                    if (response.data && response.data.url) {
                        imageUrl = response.data.url
                        console.log('Successfully extracted URL from response:', imageUrl)
                    } else {
                        // Fallback to the default image if the URL is not found
                        console.error('Could not find URL in response:', response.data)
                        imageUrl = config.defaultAssets.villagePainting
                    }
                    
                    // Update the village painting with the new image details
                    VillagePainting.setCustomPainting(
                        imageUrl,
                        'Magical Village',
                        'A magical fantasy village with glowing lanterns and ethereal creatures. My newest creation!'
                    )
                    
                    // Show the new painting immediately
                    player.gui('rpg-artwork-viewer').open({
                        imageUrl: imageUrl,
                        title: 'Magical Village',
                        description: 'A magical fantasy village with glowing lanterns and ethereal creatures. My newest creation!'
                    })
                    
                    // Show a success message after viewing
                    this.showEmotionBubble(EmotionBubble.Question)
                    await player.showText("What do you think? I've been experimenting with new techniques to capture magical elements. Would you like to keep it?", {
                        talkWith: this
                    })
                    
                    // Ask if they want to keep it
                    const keepChoice = await player.showChoices("Would you like to keep this painting?", [
                        { text: "Yes, I'd love to have it", value: 'yes' },
                        { text: "No thank you", value: 'no' }
                    ])
                    
                    if (keepChoice && keepChoice.value === 'yes') {
                        // Give the player the painting
                        player.addItem('village-painting', 1)
                        player.showNotification('Received Magical Village Painting!')
                        
                        this.showEmotionBubble(EmotionBubble.Happy)
                        await player.showText("I'm so glad you like it! It's yours to keep. You can view it anytime from your inventory.", {
                            talkWith: this
                        })
                    } else {
                        await player.showText("That's alright. I'll keep working on my technique. Feel free to visit again later to see my new creations!", {
                            talkWith: this
                        })
                    }
                    
                } catch (error) {
                    // Show an error message if the API call fails
                    this.showEmotionBubble(EmotionBubble.Sad)
                    await player.showText("I'm sorry, but I seem to be having trouble with my new painting. Perhaps we can try again later?", {
                        talkWith: this
                    })
                    console.error('Error generating painting:', error)
                }
            }
            else if (choice && choice.value === 'painting') {
                await player.showText("How do you like the painting I gave you? I put my heart into capturing the essence of our village in that piece.", {
                    talkWith: this
                })
                
                await player.showText("Each brushstroke was carefully placed to evoke the feeling of peace that washes over the village at sunset. The colors blend just as they do in the sky.", {
                    talkWith: this
                })
            }
            else if (choice && choice.value === 'inspiration') {
                await player.showText("My inspiration comes from the world around us - the way light plays on surfaces, how shadows create depth, the emotions evoked by different scenes.", {
                    talkWith: this
                })
                
                await player.showText("I believe art should capture not just what we see, but what we feel when we see it. That's what I tried to do with the painting I gave you.", {
                    talkWith: this
                })
            }
            else {
                await player.showText("It's always a pleasure to see you again! I hope my painting has brought you some joy on your travels.", {
                    talkWith: this
                })
            }
        }
    }
}
