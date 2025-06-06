import { RpgModule, RpgServer } from '@rpgjs/server'
import HealingPotion from './items/healing-potion'
import Antidote from './items/antidote'
import PowerFruit from './items/power-fruit'
import VillagePainting from './items/village-painting';
import UnprocessedEcho from './items/unprocessed-echo';

@RpgModule<RpgServer>({
    database: {
        HealingPotion,
        Antidote,
        PowerFruit,
        VillagePainting,
        UnprocessedEcho
    }
})
export default class RpgServerModule { }
