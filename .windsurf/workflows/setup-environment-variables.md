---
description: How to set up and use environment variables for external integrations in RPG-JS
---

# Setting Up Environment Variables for RPG-JS

This workflow guides you through setting up environment variables for your RPG-JS project to manage external integrations, API keys, and other configuration values that shouldn't be hardcoded in your source code.

## Why Use Environment Variables?

Environment variables offer several advantages:

1. **Security**: Keep sensitive information like API keys out of your codebase
2. **Flexibility**: Easily change configuration without modifying code
3. **Environment-Specific Settings**: Use different values for development and production
4. **Centralized Configuration**: Manage all external connections in one place

## Step 1: Install Required Packages

First, ensure you have the `dotenv` package installed in your project:

```bash
npm install dotenv
```

## Step 2: Create the .env File

Create a `.env` file in the root of your project:

```bash
touch .env
```

Add your environment variables to this file:

```
# External API Webhooks
ART_GENERATION_WEBHOOK_URL=https://your-art-api.com/generate
NPC_DIALOGUE_WEBHOOK_URL=https://your-dialogue-api.com/chat

# Default Assets
DEFAULT_PAINTING_URL=https://example.com/default-painting.jpg

# API Keys (if needed)
API_KEY_NAME=your_api_key_here
```

Important notes:
- No spaces around the equals sign
- No quotes around values
- One variable per line
- Comments start with #

## Step 3: Add .env to .gitignore

To prevent accidentally committing your environment variables to version control, add `.env` to your `.gitignore` file:

```bash
echo ".env" >> .gitignore
```

## Step 4: Create a Configuration Utility

Create a central configuration utility to load and provide access to your environment variables:

```typescript
// main/utils/config.ts
import dotenv from 'dotenv'

// Load environment variables from .env file
dotenv.config()

export const config = {
    webhooks: {
        artGeneration: process.env.ART_GENERATION_WEBHOOK_URL || 'https://default-art-api.com/generate',
        npcDialogue: process.env.NPC_DIALOGUE_WEBHOOK_URL || 'https://default-dialogue-api.com/chat'
    },
    defaultAssets: {
        villagePainting: process.env.DEFAULT_PAINTING_URL || 'https://example.com/default-painting.jpg'
    },
    apiKeys: {
        keyName: process.env.API_KEY_NAME || ''
    }
}
```

Key features of this utility:
- Loads environment variables automatically
- Provides fallback values for missing variables
- Organizes variables into logical categories
- Exposes a clean interface for accessing configuration

## Step 5: Using the Configuration in Your Code

Import and use the configuration utility in your code:

```typescript
// Example: Using in an NPC event
import { RpgEvent, EventData, RpgPlayer } from '@rpgjs/server'
import axios from 'axios'
import { config } from '../utils/config'

@EventData({
    name: 'village-artist'
})
export default class ArtistEvent extends RpgEvent {
    async onAction(player: RpgPlayer) {
        // Use the webhook URL from the config
        const response = await axios.post(config.webhooks.artGeneration, {
            prompt: 'A magical fantasy village'
        })
        
        // Use other config values as needed
        const defaultImageUrl = config.defaultAssets.villagePainting
    }
}
```

## Step 6: Create a Sample .env File for Team Members

Create a `.env.example` file that contains all the variables but with placeholder values:

```
# External API Webhooks
ART_GENERATION_WEBHOOK_URL=https://example.com/art-generation
NPC_DIALOGUE_WEBHOOK_URL=https://example.com/npc-dialogue

# Default Assets
DEFAULT_PAINTING_URL=https://example.com/default-painting.jpg

# API Keys
API_KEY_NAME=your_api_key_here
```

This helps other team members know which environment variables they need to set up.

## Step 7: Loading Environment Variables in Development

For local development, the `.env` file will be loaded automatically by the `dotenv` package.

If you're using a specific development environment or build tool, you might need additional configuration:

### For Webpack
If you're using webpack, you can use the `dotenv-webpack` plugin:

```javascript
// webpack.config.js
const Dotenv = require('dotenv-webpack')

module.exports = {
  // ...
  plugins: [
    new Dotenv()
  ]
}
```

### For Vite
If you're using Vite, it loads `.env` files automatically.

## Step 8: Environment Variables in Production

For production deployments, set environment variables according to your hosting provider:

### Netlify
In the Netlify dashboard, go to Site settings > Build & deploy > Environment variables.

### Vercel
In the Vercel dashboard, go to Project settings > Environment Variables.

### Custom Server
Set environment variables directly on your server or in your deployment configuration.

## Best Practices

1. **Never commit sensitive information**: Keep `.env` in your `.gitignore`
2. **Use descriptive variable names**: Make it clear what each variable is for
3. **Provide fallback values**: Handle cases where variables are missing
4. **Document required variables**: Keep your `.env.example` up to date
5. **Limit access to sensitive values**: Only expose what's needed to each component
6. **Validate environment variables**: Check that required variables exist at startup

## Troubleshooting

- **Variables not loading**: Make sure `dotenv.config()` is called early in your application
- **Undefined values**: Check that your `.env` file is in the correct location and has the correct variable names
- **Changes not taking effect**: Restart your development server after changing environment variables

## Example: Complete Configuration Setup

Here's a complete example of how to set up and use environment variables in an RPG-JS project:

1. Install dotenv:
```bash
npm install dotenv
```

2. Create `.env` file:
```
ART_GENERATION_WEBHOOK_URL=https://theagentartel.app.n8n.cloud/webhook-test/generate-art
NPC_DIALOGUE_WEBHOOK_URL=https://theagentartel.app.n8n.cloud/webhook-test/chat
DEFAULT_PAINTING_URL=https://example.com/default-painting.jpg
```

3. Create config utility:
```typescript
// main/utils/config.ts
import dotenv from 'dotenv'

dotenv.config()

export const config = {
    webhooks: {
        artGeneration: process.env.ART_GENERATION_WEBHOOK_URL || 'https://default-art-api.com/generate',
        npcDialogue: process.env.NPC_DIALOGUE_WEBHOOK_URL || 'https://default-dialogue-api.com/chat'
    },
    defaultAssets: {
        villagePainting: process.env.DEFAULT_PAINTING_URL || 'https://example.com/default-painting.jpg'
    }
}
```

4. Use in your code:
```typescript
import { config } from '../utils/config'

// Use webhook URL
const response = await axios.post(config.webhooks.artGeneration, {
    prompt: 'A magical fantasy village'
})
```

This approach makes it easy to manage all your external integrations and configuration values in a centralized, secure way.
