<template>
  <div v-if="visible" class="image-viewer-overlay">
    <div class="image-viewer-container">
      <div class="image-viewer-header">
        <h2>{{ imageTitle }}</h2>
        <button @click="close" class="close-button">×</button>
      </div>
      <div class="image-viewer-content">
        <img :src="imageSrc" :alt="imageAlt" class="artwork-image" @load="imageLoaded" @error="imageLoadError" />
        <p class="image-description">{{ imageDescription }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import { Control } from '@rpgjs/client'

export default {
  name: 'rpg-image-viewer',
  inject: ['rpgEngine', 'rpgKeypress', 'rpgGuiClose', 'rpgResource'],
  data() {
    return {
      visible: true,
      imageSrc: '',
      imageAlt: 'Artwork',
      imageTitle: 'Artwork',
      imageDescription: ''
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
    this.imageSrc = params.src || ''
    this.imageAlt = params.alt || 'Artwork'
    this.imageTitle = params.title || 'Artwork'
    this.imageDescription = params.description || ''
  },
  methods: {
    imageLoaded() {
      console.log('Image loaded successfully:', this.imageSrc)
    },
    imageLoadError() {
      console.error('Failed to load image:', this.imageSrc)
      // Fall back to a default image if available
      this.imageSrc = 'https://cdn.midjourney.com/c21f4371-f4ea-465d-87fc-c28e66576b5c/0_2.png'
    },
    close() {
      this.rpgGuiClose('rpg-image-viewer')
    }
  },
  unmounted() {
    if (this.obsKeyPress) this.obsKeyPress.unsubscribe()
  }
}
</script>

<style>
.image-viewer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.image-viewer-container {
  background-color: #fff;
  border-radius: 5px;
  width: 80%;
  max-width: 800px;
  max-height: 90%;
  overflow: auto;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
}

.image-viewer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  border-bottom: 1px solid #eee;
}

.image-viewer-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #333;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
}

.close-button:hover {
  color: #000;
}

.image-viewer-content {
  padding: 20px;
  text-align: center;
}

.artwork-image {
  max-width: 100%;
  max-height: 60vh;
  margin-bottom: 15px;
  border: 1px solid #ddd;
}

.image-description {
  color: #555;
  line-height: 1.6;
  text-align: left;
}
</style>
