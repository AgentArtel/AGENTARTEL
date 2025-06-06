<template>
    <div class="main-layout">
        <rpg-window :fullWidth="true" height="100%">
            <div class="menu-container">
                <h1 class="menu-title">ARTELIO</h1>
                <div class="menu-options">
                    <rpg-choice :choices="menuChoices" :column="1" @selected="selectOption" ref="choice">
                        <template v-slot:default="{ choice }">
                            <p class="menu-option">{{ choice.text }}</p>
                        </template>
                    </rpg-choice>
                </div>
            </div>
        </rpg-window>
    </div>
</template>

<script>
import { Control } from '@rpgjs/client'

export default {
    name: 'main-layout',
    inject: ['rpgKeypress', 'rpgGuiInteraction'],
    data() {
        return {
            menuChoices: [
                { text: 'Items', value: 'items' },
                { text: 'Quests', value: 'quests' },
                { text: 'Save', value: 'save' },
                { text: 'Exit', value: 'exit' }
            ]
        }
    },
    mounted() {
        this.obsKeyPress = this.rpgKeypress.subscribe(({ control }) => {
            if (!control) return
            if (control.actionName == Control.Back) {
                this.rpgGuiInteraction('rpg-main-menu', 'close')
            }
        })
    },
    unmounted() {
        this.obsKeyPress.unsubscribe()
    },
    methods: {
        selectOption(index) {
            const option = this.menuChoices[index]
            if (!option) return
            
            switch (option.value) {
                case 'items':
                    this.$emit('changeLayout', 'rpg-custom-item-menu')
                    break
                case 'quests':
                    this.$emit('changeLayout', 'rpg-quest-inventory')
                    break
                case 'save':
                    this.rpgGuiInteraction('rpg-main-menu', 'save')
                    break
                case 'exit':
                    this.rpgGuiInteraction('rpg-main-menu', 'close')
                    break
            }
        }
    }
}
</script>

<style scoped>
.main-layout {
    height: 100%;
}

.menu-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 20px;
}

.menu-title {
    font-size: 2em;
    color: #FFD700;
    margin-bottom: 30px;
    text-align: center;
}

.menu-options {
    width: 100%;
    max-width: 300px;
}

.menu-option {
    padding: 12px;
    text-align: center;
    font-size: 1.2em;
    transition: color 0.2s;
}

.menu-option:hover {
    color: #FFD700;
}
</style>
