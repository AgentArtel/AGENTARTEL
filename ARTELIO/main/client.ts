import { RpgModule, RpgClient } from '@rpgjs/client'
import ArtworkViewer from './gui/ArtworkViewer.vue'
import QuestInventory from './gui/QuestInventory.vue'
import ImagesSpritesheet from './spritesheets/images/images'

@RpgModule<RpgClient>({
  spritesheets: [
    ImagesSpritesheet
  ],
  gui: {
    guiTypes: {
      'rpg-artwork-viewer': ArtworkViewer,
      'rpg-quest-inventory': QuestInventory
    }
  }
})
export default class RpgClientEngine {}
