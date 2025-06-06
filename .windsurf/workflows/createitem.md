---
description: A step-by-step workflow for creating usable items in your RPG-JS game.
---

# Create New Item in RPG-JS

This workflow guides you through creating a new item for your RPG-JS game, with examples for different item types. This workflow has been verified through successful implementation of multiple items (Healing Potion, Antidote, Power Fruit).

## Prerequisites
- Existing RPG-JS project
- Basic understanding of TypeScript
- Understanding of RPG-JS database system

## Step 1: Create the Item File Structure

First, ensure you have the proper directory structure:

```bash
# Create the database/items directory if it doesn't exist
mkdir -p main/database/items
```

Create a new TypeScript file in your database/items directory:

```typescript
// main/database/items/healing-potion.ts
import { Item } from '@rpgjs/database'
import { RpgPlayer } from '@rpgjs/server'

@Item({
    id: 'healing-potion',         // Unique identifier for this item
    name: 'Healing Potion',       // Display name
    description: 'Restores 50 HP', // Item description
    price: 100,                   // Shop price
    hpValue: 50,                  // HP restored when used
    consumable: true              // Whether item is consumed on use
})
export default class HealingPotion {
    // Called when item is used
    onUse(player: RpgPlayer) {
        // Optional additional effects when used
        player.showNotification('You feel refreshed!')
        return true // Return true to consume the item
    }
}
```

## Step 2: Create or Update the Database Module

Create a database module file to register your item. If the file already exists, update it to include your new item:

```typescript
// main/database/index.ts
import { RpgModule, RpgServer } from '@rpgjs/server'
import HealingPotion from './items/healing-potion'

@RpgModule<RpgServer>({
    database: {
        HealingPotion
    }
})
export default class RpgServerModule { }
```

If you're adding multiple items, import and register them all in this file:

```typescript
// main/database/index.ts
import { RpgModule, RpgServer } from '@rpgjs/server'
import HealingPotion from './items/healing-potion'
import Antidote from './items/antidote'
import PowerFruit from './items/power-fruit'

@RpgModule<RpgServer>({
    database: {
        HealingPotion,
        Antidote,
        PowerFruit
    }
})
export default class RpgServerModule { }
```

## Step 3: Distribute Items to Players

There are several ways to give items to players. Here are the most common methods with verified examples:

### Method 1: Via a Shopkeeper NPC

```typescript
// main/events/shopkeeper.ts
import { RpgEvent, EventData, RpgPlayer, EventMode, Components } from '@rpgjs/server'

@EventData({
    name: 'village-shopkeeper',
    mode: EventMode.Shared,
    hitbox: {
        width: 32,
        height: 16
    }
})
export default class ShopkeeperEvent extends RpgEvent {
    onInit() {
        this.setGraphic('female')
        this.setComponentsTop(Components.text('Shop'))
    }
    
    async onAction(player: RpgPlayer) {
        await player.showText("Welcome to my shop! All items are 1 gold each.")
        
        const choice = await player.showChoices("What would you like to buy?", [
            { text: "Healing Potion", value: 'healing-potion' },
            { text: "Antidote", value: 'antidote' },
            { text: "Nothing today", value: 'nothing' }
        ])
        
        if (choice && choice.value === 'healing-potion') {
            if (player.gold >= 1) {
                player.gold -= 1
                player.addItem('healing-potion', 1)
                player.showNotification('Purchased Healing Potion!')
            } else {
                await player.showText("You don't have enough gold.")
            }
        }
        else if (choice && choice.value === 'antidote') {
            if (player.gold >= 1) {
                player.gold -= 1
                player.addItem('antidote', 1)
                player.showNotification('Purchased Antidote!')
            } else {
                await player.showText("You don't have enough gold.")
            }
        }
    }
}
```

### Method 2: Via a Healer NPC (Free Item)

```typescript
// main/events/healer.ts
import { RpgEvent, EventData, RpgPlayer, EventMode, Components } from '@rpgjs/server'

@EventData({
    name: 'village-healer',
    mode: EventMode.Shared,
    hitbox: {
        width: 32,
        height: 16
    }
})
export default class HealerEvent extends RpgEvent {
    onInit() {
        this.setGraphic('female')
        this.setComponentsTop(Components.text('Healer'))
    }
    
    async onAction(player: RpgPlayer) {
        // Check if player has already received the potion
        const hasPotionAlready = player.getVariable('RECEIVED_HEALING_POTION')
        
        if (!hasPotionAlready) {
            await player.showText("Take this healing potion for your journey.")
            player.addItem('healing-potion', 1)
            player.showNotification('Received Healing Potion!')
            player.setVariable('RECEIVED_HEALING_POTION', true)
        } else {
            await player.showText("I hope that healing potion is serving you well.")
        }
    }
}
```

### Method 3: Via Player Starting Equipment

```typescript
// main/player.ts
import { RpgPlayer, RpgPlayerHooks } from '@rpgjs/server'

const player: RpgPlayerHooks = {
    onConnected(player: RpgPlayer) {
        // Give the player some starting items
        player.addItem('healing-potion', 2)
        player.addItem('antidote', 1)
        player.gold = 10 // Starting gold
    }
}

export default player
```

## Step 4: Test Your Implementation

1. Run your game: `npm run dev`
2. Test each method of item distribution:
   - Talk to the shopkeeper to buy items
   - Talk to the healer to receive a free item
   - Check your starting inventory for items given at connection
3. Open the inventory (usually by pressing the Back control key)
4. Select and use the items to verify their effects
5. Check that gold is properly deducted when purchasing items

## Item Types and Examples

### Healing Item
```typescript
@Item({
    id: 'healing-potion',
    name: 'Healing Potion',
    description: 'Restores 50 HP',
    price: 100,
    hpValue: 50,
    consumable: true
})
export default class HealingPotion { }
```

### Status Recovery Item
```typescript
@Item({
    id: 'antidote',
    name: 'Antidote',
    description: 'Cures poison',
    price: 50,
    removeStates: ['poison'],
    consumable: true
})
export default class Antidote { }
```

### Stat Boosting Item
```typescript
@Item({
    id: 'power-fruit',
    name: 'Power Fruit',
    description: 'Permanently increases strength',
    price: 1000,
    consumable: true
})
export default class PowerFruit {
    onUse(player: RpgPlayer) {
        player.atk += 5
        player.showNotification('Strength increased by 5!')
        return true
    }
}
```

### Key Item (Non-Consumable)
```typescript
@Item({
    id: 'ancient-key',
    name: 'Ancient Key',
    description: 'Opens the door to the ancient ruins',
    price: 0,
    consumable: false
})
export default class AncientKey { }
```

## Advanced Item Features

### Conditional Use
```typescript
onUse(player: RpgPlayer) {
    if (player.hp < player.maxHp) {
        player.hp += 50
        return true // Consume the item
    }
    
    player.showText("Your HP is already full!")
    return false // Don't consume the item
}
```

### Item with Multiple Effects
```typescript
@Item({
    id: 'elixir',
    name: 'Elixir',
    description: 'Restores HP and MP',
    price: 300,
    hpValue: 100,
    mpValue: 50,
    consumable: true
})
export default class Elixir { }
```

### Item with Custom Effects
```typescript
@Item({
    id: 'smoke-bomb',
    name: 'Smoke Bomb',
    description: 'Escape from battle',
    price: 150,
    consumable: true
})
export default class SmokeBomb {
    onUse(player: RpgPlayer) {
        if (player.inBattle) {
            player.escapeBattle()
            return true
        }
        
        player.showText("You can only use this in battle!")
        return false
    }
}
```

## Troubleshooting

- **Item doesn't appear in inventory**: Verify item is registered in the database/index.ts file
- **Error about "export default"**: Make sure you're using `export default class` instead of `export class`
- **Error in imports**: Use `import ItemName from './items/item-file'` not `import { ItemName }`
- **Item effects don't work**: Check that the item properties (hpValue, etc.) are correct
- **Cannot use item**: Verify the consumable property is set to true
- **Gold not deducted**: Make sure you're checking if player.gold >= price before purchase

## Best Practices

- **File Organization**: Keep all item files in the main/database/items directory
- **Naming Conventions**: Use kebab-case for file names (healing-potion.ts) and PascalCase for class names (HealingPotion)
- **Item IDs**: Use consistent, descriptive IDs that match the item's purpose
- **Item Integration**: Connect items to your game's narrative through NPC dialogue
- **Testing**: Always test items with multiple distribution methods
- **Player Experience**: Add notifications when items are received or used
- **Storytelling**: Use items to enhance your narrative and create meaningful player experiences

## Real-World Implementation

This workflow has been verified with the following items:

1. **Healing Potion**: Restores player HP
2. **Antidote**: Cures poison status
3. **Power Fruit**: Increases player strength

These items have been successfully distributed through:

1. **Shopkeeper NPC**: Sells items for gold
2. **Healer NPC**: Gives free items with conditional dialogue
3. **Player Starting Equipment**: Adds items on player connection

By following this workflow, you can create a rich item system that enhances your game's storytelling and player experience.
