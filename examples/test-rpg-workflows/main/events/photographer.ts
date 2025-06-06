import { RpgEvent, EventData, RpgPlayer, EventMode } from '@rpgjs/server'

@EventData({
    name: 'village-photographer',  // Unique identifier for this NPC
    mode: EventMode.Shared,  // Visible to all players
    hitbox: {
        width: 32,
        height: 16
    }
})
export default class PhotographerEvent extends RpgEvent {
    onInit() {
        // Using the female sprite as requested
        this.setGraphic('female')
    }
    
    async onAction(player: RpgPlayer) {
        // Called when player presses action key near NPC
        await player.showText("*click* Perfect lighting! Oh, hello there! I'm Luna, the village photographer.", {
            talkWith: this
        })
        
        const choice = await player.showChoices("What would you like to discuss?", [
            { text: "Your photography", value: 'photography' },
            { text: "The best locations", value: 'locations' },
            { text: "Photography techniques", value: 'techniques' }
        ])
        
        if (choice && choice.value === 'photography') {
            await player.showText("I try to capture moments that tell stories. A single image can contain an entire narrative - the light, the composition, the subject's expression - all working together to evoke emotion.", {
                talkWith: this
            })
        }
        else if (choice && choice.value === 'locations') {
            await player.showText("The cliffside at sunset is magical - the way the golden light bathes everything. And the forest after rain has this ethereal quality, with light filtering through the mist and leaves.", {
                talkWith: this
            })
        }
        else {
            await player.showText("The secret is patience and observation. Notice how light interacts with your subject, how shadows create depth. And always be ready - the perfect moment appears when you least expect it.", {
                talkWith: this
            })
        }
        
        await player.showText("Stop by again sometime! I'd love to show you my latest collection. Maybe I'll even take your portrait!", {
            talkWith: this
        })
    }
}
