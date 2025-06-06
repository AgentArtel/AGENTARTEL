import { RpgModule, RpgClient } from '@rpgjs/client'
import ArtworkViewer from './gui/ArtworkViewer.vue'
import ImagesSpritesheet from './spritesheets/images/images'

@RpgModule<RpgClient>({
  spritesheets: [
    ImagesSpritesheet
  ],
  gui: {
    guiTypes: {
      'rpg-artwork-viewer': ArtworkViewer
    }
  }
})
export default class RpgClientEngine {}
