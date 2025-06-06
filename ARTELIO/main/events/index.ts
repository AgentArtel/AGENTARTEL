import { RpgModule } from '@rpgjs/server'
import ArtistEvent from './artist'
import MentorEvent from './mentor'
import ShopkeeperEvent from './shopkeeper'
import VillagerEvent from './villager'
import PhotographerEvent from './photographer'
import QuestGiverEvent from './quest-giver'
import EchoWeaverNpc from './EchoWeaverNpc'
import EchoSeerNpc from './EchoSeerNpc' // Added EchoSeerNpc import

export default {
    events: [
        ArtistEvent,
        VillagerEvent,
        ShopkeeperEvent,
        MentorEvent,
        PhotographerEvent,
        QuestGiverEvent,
        EchoWeaverNpc,
        EchoSeerNpc // Added EchoSeerNpc to the array
    ]
} as RpgModule
