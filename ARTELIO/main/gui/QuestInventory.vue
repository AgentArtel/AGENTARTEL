<template>
  <div class="quest-inventory">
    <rpg-window :fullWidth="true" height="100%">
      <div class="quest-container">
        <div class="header">
          <h1 class="title">Quests</h1>
          <button class="back-button" @click="back">Back</button>
        </div>
        
        <div class="quest-content">
          <QuestTracker />
        </div>
      </div>
    </rpg-window>
  </div>
</template>

<script>
import { Control } from '@rpgjs/client'
import QuestTracker from './QuestTracker.vue'

export default {
  name: 'QuestInventory',
  components: {
    QuestTracker
  },
  inject: ['rpgKeypress', 'rpgGuiInteraction'],
  data() {
    return {
      obsKeyPress: null
    }
  },
  mounted() {
    this.obsKeyPress = this.rpgKeypress.subscribe(({ control }) => {
      if (!control) return
      if (control.actionName == Control.Back) {
        this.back()
      }
    })
  },
  unmounted() {
    if (this.obsKeyPress) {
      this.obsKeyPress.unsubscribe()
    }
  },
  methods: {
    back() {
      this.$emit('changeLayout', 'rpg-main-menu')
    }
  }
}
</script>

<style scoped>
.quest-inventory {
  height: 100%;
}

.quest-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.title {
  font-size: 1.8em;
  color: #FFD700;
  margin: 0;
}

.back-button {
  background-color: #4a5568;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.back-button:hover {
  background-color: #2d3748;
}

.quest-content {
  flex: 1;
  overflow-y: auto;
}
</style>
