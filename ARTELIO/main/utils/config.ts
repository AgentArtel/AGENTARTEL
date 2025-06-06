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
  // Webhook URLs - Standardized by skill/purpose
  webhooks: {
    generation: {
      initialFragment: process.env.GET_ITEM_WEBHOOK_URL || 'https://your-default-get-item-url.com/placeholder', // For EchoWeaverNpc
      // Example: dynamicQuest: process.env.DYNAMIC_QUEST_GENERATION_URL
      artGeneration: process.env.ART_GENERATION_WEBHOOK_URL || 'https://theagentartel.app.n8n.cloud/webhook/generate-art', // Moved existing
      artGenerator: process.env.ART_GENERATOR_WEBHOOK_URL || 'https://theagentartel.app.n8n.cloud/webhook/generate-art', // Moved existing (duplicate of artGeneration?)
    },
    processing: {
      mediaFragment: process.env.PROCESS_FRAGMENT_WEBHOOK_URL || 'https://your-default-process-fragment-url.com/placeholder', // For EchoSeerNpc
      // Example: imageAnalysis: process.env.IMAGE_ANALYSIS_URL
    },
    dialogue: {
      agentArtelChat: process.env.AGENT_ARTEL_CHAT_WEBHOOK_URL || 'https://your-default-agentartel-chat-url.com/placeholder', // General AgentArtel chat
      npcGeneral: process.env.NPC_DIALOGUE_WEBHOOK_URL || 'https://theagentartel.app.n8n.cloud/webhook/chat', // Moved existing (generic NPC chat)
      questGiver: process.env.QUEST_GIVER_WEBHOOK_URL || 'https://theagentartel.app.n8n.cloud/webhook/quest_giver', // Moved existing
      cleanCodeMentor: process.env.CLEAN_CODE_MENTOR_WEBHOOK_URL || 'https://theagentartel.app.n8n.cloud/webhook/clean-code-mentor', // Moved existing
    },
    // utility: {
    //   // Example: sentimentAnalysis: process.env.SENTIMENT_ANALYSIS_URL
    // }
  },
  
  // Default assets
  defaultAssets: {
    villagePainting: process.env.DEFAULT_PAINTING_URL || 'https://cdn.midjourney.com/c21f4371-f4ea-465d-87fc-c28e66576b5c/0_2.png',
  },
  
  // AgentArtel API configuration
  agentArtel: {
    apiKey: process.env.AGENT_ARTEL_API_KEY || 'YOUR_API_KEY_HERE', // Set this in .env file
    baseUrl: process.env.AGENT_ARTEL_BASE_URL || 'https://agent-artel-production.up.railway.app',
    agents: {
      dreamInterpreter: process.env.AGENT_ARTEL_DREAM_INTERPRETER || 'sigmund-freud',
      historyMentor: process.env.AGENT_ARTEL_HISTORY_MENTOR || 'history-mentor',
      scienceMentor: process.env.AGENT_ARTEL_SCIENCE_MENTOR || 'science-mentor',
      mentalHealthGuide: process.env.AGENT_ARTEL_MENTAL_HEALTH_GUIDE || 'mental-health-guide',
      cleanCodeMentor: process.env.AGENT_ARTEL_CLEAN_CODE_MENTOR || 'uncle-bob'
    }
  },

  // AgentDock API configuration
  agentDock: {
    baseUrl: process.env.AGENTDOCK_CHAT_API_BASE_URL || 'http://localhost:3000/api/chat', // Default if not in .env
    agents: {
      mysticVillager: 'rpgjs-mystic-villager', // This is the agentId from AgentDock
      auraWeaverElara: 'rpgjs-aura-weaver-elara',
      'rpgjs-pixel-alchemist-phin': 'rpgjs-pixel-alchemist-phin', // Added Pixel Alchemist Phin
      seraphinaStarWeaver: 'rpgjs-seraphina-star-weaver' // Added Seraphina Star Weaver
    }
  },
  
  // Helper method to get a webhook URL by category and name
  getWebhookUrl(category: 'generation' | 'processing' | 'dialogue' /* | 'utility' */, name: string): string {
    if (this.webhooks[category] && this.webhooks[category][name]) {
      return this.webhooks[category][name];
    }
    console.warn(`Webhook URL not found for category '${category}' and name '${name}' in config.ts`);
    return ''; // Return empty string or a default placeholder if preferred
  },
  
  // Helper method to get an AgentArtel agent ID
  getAgentArtelId(name: string): string {
    return this.agentArtel.agents[name] || '';
  },

  // Helper method to get an AgentDock agent ID
  getAgentDockAgentId(name: string): string {
    return this.agentDock.agents[name] || '';
  },

  // Helper method to get the full AgentDock chat URL for a specific agent
  getAgentDockChatUrl(agentKey: keyof typeof config.agentDock.agents): string {
    const agentId = this.agentDock.agents[agentKey];
    if (!agentId) {
      console.warn(`AgentDock agent ID not found for key '${agentKey}' in config.ts`);
      return '';
    }
    return `${this.agentDock.baseUrl}/${agentId}`;
  }
};

export default config;
