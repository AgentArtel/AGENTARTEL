import { Item } from '@rpgjs/database'
import { RpgPlayer } from '@rpgjs/server'
import { config } from '../../utils/config'

@Item({
    id: 'village-painting',
    name: 'Village Painting',
    description: 'A beautiful painting of the village at sunset. Created by Aria, the village artist.',
    price: 50,
    consumable: true,  // Make it consumable so it can be used in inventory
    type: 'artwork'    // Custom type for artwork items
})
export default class VillagePainting {
    // Properties to store painting details
    static imageUrl: string = config.defaultAssets.villagePainting
    static title: string = 'Village at Sunset'
    static paintingDescription: string = 'A beautiful painting capturing the village bathed in the golden light of sunset. Created by Aria, the village artist.'
    
    // Method to set custom painting details
    static setCustomPainting(imageUrl: string, title: string, description: string) {
        this.imageUrl = imageUrl
        this.title = title
        this.paintingDescription = description
    }
    
    onUse(player: RpgPlayer) {
        // Show a notification
        player.showNotification('You admire the beautiful painting...')
        
        // Use our custom artwork viewer component with the dynamic URL
        player.gui('rpg-artwork-viewer').open({
            imageUrl: VillagePainting.imageUrl,
            title: VillagePainting.title,
            description: VillagePainting.paintingDescription
        })
        
        // Add the item back to the player's inventory after viewing
        player.addItem('village-painting', 1)
        
        return true // Return true to consume the item and then add it back
    }
}
