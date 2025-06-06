<template>
   <div class="item-menu">
        <rpg-window :fullWidth="true" height="80%" :arrow="arrow">
            <div class="row">
               <rpg-choice :choices="mapItems" :column="1" @change="selected" @selected="choiceItem" ref="choice" @canScroll="arrow = $event">
                   <template v-slot:default="{ choice }">
                       <p class="space-between item" :class="{'artwork': choice.type === 'artwork', 'consumable': choice.consumable}">
                           <span>{{ choice.text }}</span> 
                           <span>{{ choice.nb }}</span> 
                        </p>
                   </template>
               </rpg-choice>
            </div>
        </rpg-window>
        <rpg-window :fullWidth="true" height="20%">
            <p>{{ description }}</p>
        </rpg-window>
   </div>
</template>

<script>
import { Control } from '@rpgjs/client'

export default {
    name: 'custom-item-menu',
    inject: ['rpgCurrentPlayer', 'rpgKeypress', 'rpgSocket', 'rpgGuiInteraction'],
    data() {
        return {
            description: '',
            items: [],
            arrow: null
        }
    },
    computed: {
        mapItems() {
            return this.items.filter(it => it).map(it => ({
                text: it.item.name,
                nb: it.nb,
                consumable: it.item.consumable,
                type: it.item.type || 'regular',
                id: it.item.id
            }))
        }
    },
    mounted() {
        this.obsCurrentPlayer = this.rpgCurrentPlayer.subscribe(({ object }) => {
           this.items = Object.values(object.items || [])
        })
        this.obsKeyPress = this.rpgKeypress.subscribe(({ control }) => {
            if (!control) return
            if (control.actionName == Control.Back) {
                this.$emit('changeLayout', 'MainLayout')
            }
        })
        this.selected(0)
    },
    unmounted() {
        this.obsKeyPress.unsubscribe()
        this.obsCurrentPlayer.unsubscribe()
    },
    methods: {
        selected(index) {
            if (!this.items[index]) return
            this.description = this.items[index].item.description
        },
        choiceItem(index) {
            if (!this.items[index]) return
            const item = this.items[index].item
            const { id, consumable, type } = item
            
            // Handle different item types
            if (type === 'artwork') {
                // For artwork items, use the rpgGuiInteraction to display the image
                this.rpgGuiInteraction('rpg-image-viewer', 'open', {
                    src: item.imageSrc || id,
                    alt: item.name,
                    title: item.title || item.name,
                    description: item.description
                })
                return
            }
            
            // For consumable items, use the standard behavior
            if (consumable) {
                this.rpgSocket().emit('gui.interaction', {
                    guiId: 'rpg-main-menu',
                    name: 'useItem',
                    data: id
                })
            }
        }
    }
}
</script>

<style scoped>
.row {
   height: 100%;
}

.item-menu {
    height: 100%;
}

.artwork {
    color: #6495ED; /* Blue color for artwork items */
    font-style: italic;
}

.consumable {
    color: #32CD32; /* Green color for consumable items */
}

.item {
    margin: 0;
    position: relative;
    padding: 10px;
}

.space-between {
    justify-content: space-between;
    display: flex;
}
</style>
