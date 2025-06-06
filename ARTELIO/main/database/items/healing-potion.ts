import { Item } from '@rpgjs/database'
import { RpgPlayer } from '@rpgjs/server'

@Item({
    id: 'healing-potion',         // Unique identifier for this item
    name: 'Healing Potion',       // Display name
    description: 'Restores 50 HP', // Item description
    price: 100,                   // Shop price
    hpValue: 50,                  // HP restored when used
    consumable: true              // Whether item is consumed on use
})
export default class HealingPotion {
    onUse(player: RpgPlayer) {
        // Show a message when used
        player.showNotification('You feel refreshed!')
        return true // Return true to consume the item
    }
}
