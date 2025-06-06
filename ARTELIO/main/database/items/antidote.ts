import { Item } from '@rpgjs/database'
import { RpgPlayer } from '@rpgjs/server'

@Item({
    id: 'antidote',
    name: 'Antidote',
    description: 'Cures poison status',
    price: 1,
    removeStates: ['poison'],
    consumable: true
})
export default class Antidote {
    onUse(player: RpgPlayer) {
        player.showNotification('The poison has been neutralized!')
        return true
    }
}
