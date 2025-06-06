import { RpgEvent, EventData, RpgPlayer, EventMode, Components } from '@rpgjs/server'

@EventData({
    name: 'village-healer',  // Unique identifier - MUST match object name in TMX file
    mode: EventMode.Shared,  // Visible to all players
    hitbox: {
        width: 32,
        height: 16
    }
})
export default class HealerEvent extends RpgEvent {
    onInit() {
        // Set appearance - using female sprite as default
        this.setGraphic('female')
        
        // Add a healer indicator above the NPC
        this.setComponentsTop(Components.text('Healer'))
    }
    
    async onAction(player: RpgPlayer) {
        // Check if player has already received the potion
        const hasPotionAlready = player.getVariable('RECEIVED_HEALING_POTION')
        
        if (!hasPotionAlready) {
            // Initial greeting
            await player.showText("Hello traveler! I'm Elara, the village healer.", {
                talkWith: this
            })
            
            await player.showText("You look like you're preparing for a journey. Take this healing potion - it might save your life when you need it most.", {
                talkWith: this
            })
            
            // Give the player a healing potion
            player.addItem('healing-potion', 1)
            
            // Show notification
            player.showNotification('Received Healing Potion!')
            
            // Set variable to remember player received the potion
            player.setVariable('RECEIVED_HEALING_POTION', true)
            
            await player.showText("Use it wisely! You can find more at the village shop if you need them.", {
                talkWith: this
            })
        } 
        else {
            // If player already received the potion
            await player.showText("How are you feeling? I hope that healing potion I gave you is serving you well.", {
                talkWith: this
            })
            
            const choice = await player.showChoices("Is there anything else I can help you with?", [
                { text: "Tell me about healing", value: 'healing' },
                { text: "No thanks", value: 'no' }
            ])
            
            if (choice && choice.value === 'healing') {
                await player.showText("The art of healing combines ancient knowledge of herbs and a touch of magic. The potions I create can restore life energy when consumed.", {
                    talkWith: this
                })
            }
            else {
                await player.showText("Very well. Safe travels, and come back if you're ever in need of healing.", {
                    talkWith: this
                })
            }
        }
    }
}
