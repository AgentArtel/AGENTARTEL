// Load environment variables
import dotenv from 'dotenv';
import path from 'path';

// Load the .env file from the project root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

/**
 * Configuration utility for accessing environment variables
 * This centralizes all external integrations and configuration values
 */
export const config = {
  // Webhook URLs
  webhooks: {
    artGeneration: process.env.ART_GENERATION_WEBHOOK_URL || 'https://theagentartel.app.n8n.cloud/webhook-test/generate-art',
    npcDialogue: process.env.NPC_DIALOGUE_WEBHOOK_URL || 'https://theagentartel.app.n8n.cloud/webhook-test/chat',
  },
  
  // Default assets
  defaultAssets: {
    villagePainting: process.env.DEFAULT_PAINTING_URL || 'https://cdn.midjourney.com/c21f4371-f4ea-465d-87fc-c28e66576b5c/0_2.png',
  },
  
  // Helper method to get a webhook URL by name
  getWebhookUrl(name: string): string {
    return this.webhooks[name] || '';
  }
};

export default config;
