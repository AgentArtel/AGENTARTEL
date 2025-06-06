import { RpgModule, RpgServer } from '@rpgjs/server'
import HealingPotion from './items/healing-potion'
import Antidote from './items/antidote'
import PowerFruit from './items/power-fruit'
import VillagePainting from './items/village-painting'

@RpgModule<RpgServer>({
    database: {
        HealingPotion,
        Antidote,
        PowerFruit,
        VillagePainting
    }
})
export default class RpgServerModule { }
