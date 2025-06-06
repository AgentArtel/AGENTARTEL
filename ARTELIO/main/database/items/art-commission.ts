import { Item } from '@rpgjs/database'
import { RpgPlayer } from '@rpgjs/server'
import { config } from '../../utils/config'
import axios from 'axios'

@Item({
    id: 'art-commission',
    name: 'Art Commission',
    description: 'A request for artwork from the Quest Master. Use this item to create a masterpiece.',
    price: 0,
    consumable: true,
    type: 'quest'
})
export default class ArtCommission {
    // Properties to store commission details
    static title: string = 'Art Commission'
    static description: string = 'Create a beautiful artwork based on the given theme.'
    static theme: string = 'village landscape'
    static reward: string = '50 gold'
    static completed: boolean = false
    
    // Method to set commission details from quest
    static setCommissionDetails(title: string, description: string, theme: string, reward: string) {
        this.title = title
        this.description = description
        this.theme = theme
        this.reward = reward
        this.completed = false
        
        console.log('Art Commission set:', { title, theme, reward })
    }
    
    async onUse(player: RpgPlayer) {
        // If the commission is already completed, just show the artwork
        if (ArtCommission.completed) {
            player.showNotification('You admire your completed artwork...')
            
            // Show the completed artwork
            player.gui('rpg-artwork-viewer').open({
                imageUrl: player.getVariable('COMPLETED_ARTWORK_URL'),
                title: ArtCommission.title,
                description: ArtCommission.description
            })
            
            // Add the item back to inventory
            player.addItem('art-commission', 1)
            return true
        }
        
        // Show a notification that you're working on the artwork
        player.showNotification('You begin working on the art commission...')
        
        try {
            // Show thinking animation to the player
            await player.showText('You focus on creating artwork based on the theme: ' + ArtCommission.theme, {
                talkWith: player
            })
            
            // Generate artwork based on the theme using the webhook
            const response = await axios.post(config.webhooks.artGenerator, {
                prompt: ArtCommission.theme,
                playerName: player.name || 'Adventurer'
            })
            
            console.log('Art generation response:', response.data)
            
            // Extract the image URL from the response
            let imageUrl = ''
            if (response.data && response.data.imageUrl) {
                imageUrl = response.data.imageUrl
            } else if (response.data && response.data.output) {
                // Try to parse the output if it's a string
                try {
                    const outputData = JSON.parse(response.data.output)
                    if (outputData.imageUrl) {
                        imageUrl = outputData.imageUrl
                    }
                } catch (e) {
                    console.error('Failed to parse output JSON:', e)
                }
            }
            
            // If we couldn't get an image URL, use a default
            if (!imageUrl) {
                imageUrl = config.defaultAssets.villagePainting
                console.log('Using default image URL')
            }
            
            // Store the artwork URL in player variables
            player.setVariable('COMPLETED_ARTWORK_URL', imageUrl)
            
            // Mark the commission as completed
            ArtCommission.completed = true
            
            // Show the completed artwork
            player.gui('rpg-artwork-viewer').open({
                imageUrl: imageUrl,
                title: ArtCommission.title,
                description: ArtCommission.description
            })
            
            // Give the player their reward
            const goldReward = parseInt(ArtCommission.reward) || 50
            player.gold += goldReward
            player.showNotification(`Received: ${goldReward} gold`)
            
            // Complete the quest
            player.setVariable('QUEST_COMPLETED', true)
            player.setVariable('ACTIVE_QUEST', null)
            
            // Add the item back to inventory for future viewing
            player.addItem('art-commission', 1)
            
            return true
        } catch (error) {
            console.error('Error generating artwork:', error)
            
            // Show an error message
            await player.showText("You're having trouble with inspiration right now. Perhaps try again later?", {
                talkWith: player
            })
            
            // Add the item back to inventory
            player.addItem('art-commission', 1)
            return true
        }
    }
}
