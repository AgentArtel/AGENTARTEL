<template>
  <div class="quest-tracker">
    <div v-if="activeQuest" class="quest-container">
      <h2 class="quest-title">{{ activeQuest.title }}</h2>
      <div class="quest-description">{{ activeQuest.description }}</div>
      
      <div class="quest-progress">
        <div class="progress-label">Progress: {{ activeQuest.progress }} / {{ activeQuest.target }}</div>
        <div class="progress-bar-container">
          <div class="progress-bar" :style="{ width: progressPercentage + '%' }"></div>
        </div>
      </div>
      
      <div class="quest-reward">
        <span class="reward-label">Reward:</span> {{ activeQuest.reward }}
      </div>
    </div>
    
    <div v-else class="no-quest">
      <p>You don't have any active quests.</p>
      <p>Speak to the Quest Master to get started on a new adventure!</p>
    </div>
  </div>
</template>

<script>
import { RpgGui } from '@rpgjs/client'

export default {
  name: 'QuestTracker',
  data() {
    return {
      activeQuest: null
    }
  },
  computed: {
    progressPercentage() {
      if (!this.activeQuest) return 0
      return Math.min(100, (this.activeQuest.progress / this.activeQuest.target) * 100)
    }
  },
  mounted() {
    // Check if we can access the player
    this.checkPlayer()
    
    // Set up an interval to check for player and quest data
    this.interval = setInterval(() => {
      this.checkPlayer()
    }, 1000)
  },
  
  beforeUnmount() {
    // Clear the interval when component is unmounted
    if (this.interval) {
      clearInterval(this.interval)
    }
  },
  methods: {
    checkPlayer() {
      try {
        // Try to get the player
        const player = RpgGui.get('player')
        
        if (player) {
          // If player exists, update quest data
          this.activeQuest = player.getVariable('ACTIVE_QUEST')
        }
      } catch (error) {
        console.error('Error accessing player:', error)
      }
    }
  }
}
</script>

<style scoped>
.quest-tracker {
  background-color: rgba(30, 30, 60, 0.9);
  border-radius: 5px;
  padding: 15px;
  color: white;
  font-family: Arial, sans-serif;
  max-width: 400px;
  margin: 0 auto;
}

.quest-title {
  font-size: 18px;
  margin-top: 0;
  margin-bottom: 10px;
  color: #ffd700;
  text-align: center;
}

.quest-description {
  margin-bottom: 15px;
  font-size: 14px;
  line-height: 1.4;
}

.quest-progress {
  margin-bottom: 15px;
}

.progress-label {
  font-size: 14px;
  margin-bottom: 5px;
}

.progress-bar-container {
  height: 10px;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 5px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background-color: #4CAF50;
  transition: width 0.3s ease;
}

.quest-reward {
  font-size: 14px;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.reward-label {
  font-weight: bold;
  color: #ffd700;
}

.no-quest {
  text-align: center;
  padding: 20px 0;
  color: #ccc;
}
</style>
