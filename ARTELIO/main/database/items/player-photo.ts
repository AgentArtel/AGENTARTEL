import { Item } from '@rpgjs/database'
import { RpgPlayer } from '@rpgjs/server'
import { config } from '../../utils/config'

@Item({
    id: 'player-photo',
    name: 'Your Portrait',
    description: 'A beautiful portrait photograph taken by Luna, the village photographer.',
    price: 50,
    consumable: true,  // Make it consumable so it can be used in inventory
    type: 'photograph'  // Custom type for photograph items
})
export default class PlayerPhoto {
    // Properties to store photo details
    static imageUrl: string = config.defaultAssets.villagePainting // Using the same default for now
    static title: string = 'Portrait of an Adventurer'
    static photoDescription: string = 'A striking portrait that captures your adventurous spirit. Taken by Luna, the village photographer.'
    
    // Method to set custom photo details
    static setCustomPhoto(imageUrl: string, title: string, description: string) {
        this.imageUrl = imageUrl
        this.title = title
        this.photoDescription = description
        
        // Log the saved image URL for debugging
        console.log('Saved photo URL to item:', this.imageUrl)
    }
    
    onUse(player: RpgPlayer) {
        // Show a notification
        player.showNotification('You admire the beautiful photograph...')
        
        // Use the image viewer component with the dynamic URL
        player.gui('rpg-image-viewer').open({
            src: PlayerPhoto.imageUrl,
            title: PlayerPhoto.title,
            description: PlayerPhoto.photoDescription
        })
        
        // Add the item back to the player's inventory after viewing
        player.addItem('player-photo', 1)
        
        return true // Return true to consume the item and then add it back
    }
}
