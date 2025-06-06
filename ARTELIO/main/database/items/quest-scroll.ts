import { Item } from '@rpgjs/database'
import { RpgPlayer } from '@rpgjs/server'

@Item({
    id: 'quest-scroll',
    name: 'Quest Scroll',
    description: 'A scroll containing details of a quest from the Quest Master. Give this to the Artist to commission a painting.',
    price: 0,
    consumable: false,
    type: 'quest'
})
export default class QuestScroll {
    // Properties to store quest details
    static title: string = 'Quest Scroll'
    static description: string = 'A quest from the Quest Master'
    static theme: string = 'village landscape'
    
    // Method to set quest details
    static setQuestDetails(title: string, description: string, theme: string) {
        this.title = title
        this.description = description
        this.theme = theme
        
        console.log('Quest Scroll set:', { title, theme })
    }
    
    // When used, just show the quest details
    async onUse(player: RpgPlayer) {
        // Show the quest details
        await player.showText(`Quest: ${QuestScroll.title}\n\nDescription: ${QuestScroll.description}\n\nTheme: ${QuestScroll.theme}`, {
            talkWith: player
        })
        
        return false // Don't consume the item
    }
}
