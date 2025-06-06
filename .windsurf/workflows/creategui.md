---
description: A step-by-step workflow for creating custom GUI components in your RPG-JS game.
---

# Create Custom GUI Components in RPG-JS

This workflow guides you through creating custom GUI components for your RPG-JS game, with a specific example of creating an image viewer for displaying artwork like paintings.

## Prerequisites
- Existing RPG-JS project
- Basic understanding of TypeScript and React (or Vue.js)
- Image files (PNG, JPEG) for your GUI components

## Step 1: Install the Default GUI Package (if not already installed)

```bash
npx rpgjs add @rpgjs/default-gui
```

## Step 2: Set Up the GUI Structure

Create the necessary directories for your custom GUI components and assets:

```bash
# Create the necessary directories if they don't exist
mkdir -p main/client/gui
mkdir -p main/client/assets/images
```

## Step 3: Add Image Assets

Place your image files in the assets directory:

```bash
# Copy your image files to the assets directory
cp your-image.png main/client/assets/images/
```

## Step 4: Create a Custom GUI Component with React

Create a new React component file for your image viewer:

```tsx
// main/client/gui/ImageViewer.tsx
import { RpgReactContext } from '@rpgjs/client/react';
import { useContext, useEffect, useState } from 'react';
import './ImageViewer.css';

export default function ImageViewer({ src, alt, title, description }) {
  const { rpgStage } = useContext(RpgReactContext);
  const [isVisible, setIsVisible] = useState(true);

  const handleClose = () => {
    setIsVisible(false);
    // Close the GUI
    rpgStage.gui('image-viewer').close();
  };

  if (!isVisible) return null;

  return (
    <div className="image-viewer">
      <div className="image-container">
        <img src={src} alt={alt || 'Image'} />
        {title && <div className="image-title">{title}</div>}
        {description && <div className="image-description">{description}</div>}
        <button className="close-button" onClick={handleClose}>Close</button>
      </div>
    </div>
  );
}
```

## Step 5: Add CSS for the Image Viewer

Create a CSS file for styling your image viewer:

```css
/* main/client/gui/ImageViewer.css */
.image-viewer {
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

.image-container {
  background-color: white;
  padding: 20px;
  border-radius: 5px;
  max-width: 80%;
  max-height: 80%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.image-container img {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
}

.image-title {
  font-size: 24px;
  font-weight: bold;
  margin-top: 10px;
  text-align: center;
}

.image-description {
  margin-top: 10px;
  text-align: center;
  max-width: 80%;
}

.close-button {
  margin-top: 20px;
  padding: 8px 16px;
  background-color: #4a5568;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.close-button:hover {
  background-color: #2d3748;
}
```

## Step 6: Register the Component in Your Client Module

Create or update your client module file to register the component:

```typescript
// main/client/index.ts
import { RpgModule, RpgClient } from '@rpgjs/client'
import ImageViewer from './gui/ImageViewer'

@RpgModule<RpgClient>({
  gui: {
    guiTypes: {
      'image-viewer': ImageViewer
    }
  }
})
export default class RpgClientEngine {}
```

## Step 7: Update the Item to Use the GUI Component

Modify your item file to show the image when used:

```typescript
// main/database/items/village-painting.ts
import { Item } from '@rpgjs/database'
import { RpgPlayer } from '@rpgjs/server'

@Item({
    id: 'village-painting',
    name: 'Village Painting',
    description: 'A beautiful painting of the village at sunset. Created by Aria, the village artist.',
    price: 50,
    consumable: false
})
export default class VillagePainting {
    onUse(player: RpgPlayer) {
        // Open the image viewer GUI with the painting image
        player.gui('image-viewer').open({
            src: '/assets/images/village-painting.png',
            alt: 'Village Painting',
            title: 'Village at Sunset',
            description: 'A beautiful painting capturing the village bathed in the golden light of sunset. The brushwork reveals the artist\'s deep appreciation for the subtle interplay of light and shadow.'
        })
        return false // Don't consume the item
    }
}
```

## Step 8: Add the Image to Your Project

Create a spritesheet for your image to make it accessible in the game:

```typescript
// main/client/spritesheets/images.ts
import { Spritesheet } from '@rpgjs/client'

@Spritesheet({
    images: {
        'village-painting': require('../assets/images/village-painting.png')
    }
})
export class ImagesSpritesheet {}
```

Then register this spritesheet in your client module:

```typescript
// main/client/index.ts (update)
import { RpgModule, RpgClient } from '@rpgjs/client'
import ImageViewer from './gui/ImageViewer'
import { ImagesSpritesheet } from './spritesheets/images'

@RpgModule<RpgClient>({
  spritesheets: [
    ImagesSpritesheet
  ],
  gui: {
    guiTypes: {
      'image-viewer': ImageViewer
    }
  }
})
export default class RpgClientEngine {}
```
```

## Step 9: Test Your GUI Component

1. Run your game: `npm run dev`
2. Obtain the village painting from the artist NPC
3. Open your inventory and use the painting
4. Verify the image viewer appears and displays the painting
5. Test the close button functionality

## Image Requirements

For optimal display in your RPG-JS game:

1. **File Format**: PNG or JPEG (PNG recommended for images with transparency)
2. **Resolution**: 512x512 pixels is a good starting point (can be adjusted based on your needs)
3. **File Size**: Keep under 500KB for better performance
4. **File Location**: Place in `main/client/assets/images/` directory
5. **File Naming**: Use kebab-case (e.g., `village-painting.png`)

## Customization Options

### Add Zoom Functionality

```tsx
// Enhanced ImageViewer.tsx with zoom
import { useState } from 'react';

export default function ImageViewer({ src, alt, title, description }) {
  const [zoomLevel, setZoomLevel] = useState(1);
  
  const zoomIn = () => {
    setZoomLevel(Math.min(zoomLevel + 0.2, 3));
  };
  
  const zoomOut = () => {
    setZoomLevel(Math.max(zoomLevel - 0.2, 0.5));
  };
  
  // ... rest of component code
  
  return (
    <div className="image-viewer">
      <div className="image-container">
        <img 
          src={src} 
          alt={alt || 'Image'} 
          style={{ transform: `scale(${zoomLevel})` }}
        />
        {/* ... other elements */}
        <div className="zoom-controls">
          <button onClick={zoomIn}>+</button>
          <button onClick={zoomOut}>-</button>
        </div>
        <button className="close-button" onClick={handleClose}>Close</button>
      </div>
    </div>
  );
}
```

### Add Gallery Functionality

For displaying multiple images:

```tsx
// Enhanced ImageViewer.tsx with gallery
import { useState } from 'react';

export default function ImageViewer({ images }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const nextImage = () => {
    setCurrentIndex((currentIndex + 1) % images.length);
  };
  
  const prevImage = () => {
    setCurrentIndex((currentIndex - 1 + images.length) % images.length);
  };
  
  const currentImage = images[currentIndex];
  
  // ... rest of component code
  
  return (
    <div className="image-viewer">
      <div className="image-container">
        <img src={currentImage.src} alt={currentImage.alt || 'Image'} />
        <div className="image-title">{currentImage.title}</div>
        <div className="image-description">{currentImage.description}</div>
        
        {images.length > 1 && (
          <div className="gallery-controls">
            <button onClick={prevImage}>Previous</button>
            <button onClick={nextImage}>Next</button>
          </div>
        )}
        
        <button className="close-button" onClick={handleClose}>Close</button>
      </div>
    </div>
  );
}
```

## Troubleshooting

- **Image doesn't appear**: Verify the image path is correct and the file exists in the assets directory
- **Image path error**: Make sure you've registered the image in a spritesheet
- **Component doesn't show**: Check that the component is properly registered in the client module
- **GUI doesn't open**: Verify you're using `player.gui('image-viewer').open()` with the correct ID
- **Styling issues**: Check your CSS file is properly imported

## Best Practices

- **Storytelling Integration**: Use visual elements to enhance your narrative and deepen player immersion
- **Consistent Style**: Maintain a consistent visual style across all GUI components
- **Responsive Design**: Ensure your components work well on different screen sizes
- **Performance**: Optimize image sizes to prevent long loading times
- **Accessibility**: Include alt text for images and ensure UI elements are keyboard navigable

This workflow has been designed to help you create interactive GUI components that enhance your storytelling through visual elements. The image viewer component is particularly useful for games that incorporate art, documents, or other visual storytelling elements - perfect for your creative vision of building immersive, interactive experiences.
