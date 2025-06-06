<template>
  <div v-if="visible" class="artwork-viewer">
    <div class="artwork-container">
      <div v-if="loading" class="loading-indicator">
        <p>Loading artwork...</p>
      </div>
      <div v-else-if="imageError" class="error-message">
        <p>Unable to load image. Please try again later.</p>
        <button @click="close" class="close-button">Close</button>
      </div>
      <template v-else>
        <img :src="imageUrl" :alt="title" class="artwork-image" @load="imageLoaded" @error="imageLoadError" />
        <div class="artwork-info">
          <h2>{{ title }}</h2>
          <p>{{ description }}</p>
          <button @click="close" class="close-button">Close</button>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
import { Control } from '@rpgjs/client'

export default {
  name: 'rpg-artwork-viewer',
  inject: ['rpgKeypress', 'rpgGuiClose'],
  data() {
    return {
      visible: true,
      imageUrl: '',
      title: 'Artwork',
      description: '',
      loading: true,
      imageError: false
    }
  },
  mounted() {
    // Set up key press listener for closing with action key
    this.obsKeyPress = this.rpgKeypress.subscribe(({ control }) => {
      if (control && control.actionName == Control.Action) {
        this.close()
      }
    })
    
    // Get parameters passed from the server
    const params = this.$attrs || {}
    this.title = params.title || 'Artwork'
    this.description = params.description || ''
    
    // Set the image URL and start loading
    if (params.imageUrl) {
      this.loading = true
      this.imageUrl = params.imageUrl
      
      // Create a test image to check if the URL is valid
      const testImage = new Image()
      testImage.onload = () => {
        this.loading = false
        console.log('Image loaded successfully:', this.imageUrl)
      }
      testImage.onerror = () => {
        this.loading = false
        this.imageError = true
        console.error('Failed to load image:', this.imageUrl)
      }
      testImage.src = params.imageUrl
    } else {
      this.loading = false
      this.imageError = true
    }
  },
  methods: {
    close() {
      this.rpgGuiClose('rpg-artwork-viewer')
    },
    imageLoaded() {
      this.loading = false
      console.log('Image loaded successfully:', this.imageUrl)
    },
    imageLoadError() {
      this.loading = false
      this.imageError = true
      console.error('Failed to load image:', this.imageUrl)
    }
  },
  unmounted() {
    if (this.obsKeyPress) this.obsKeyPress.unsubscribe()
  }
}
</script>

<style scoped>
.artwork-viewer {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.artwork-container {
  background-color: #fff;
  border-radius: 8px;
  width: 90%;
  max-width: 800px;
  max-height: 90%;
  overflow: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}

.artwork-image {
  max-width: 100%;
  max-height: 60vh;
  object-fit: contain;
  margin-bottom: 20px;
  border: 1px solid #ddd;
}

.artwork-info {
  width: 100%;
  text-align: center;
}

.artwork-info h2 {
  margin: 0 0 10px 0;
  font-size: 24px;
  color: #333;
}

.artwork-info p {
  margin: 0 0 20px 0;
  color: #555;
  line-height: 1.5;
}

.close-button {
  background-color: #4a5568;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 16px;
}

.close-button:hover {
  background-color: #2d3748;
}

.loading-indicator {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  width: 100%;
}

.loading-indicator p {
  font-size: 18px;
  color: #4a5568;
}

.error-message {
  text-align: center;
  padding: 20px;
}

.error-message p {
  color: #e53e3e;
  margin-bottom: 20px;
  font-size: 18px;
}
</style>
