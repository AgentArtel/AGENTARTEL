import { Item } from '@rpgjs/database'
import { RpgPlayer } from '@rpgjs/server'

@Item({
    id: 'power-fruit',
    name: 'Power Fruit',
    description: 'Increases your strength temporarily',
    price: 1,
    consumable: true
})
export default class PowerFruit {
    onUse(player: RpgPlayer) {
        player.showNotification('You feel stronger!')
        return true
    }
}
