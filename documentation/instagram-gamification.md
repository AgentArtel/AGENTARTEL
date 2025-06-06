# Instagram Post Gamification Concept

This document outlines the design and implementation plan for gamifying the Instagram posting process in ARTELIO, specifically for the simplemap2 area.

## Concept Overview

The Instagram Post Gamification feature transforms the process of creating and posting to Instagram into an engaging in-game activity. Players collect various components of an Instagram post as in-game items, assemble them at a special station, and can then publish actual posts to Instagram through a webhook integration.

## Instagram Post Schema Elements

An Instagram post consists of these key components, which will be represented as collectible items in the game:

### 1. Visual Content
- **Main Image/Photo**: The primary visual content
- **Visual Filters/Effects**: Modifications to enhance the image
- **Frames/Borders**: Decorative elements around the image

### 2. Text Content
- **Caption**: The main text accompanying the image
- **Hashtags**: Keywords to increase discoverability
- **Location Tag**: Geographic information
- **User Tags/Mentions**: References to other users

### 3. Engagement Elements
- **Engagement Boosters**: Items that potentially increase post visibility

## Game Implementation

### Collectible Items

1. **Visual Content Items:**
   - **Magical Camera**: Allows players to capture scenes or generate art
   ```typescript
   @Item({
       id: 'magical-camera',
       name: 'Magical Camera',
       description: 'Captures magical moments that can be shared with the world.',
       consumable: false,
       type: 'tool'
   })
   export default class MagicalCamera {
       // Camera functionality
   }
   ```

   - **Filter Crystals**: Different colored crystals that apply visual effects
   ```typescript
   @Item({
       id: 'filter-crystal-${color}',
       name: '${Color} Filter Crystal',
       description: 'Applies a ${color} filter to your images.',
       consumable: false,
       type: 'filter'
   })
   export default class FilterCrystal {
       static color: string = 'blue';
       static filterEffect: string = 'cool';
   }
   ```

   - **Frame Fragments**: Collect pieces to create unique frames for images
   ```typescript
   @Item({
       id: 'frame-fragment-${style}',
       name: '${Style} Frame Fragment',
       description: 'A piece of a ${style} frame. Collect all pieces to complete the frame.',
       consumable: false,
       type: 'frame'
   })
   export default class FrameFragment {
       static style: string = 'rustic';
       static isComplete: boolean = false;
   }
   ```

2. **Text Content Items:**
   - **Caption Scrolls**: Magical scrolls containing witty or inspiring captions
   ```typescript
   @Item({
       id: 'caption-scroll-${type}',
       name: '${Type} Caption Scroll',
       description: 'Contains a ${type} caption for your posts.',
       consumable: false,
       type: 'caption'
   })
   export default class CaptionScroll {
       static captionType: string = 'inspirational';
       static text: string = 'Adventure awaits those who seek it.';
   }
   ```

   - **Hashtag Tokens**: Collectible tokens with trending hashtags
   ```typescript
   @Item({
       id: 'hashtag-token-${category}',
       name: '${Category} Hashtag Token',
       description: 'A token containing popular ${category} hashtags.',
       consumable: false,
       type: 'hashtag'
   })
   export default class HashtagToken {
       static category: string = 'travel';
       static hashtags: string[] = ['#adventure', '#explore', '#wanderlust'];
   }
   ```

   - **Location Markers**: Items that tag specific in-game locations
   ```typescript
   @Item({
       id: 'location-marker-${place}',
       name: '${Place} Location Marker',
       description: 'Tags your post with the ${place} location.',
       consumable: false,
       type: 'location'
   })
   export default class LocationMarker {
       static place: string = 'Enchanted Forest';
       static coordinates: string = '42.123,-71.456';
   }
   ```

3. **Engagement Boosters:**
   - **Like Charms**: Increase potential engagement
   ```typescript
   @Item({
       id: 'like-charm',
       name: 'Like Charm',
       description: 'Increases the chance of getting likes on your post.',
       consumable: true,
       type: 'engagement'
   })
   export default class LikeCharm {
       static boostFactor: number = 1.5;
   }
   ```

### Map Design for simplemap2

The simplemap2 area will be designed with distinct zones for collecting different Instagram post components:

1. **Central Hub**: 
   - Location of the Influencer NPC and Post Creation Station
   - Starting point for Instagram-related quests

2. **Visual District**:
   - Artistic area with photo opportunities and filter items
   - Contains the Magical Camera and Filter Crystal vendors
   - Features scenic viewpoints for capturing images

3. **Caption Corner**:
   - Library-like area with scrolls and writing NPCs
   - Players can find or purchase Caption Scrolls
   - NPCs offer writing workshops to create custom captions

4. **Hashtag Hollow**:
   - Cave system where hashtag tokens glow in the dark
   - Different sections for different hashtag categories
   - Special puzzles to unlock rare hashtag tokens

5. **Engagement Gardens**:
   - Beautiful area where engagement items grow
   - Players can harvest Like Charms and other boosters
   - Timed events for special engagement items

### Post Creation Station

The Post Creation Station is a special interactive object where players can assemble their Instagram posts:

```typescript
@EventData({
    name: 'post-creation-station',
    mode: EventMode.Shared,
    hitbox: {
        width: 48,
        height: 32
    }
})
export default class PostCreationStationEvent extends RpgEvent {
    onInit() {
        this.setGraphic('post-station')
        this.setComponentsTop(Components.text('Instagram Post Station'))
    }
    
    async onAction(player: RpgPlayer) {
        // Open the post creation interface
        player.gui('rpg-post-creator').open({
            playerItems: player.getItems()
        })
    }
}
```

### Post Creator GUI

A custom GUI component for assembling Instagram posts:

```typescript
// PostCreator.vue
export default {
    name: 'rpg-post-creator',
    data() {
        return {
            selectedImage: null,
            selectedFilter: null,
            selectedFrame: null,
            selectedCaption: '',
            selectedHashtags: [],
            selectedLocation: null,
            selectedBooster: null,
            previewUrl: '',
            engagementScore: 0
        }
    },
    methods: {
        // Methods for selecting components
        selectImage(item) { /* ... */ },
        selectFilter(item) { /* ... */ },
        // ...
        
        // Calculate engagement score based on selections
        calculateEngagementScore() { /* ... */ },
        
        // Preview the post
        generatePreview() { /* ... */ },
        
        // Submit the post to Instagram via webhook
        async submitPost() {
            const postData = {
                image: this.selectedImage,
                caption: this.selectedCaption,
                hashtags: this.selectedHashtags,
                location: this.selectedLocation,
                // ...
            }
            
            try {
                const response = await axios.post(config.webhooks.instagramPost, postData)
                // Handle success
            } catch (error) {
                // Handle error
            }
        }
    }
}
```

### Influencer NPC

An NPC that guides players through the Instagram posting process:

```typescript
@EventData({
    name: 'influencer-npc',
    mode: EventMode.Shared,
    hitbox: {
        width: 32,
        height: 16
    }
})
export default class InfluencerEvent extends RpgEvent {
    onInit() {
        this.setGraphic('influencer')
        this.setComponentsTop(Components.text('Social Media Guru'))
    }
    
    async onAction(player: RpgPlayer) {
        // Initial greeting
        await player.showText("Hey there! Want to learn how to create the perfect post? I can teach you all about getting those likes and follows!", {
            talkWith: this
        })
        
        // Offer Instagram-related quests
        const choice = await player.showChoices("What would you like to do?", [
            { text: "Learn about posting", value: 'tutorial' },
            { text: "Get a posting quest", value: 'quest' },
            { text: "Show me my stats", value: 'stats' }
        ])
        
        if (choice) {
            // Handle player choice
            if (choice.value === 'tutorial') {
                // Show tutorial
            } else if (choice.value === 'quest') {
                // Give Instagram quest
            } else if (choice.value === 'stats') {
                // Show posting stats
            }
        }
    }
}
```

## Webhook Integration

The Instagram post feature will integrate with a webhook that handles the actual posting to Instagram:

```typescript
// Example webhook call
const response = await axios.post(config.webhooks.instagramPost, {
    image: imageData, // Base64 encoded image or URL
    caption: caption + ' ' + hashtags.join(' '),
    location: locationData,
    // Additional Instagram API parameters
})
```

## Game Loop and Progression

1. **Introduction**:
   - Player meets the Influencer NPC who introduces the concept
   - Player receives a basic Magical Camera and simple Caption Scroll

2. **Collection Phase**:
   - Player explores simplemap2 to collect Instagram components
   - Complete mini-quests to earn rare components
   - Trade with NPCs for specific items

3. **Creation Phase**:
   - Player visits the Post Creation Station
   - Combines collected items to create a post
   - Previews the post and adjusts components

4. **Submission Phase**:
   - Player submits the post through the game
   - Receives in-game rewards based on the calculated engagement score
   - Optional: Post is published to the player's actual Instagram account

5. **Progression**:
   - Player unlocks more advanced components as they level up
   - Special time-limited events offer unique components
   - Leaderboard for most successful in-game influencers

## Technical Implementation Plan

1. **Phase 1: Core Items and NPCs**
   - Create basic item classes for Instagram components
   - Implement the Influencer NPC
   - Design the simplemap2 layout

2. **Phase 2: Post Creation Interface**
   - Develop the Post Creator GUI
   - Implement component selection and preview functionality
   - Create the Post Creation Station event

3. **Phase 3: Webhook Integration**
   - Set up the Instagram posting webhook
   - Implement authentication and authorization
   - Test posting functionality

4. **Phase 4: Gamification Elements**
   - Add engagement scoring system
   - Implement rewards and progression
   - Create special events and challenges

## Conclusion

The Instagram Post Gamification feature transforms a common social media activity into an engaging game mechanic. By breaking down the posting process into collectible components and adding gameplay elements, we create a unique experience that bridges the virtual world of ARTELIO with real-world social media interaction.

This system not only provides entertainment value but also potentially streamlines the content creation process for players who are active on social media, allowing them to generate creative content through gameplay.
