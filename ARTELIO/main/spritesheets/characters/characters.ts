import { Spritesheet, Presets } from '@rpgjs/client';

const { RMSpritesheet } = Presets;

@Spritesheet({
    id: 'female',
    image: './female.png', // Path relative to this file for Vite
    ...RMSpritesheet(3, 4)  // Assumes 3 frames horizontal, 4 frames vertical
})
export class FemaleSprite { }

// Define 'hero' as the default character spritesheet
@Spritesheet({
    id: 'hero', // Good practice to have an ID
    image: './hero.png', // Path relative to this file for Vite
    ...RMSpritesheet(3, 4)  // Assumes 3 frames horizontal, 4 frames vertical
})
export default class Characters { }