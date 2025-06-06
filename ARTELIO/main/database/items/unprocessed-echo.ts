import { Item } from '@rpgjs/database';
import { RpgPlayer } from '@rpgjs/server';

@Item({
    id: 'unprocessed-echo',
    name: 'Unprocessed Echo',
    description: 'A media fragment resonating with unknown memories. It needs to be processed by a skilled individual to reveal its secrets.',
    price: 0, // Not for sale
    consumable: false,
    hitbox: { // Default hitbox, can be adjusted if it's a world item
        width: 32,
        height: 32
    }
})
export default class UnprocessedEcho {
    // No onUse method for now, as its "use" is through NPC interaction
    // onUse(player: RpgPlayer) {
    //     // player.showNotification('This echo hums with potential...');
    //     // return false; // Do not consume
    // }
}
