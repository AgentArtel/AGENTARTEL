import { RpgEvent, EventData, RpgPlayer, EventMode, Components } from '@rpgjs/server'

@EventData({
    name: 'village-shopkeeper',  // Unique identifier - MUST match object name in TMX file
    mode: EventMode.Shared,      // Visible to all players
    hitbox: {
        width: 32,
        height: 16
    }
})
export default class ShopkeeperEvent extends RpgEvent {
    onInit() {
        // Set appearance - using female sprite as default
        this.setGraphic('female')
        
        // Add a shop indicator above the NPC
        this.setComponentsTop(Components.text('Shop'))
    }
    
    async onAction(player: RpgPlayer) {
        // Initial greeting
        await player.showText("Welcome to my shop! I'm Eliza, the village shopkeeper.", {
            talkWith: this
        })
        
        // Check if player has enough gold
        if (player.gold < 1) {
            await player.showText("I see you don't have any gold. Come back when you have some money to spend.", {
                talkWith: this
            })
            return
        }
        
        // Dialogue choices
        const choice = await player.showChoices("All items are just 1 gold each! What would you like to buy?", [
            { text: "Healing Potion", value: 'healing-potion' },
            { text: "Antidote", value: 'antidote' },
            { text: "Power Fruit", value: 'power-fruit' },
            { text: "Nothing today", value: 'nothing' }
        ])
        
        // Handle player choice
        if (choice && choice.value === 'healing-potion') {
            await player.showText("An excellent choice! This potion will restore your health when you need it most.", {
                talkWith: this
            })
            
            player.gold -= 1
            player.addItem('healing-potion', 1)
            player.showNotification('Purchased Healing Potion for 1 gold!')
        }
        else if (choice && choice.value === 'antidote') {
            await player.showText("A wise purchase! This will cure any poison you might encounter on your journey.", {
                talkWith: this
            })
            
            player.gold -= 1
            player.addItem('antidote', 1)
            player.showNotification('Purchased Antidote for 1 gold!')
        }
        else if (choice && choice.value === 'power-fruit') {
            await player.showText("A rare find! This fruit will enhance your strength temporarily.", {
                talkWith: this
            })
            
            player.gold -= 1
            player.addItem('power-fruit', 1)
            player.showNotification('Purchased Power Fruit for 1 gold!')
        }
        else {
            await player.showText("No problem! Feel free to browse. My inventory changes regularly.", {
                talkWith: this
            })
        }
        
        // Ask if they want to buy something else
        if (choice && choice.value !== 'nothing' && player.gold >= 1) {
            const buyMore = await player.showChoices("Would you like to buy anything else?", [
                { text: "Yes", value: 'yes' },
                { text: "No, thanks", value: 'no' }
            ])
            
            if (buyMore && buyMore.value === 'yes') {
                // Recursive call to let them buy more items
                await this.onAction(player)
                return
            }
        }
        
        // Farewell message
        await player.showText("Thank you for visiting my shop! Come back soon!", {
            talkWith: this
        })
    }
}
