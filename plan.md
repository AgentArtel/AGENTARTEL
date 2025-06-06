Conceptual Integration of AgentDock AI-NPCs with RPGJS via Webhooks and API Calls1. IntroductionThe landscape of role-playing games (RPGs) is continually evolving, with player immersion and dynamic narrative experiences at the forefront of innovation. AgentDock, a framework designed for building sophisticated AI agents capable of complex tasks with configurable determinism 1, offers a potent toolset for creating intelligent Non-Player Characters (NPCs). RPGJS, a powerful engine built on Node.js and TypeScript, provides a flexible platform for developing RPGs and MMORPGs, complete with server-side logic capabilities and a rich event system.2Integrating advanced AI-powered NPCs into RPGs can transform static game worlds into vibrant, responsive environments. AI NPCs can exhibit nuanced personalities, engage in unscripted dialogues, react dynamically to player actions and evolving game states, and even pursue their own goals, thereby significantly enhancing player engagement and replayability. The backend-first, framework-agnostic nature of AgentDock Core 1 and RPGJS's robust Node.js server-side environment 2 present a compelling opportunity for such integration. Both systems operate within a JavaScript/TypeScript ecosystem, which can simplify the development of the necessary communication layer between the AI logic and the game engine.This report provides a conceptual deep dive into how developers can define AI-NPCs using AgentDock and subsequently host and integrate these characters into an RPGJS game. The primary focus will be on establishing communication through simple API calls and webhooks, ensuring that all development practices related to RPGJS are sourced exclusively from its official documentation and adhere to its established development rules. The user's emphasis on "simplicity" in communication aligns well with AgentDock's stated design philosophy of "Simplicity First: Minimal code required to create functional agents" 1, suggesting that the framework's architecture is conducive to the preferred integration methods.2. Understanding the Core ComponentsA successful integration hinges on a clear understanding of how each system functions, particularly concerning agent definition in AgentDock and NPC representation and interaction within RPGJS.2.1. AgentDock Deep Dive for AI-NPCsAgentDock provides a structured approach to defining and managing AI agents, primarily through declarative configuration files and a modular node-based architecture.Agent Definition with template.jsonThe cornerstone of an AgentDock agent's definition is the template.json file.4 This JSON file serves as a blueprint, declaratively outlining an agent's identity, core characteristics, and operational parameters. For an AI-NPC, this file would encapsulate its "digital DNA."
Personality: An NPC's persona, tone, backstory, and typical speech patterns are primarily shaped by the personality field within template.json. This field is an array of strings that collectively form the system prompt provided to the underlying Large Language Model (LLM), guiding its behavior and responses.4
Knowledge (Implicit): For the sake of simplicity, AgentDock does not necessitate a complex, explicit knowledge base upload for basic NPCs. Instead, an NPC's "knowledge" is implicitly formed by its personality prompt, the capabilities of its assigned nodes (e.g., a search tool for accessing external information, or a custom tool node that could be developed to query game-specific lore), and the contextual information provided during interactions.4 This approach allows for rapid prototyping, where an NPC's understanding can be refined by iterating on its prompt and the tools it can access.
Capabilities (Nodes): The nodes array within the template lists the functional units or tools available to the agent.4 These nodes represent the NPC's skills or abilities. Examples could include an LLM node (e.g., llm.anthropic) for dialogue generation and understanding, or built-in tools like search. AgentDock's extensibility allows for the creation of custom tool nodes 1, which could empower NPCs with game-specific actions such as "check player inventory for item X" or "query quest status."
Node Configurations (nodeConfigurations): This section allows for fine-tuning the parameters of each node listed in the nodes array. For LLM nodes, this includes specifying the model (e.g., claude-3-haiku-20240307), temperature (creativity of responses), maxTokens (length of responses), and other LLM-specific settings.4
The use of template.json as a declarative configuration for an NPC's core logic means that modifications to personality or capabilities can often be achieved by editing this JSON file. This potentially decouples AI persona design from extensive code changes within AgentDock or RPGJS, facilitating faster iteration cycles for NPC behavior.Key Node Types for NPC InteractionAgentDock's node-based architecture provides modular building blocks for agent functionality 1:
AgentNode: This is the central orchestrator for LLM interactions, tool usage, and overall agent logic.1 For an AI-NPC, the AgentNode acts as its "cognitive core," processing input and deciding how to respond or act.
Tool Nodes: These can be built-in or custom-developed nodes that provide specific skills or access to information.1 For NPCs, these could range from simple information retrieval (e.g., "what's the weather?") to complex game-specific actions (e.g., "determine faction reputation with player").
Event Nodes (e.g., Webhook Trigger): These nodes can initiate AgentDock workflows based on external events, such as an incoming webhook call.7 While more directly relevant for scenarios where RPGJS receives data from AgentDock asynchronously, they are part of AgentDock's webhook handling capabilities.
Action Nodes (e.g., API POST Request): These nodes empower AgentDock workflows to make outbound HTTP POST requests to external services.7 This is a critical component if AgentDock needs to send an asynchronous response or trigger an action in RPGJS by calling a webhook exposed by the RPGJS server.
Exposing AgentDock Agents for External InteractionOnce an AI-NPC is defined in AgentDock and the AgentDock service is running (either via the provided Open Source Client or a custom agentdock-core backend), it needs to be accessible to the RPGJS game server. AgentDock is designed to support this through HTTP APIs. The AgentDock Open Source Client itself includes API routes for agent communication.4 More generally, the documentation explicitly supports creating a backend service using Node.js and agentdock-core that exposes a RESTful HTTP API. External applications, such as an RPGJS game server, can then make standard HTTP requests to these AgentDock backend API endpoints to interact with the defined agents.4The table below summarizes key fields in AgentDock's template.json relevant for defining AI-NPCs:Table 1: AgentDock template.json Key Fields for AI-NPCs
Field NameDescription for NPC ContextExample Value (Conceptual)Relevant Source(s)agentIdUnique identifier for the AI-NPC."npc_town_guard_01"4nameDisplay name of the NPC, potentially used in logs or UI."Town Guard Theron"4descriptionA brief description of the NPC's role or purpose."A stern but fair guard at the main gate of Oakhaven."4personalityArray of strings defining the system prompt; shapes the NPC's behavior, speech style, and knowledge.``4nodesLists capabilities: LLM provider node, tool nodes (e.g., search, or custom game-specific tools).["llm.anthropic", "search", "custom.game_lore_tool"]4nodeConfigurationsSpecific parameters for each node, e.g., LLM model, temperature, or custom tool settings.{ "llm.anthropic": { "model": "claude-3-haiku-20240307", "temperature": 0.6 } }4
2.2. RPGJS Fundamentals for NPC Integration (Strictly from Official Documentation)On the RPGJS side, NPCs are integrated into the game world using its event system and server-side scripting capabilities. All practices described here are based exclusively on the official RPGJS documentation.Creating NPCs using RpgEvent and @EventDataIn RPGJS, dynamic game entities, including NPCs, are typically implemented as RpgEvents.8 The @EventData decorator is applied to an RpgEvent class to define its core properties:
name: A string identifier for the event type. This name is used when placing instances of this NPC on a map.8
mode: Specifies the event's behavior concerning multiple players. EventMode.Shared (default) means the event's state is synchronized for all players. EventMode.Scenario creates a unique instance of the event for each player, allowing for player-specific states and interactions.9 For an AI-NPC engaging in personalized dialogues, EventMode.Scenario might be more appropriate if its conversational state or reactions are unique to each player.
NPCs are visually placed on maps using the Tiled Map Editor. An object placed in Tiled is then linked to its corresponding RpgEvent class (e.g., AITownGuardEvent) within the map's server-side configuration file, specifying the event name defined in @EventData.8NPC Behavior: onInit, onAction, and Other Event HooksRPGJS RpgEvents have several lifecycle hooks that can be used to define NPC behavior:
onInit(): This method is invoked when the event (NPC) is first initialized and placed on the map. It is commonly used for setup tasks, such as setting the NPC's visual appearance using this.setGraphic('npc_sprite_sheet_id').8
onAction(player: RpgPlayer): This is a critical hook for interactive NPCs. It is triggered when a player character is in contact with the NPC (event) and the player presses the designated "Action" key (typically Space or Enter).8 This hook serves as the primary entry point for initiating dialogue or interaction with the AgentDock-powered AI. The player object passed to this method provides essential context about the interacting player.
Other hooks like onPlayerTouch(player: RpgPlayer) (triggered when a player physically collides with the event) or onChanges(player: RpgPlayer) (triggered when game variables change, allowing the NPC to react to broader game state modifications) can be used for more complex or ambient behaviors.9 However, for direct dialogue initiation, onAction is central.
The onAction hook in an RPGJS RpgEvent provides a natural and officially documented "trigger point" to initiate communication with an AgentDock AI-NPC. The player's explicit action to interact directly leads to AI engagement, and the context of the player object is readily available.Player Interaction & Capturing Input (Official RPGJS Methods)RPGJS provides server-side commands for managing player interactions, including displaying text and offering choices:
player.showText(text: string, options?: object): This asynchronous command displays a dialog box with the specified text to the player (e.g., showing dialogue received from AgentDock). It returns a Promise that resolves when the player closes the dialog box.10
player.showChoices(text: string, choices: Array<{ text: string, value: any }>, options?: object): This command presents the player with a dialog box containing text and a list of selectable choices. Each choice has a display text and an associated value. The method returns a Promise that resolves with an object containing the value of the choice selected by the player.10
A key consideration, particularly when aiming for simplicity and strict adherence to official RPGJS documentation, is the method for capturing player input for the AI. The official RPGJS documentation for server-side player commands 10 does not list a direct method like player.showInputDialog() for capturing free-form text input from the player within an RpgEvent's server-side logic. While RPGJS supports custom GUIs using VueJS 2, which could implement free-form input fields and emit data to the server, this introduces a level of complexity beyond simple API/webhook integration. Therefore, for a conceptually straightforward approach, player.showChoices() is the most direct documented method. The choices offered to the player can be crafted as specific prompts or intents (e.g., "Ask about the ancient ruins," "Offer to help the guard") that are then sent to the AgentDock AI. The AI can still generate rich, free-form responses based on these structured inputs.Server-Side Logic EnvironmentRPGJS's server-side game logic executes within a Node.js environment.2 This is crucial because it allows developers to:
Utilize standard Node.js built-in modules (such as http or https 14) or install and use third-party packages (like node-fetch for more modern Fetch API syntax 15, if desired, though not explicitly listed as an RPGJS dependency, it's a standard Node.js capability) for making outbound HTTP API calls to the AgentDock service.
RPGJS v4 leverages ViteJS and can integrate an Express.js server, often initialized via the expressServer function from @rpgjs/server/express.3 The RpgWorld module can be used in conjunction with an Express server, for example, to create custom API endpoints.16 This capability is essential for enabling the RPGJS server to receive incoming webhook calls from AgentDock.
The table below summarizes key RPGJS RpgEvent features for AI-NPC integration:Table 2: RPGJS RpgEvent Configuration for AI-NPCs
RPGJS FeatureDescription for AI-NPC ContextExample Usage (Conceptual Code)Relevant Source(s)@EventData({ name, mode })Decorator to define NPC type identifier and interaction mode (Shared/Scenario).@EventData({ name: 'MysticOracle', mode: EventMode.Scenario })8onInit(player?: RpgPlayer)Hook called when NPC is initialized. Used for setting initial graphic, properties. For Scenario mode, player can be an argument.onInit() { this.setGraphic('oracle_sprite'); }8async onAction(player: RpgPlayer)Hook called when player interacts (Action key). Main trigger for AI dialogue.async onAction(player: RpgPlayer) { const choice = await player.showChoices(...); /* Call AgentDock API */ }8await player.showText(...)Displays text (e.g., AI-NPC's response) to the player. Asynchronous.await player.showText(aiResponse.npcResponse);10await player.showChoices(...)Presents choices to the player. The selected choice's value can be sent to AgentDock as player input. Asynchronous.const choice = await player.showChoices('What do you ask?',); const playerInput = choice.value;10
3. Communication Architecture: AgentDock and RPGJSA robust communication layer is essential for the AI-NPC in AgentDock to interact with the player in RPGJS. This layer facilitates the exchange of data, such as player inputs and AI-generated responses. Two primary patterns, prioritizing simplicity, can be considered:Pattern 1: RPGJS Initiates Communication (Player-Driven Interaction via API Call to AgentDock)This is the most common pattern for typical NPC dialogue scenarios.
Flow:

The player interacts with an NPC in the RPGJS game (e.g., presses the Action key).
The RPGJS server's RpgEvent.onAction hook is triggered.
The RPGJS server constructs and sends an HTTP POST request to a designated AgentDock API endpoint. This request contains the player's message or intent, and potentially contextual information like playerId and conversation history.
The AgentDock AI agent processes the input, leveraging its defined personality and capabilities (nodes).
AgentDock returns an HTTP response directly to the RPGJS server. This response typically contains the NPC's dialogue and any other relevant data (e.g., suggested actions).
The RPGJS server receives the response and uses player.showText() to display the NPC's dialogue to the player.


Pros: This pattern provides a synchronous-like experience from the player's perspective for immediate dialogue responses. It is generally simpler to implement for basic request-response interactions.
Cons: If AgentDock takes a significant time to process the request, the player might experience a noticeable delay.
This approach aligns with the "pull" model of APIs, where the client (RPGJS) requests data when needed.17
Pattern 2: AgentDock Initiates Communication (AI-Driven Interaction or Asynchronous Responses via Webhook to RPGJS - Secondary/Advanced)This pattern allows for more proactive AI behavior or handling of long-running AI tasks.
Flow:

A trigger occurs within the AgentDock AI agent (e.g., a scheduled event in its internal logic, the completion of a lengthy task initiated by a previous player interaction, or a proactive decision by the AI).
An AgentDock Action Node (e.g., "API POST Request" node 7) makes an HTTP POST request (a webhook call) to a custom endpoint exposed by the RPGJS server.
The RPGJS server's custom webhook endpoint receives this request. The payload would typically include information identifying the target player and the nature of the AI's communication or action.
The RPGJS server processes the webhook payload, locates the target player (e.g., using RpgWorld.getPlayer() 16), and triggers an appropriate in-game event, such as displaying a message from the NPC or initiating an NPC action.


Pros: Enables asynchronous AI responses, allowing the AI to "think" or perform actions in the background without making the player wait. Facilitates AI-initiated events, where an NPC might proactively contact the player or react to game world changes independently.
Cons: More complex to set up, as it requires the RPGJS server to expose a secure and reliable webhook endpoint. Managing state to correlate the webhook to the correct player and context can also be challenging.
This approach aligns with the "push" model of webhooks, where the server (AgentDock) sends data when an event occurs.17
Guidance on Choosing the PatternFor the primary goal of implementing AI-NPC dialogue initiated by player interaction, Pattern 1 (RPGJS calls AgentDock API) is generally simpler, more direct, and recommended as the starting point. It fits the natural turn-based flow of conversations. Pattern 2 can be explored as an advanced extension for more sophisticated AI behaviors once the foundational request-response mechanism is in place. The choice of communication pattern significantly impacts the perceived responsiveness and the types of interactions an NPC can have. A direct API call is suited for immediate, turn-based dialogue, while webhooks enable more decoupled, asynchronous, and potentially proactive NPC behaviors.AgentDock's design supports both roles in these interactions: it acts as an API server when RPGJS calls its agent endpoints 4, and it can act as an API client when its Action Nodes call an RPGJS webhook endpoint.7 This inherent flexibility is advantageous for designing a wide range of NPC interaction models.The table below compares these communication flow options:Table 3: Communication Flow Options for AgentDock-RPGJS NPC InteractionPattern NameInitiatorReceiverMechanismTypical Use Case (NPC Dialogue)ProsConsSimplicity LevelRPGJS-Initiated API CallRPGJSAgentDockHTTP POST from RPGJS to AgentDock APIPlayer talks to NPC; expects immediate response.Simpler for request-response; synchronous-like player experience.Player waits for AI processing; potential for timeouts if AI is slow.SimplerAgentDock-Initiated WebhookAgentDockRPGJSHTTP POST from AgentDock Action Node to RPGJSNPC initiates contact; AI performs long task then responds; AI reacts to game events.Allows asynchronous AI actions/responses; AI can be proactive.More complex setup (RPGJS webhook endpoint, security, state correlation); not for immediate dialogue.More Complex4. Implementing the Communication Layer (Conceptual Steps & Examples)This section outlines the conceptual steps for implementing the communication between RPGJS and AgentDock, focusing primarily on Pattern 1 (RPGJS calling AgentDock API) for player-initiated dialogue.4.1. Defining and Calling the AgentDock AI-NPC Endpoint (RPGJS as Client)AgentDock Side (Conceptual Availability)AgentDock agents, defined via template.json, are made accessible through HTTP API endpoints. This can be achieved in a couple of ways:
Using AgentDock Open Source Client: If the AgentDock Open Source Client is deployed, it inherently provides API routes for interacting with the agents it manages.4 The specific path would typically involve the agent's ID.
Custom agentdock-core Backend: Alternatively, a custom Node.js backend service can be built using the agentdock-core library. This service would load the agent definitions and expose RESTful endpoints for interaction.4
A conceptual endpoint URL might look like: http://<agentdock_host>:<port>/api/agent/<agentId>/interact.Expected Request Format from RPGJS (to AgentDock)When RPGJS initiates contact with an AgentDock AI-NPC, it would typically send an HTTP POST request with the following characteristics:
Method: POST
Headers:

Content-Type: application/json
Authorization: Bearer <AGENTDOCK_API_KEY> (AgentDock employs a Bring Your Own Key (BYOK) model, and API keys can be provided via request headers for direct API usage 1).


Body (JSON): The payload should contain information necessary for the AI to process the interaction.
JSON{
  "playerId": "player_unique_id_from_rpgjs",
  "message": "Player's actual input or a string representing their dialogue choice value.",
  "conversationHistory": [
    { "role": "user", "content": "Previous player message" },
    { "role": "assistant", "content": "Previous NPC response" }
  ],
  "gameStateContext": { // Optional: Additional game state information
    "currentMap": "Oakhaven",
    "playerLevel": 5
  }
}

The playerId is crucial for session management and contextual responses. message carries the current player utterance. conversationHistory allows for coherent multi-turn dialogues. gameStateContext is optional but can enrich the AI's understanding.
AuthenticationAgentDock supports API key-based authentication. The RPGJS server must securely store this API key (e.g., in an environment variable 13) and include it in the Authorization header of its requests to AgentDock.1Expected Response Format from AgentDock (to RPGJS)Upon successful processing, AgentDock should return a JSON response:
Status Code: 200 OK
Body (JSON):
JSON{
  "npcResponse": "The AI-NPC's generated dialogue string.",
  "actions":,
  "updatedConversationHistory": [ /* Full updated history if managed this way */ ],
  "customData": { /* Any other relevant data NPC wants to pass back */ }
}

npcResponse contains the dialogue to be shown to the player. The actions array is a powerful conceptual addition, allowing the AI to influence game mechanics directly. updatedConversationHistory can be used if the conversation state is being passed back and forth. While specific response structures from AgentDock's direct API are not exhaustively detailed in the provided materials for custom integrations, a structured JSON output like the example from uAgents 20 ({"field": <value>} or a custom model) is a common and effective pattern.
4.2. RPGJS Server-Side Implementation (Adhering to Official RPGJS Documentation)The RPGJS server will handle sending requests to AgentDock and processing responses, primarily within an RpgEvent's onAction hook.Making API Calls to AgentDock from an RpgEvent's onAction HookInside the async onAction(player: RpgPlayer) method of your AI-NPC's event class (e.g., main/server/events/myAiNpc.ts):

Capture Player's Intent/Input: As discussed, for simplicity and adherence to official RPGJS documentation, player.showChoices() is the recommended method for gathering structured player input.
TypeScript// In main/server/events/myAiNpc.ts
import { RpgEvent, EventData, RpgPlayer, EventMode } from '@rpgjs/server';
// Assuming Node.js fetch is available or a polyfill/library is used.
// For older Node versions, 'node-fetch' might be imported or use built-in 'https'.

@EventData({ name: 'AI_NPC_Guard', mode: EventMode.Scenario })
export class AiNpcGuardEvent extends RpgEvent {
    onInit() {
        this.setGraphic('guard_sprite');
    }

    async onAction(player: RpgPlayer) {
        const choice = await player.showChoices('The guard looks at you expectantly.', [
            { text: 'Ask about recent rumors.', value: 'Heard any interesting rumors lately?' },
            { text: 'Inquire about the northern pass.', value: 'Is the northern pass safe to travel?' },
            { text: 'Offer a greeting.', value: 'Good day, guard.' }
        ]);

        if (choice && choice.value) {
            const playerMessage = choice.value;
            const agentDockApiKey = process.env.AGENTDOCK_API_KEY; // Store securely
            const agentDockUrl = process.env.AGENTDOCK_NPC_ENDPOINT; // e.g., http://localhost:3001/api/agent/npc_town_guard_01/interact

            if (!agentDockApiKey ||!agentDockUrl) {
                console.error('AgentDock API key or URL not configured.');
                await player.showText('My apologies, I seem to be at a loss for words right now.');
                return;
            }

            // Conceptual: Retrieve or initialize conversation history for this player with this NPC
            let conversationHistory = player.getVariable(`CONVO_HISTORY_GUARD_${this.id}`) ||;

            const requestPayload = {
                playerId: player.id,
                message: playerMessage,
                conversationHistory: conversationHistory
            };

            try {
                const response = await fetch(agentDockUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${agentDockApiKey}`
                    },
                    body: JSON.stringify(requestPayload)
                });

                if (!response.ok) {
                    console.error(`AgentDock API error: ${response.status} ${response.statusText}`);
                    const errorBody = await response.text();
                    console.error(`Error details: ${errorBody}`);
                    await player.showText('I... am not sure how to respond to that.');
                    return;
                }

                const aiResponseData = await response.json();

                // Display NPC dialogue
                if (aiResponseData.npcResponse) {
                    await player.showText(aiResponseData.npcResponse);
                }

                // Conceptual: Update conversation history
                if (aiResponseData.updatedConversationHistory) {
                    player.setVariable(`CONVO_HISTORY_GUARD_${this.id}`, aiResponseData.updatedConversationHistory);
                } else {
                    // Simple history update if not fully managed by AgentDock
                    conversationHistory.push({ role: "user", content: playerMessage });
                    if (aiResponseData.npcResponse) {
                        conversationHistory.push({ role: "assistant", content: aiResponseData.npcResponse });
                    }
                    player.setVariable(`CONVO_HISTORY_GUARD_${this.id}`, conversationHistory);
                }

                // Conceptual: Process any actions suggested by the AI
                if (aiResponseData.actions && Array.isArray(aiResponseData.actions)) {
                    for (const action of aiResponseData.actions) {
                        // Example: if (action.type === 'SET_QUEST_STAGE') {
                        // player.setVariable(`QUEST_${action.questId}_STAGE`, action.stage);
                        // await player.showNotification(`Quest '${action.questId}' updated!`);
                        // }
                    }
                }

            } catch (error) {
                console.error('Failed to communicate with AgentDock:', error);
                await player.showText('My mind feels a bit clouded at the moment. Try again later.');
            }
        }
    }
}

This example uses fetch, which is standard in modern Node.js environments.15 RPGJS server scripts run in Node.js, so they can leverage its built-in capabilities.14


Construct JSON Payload: Create the JSON object as defined in section 4.1, including player.id, the chosen playerMessage, and any conversation history or context.


Make the HTTP Request: Use Node.js's fetch API (or the https module for older Node.js versions without native fetch or if preferred). Ensure to set the correct method, headers (including Content-Type and Authorization), and body.


Handle Asynchronous Response: await the response from fetch. Check response.ok and parse the JSON body using await response.json().


Display NPC Dialogue: Use await player.showText(aiResponseData.npcResponse) to show the AI's dialogue to the player.10


Error Handling: Wrap the API call in a try...catch block to manage network errors or issues with the AgentDock service. Provide a fallback message to the player (e.g., "The NPC seems lost in thought.").

The use of standard Node.js HTTP request mechanisms 14 means that RPGJS does not require proprietary methods for this type of external communication, simplifying integration with any compliant HTTP API.4.3. (Optional/Advanced) RPGJS Receiving Webhooks from AgentDockFor AgentDock to initiate communication (Pattern 2), RPGJS needs to expose an HTTP endpoint to receive webhook calls.AgentDock Side (Action Node)An AgentDock workflow can employ an "API POST Request" Action Node 7 configured to send an HTTP POST request to a specific URL on the RPGJS server. The payload sent by AgentDock would be a custom JSON structure, for example:JSON{
  "secretKey": "your_shared_secret_for_webhook_auth", // For basic auth
  "targetPlayerId": "player_unique_id_to_receive_message",
  "eventType": "NPC_PROACTIVE_DIALOGUE",
  "data": {
    "npcId": "npc_town_guard_01", // Identifier of the NPC "speaking"
    "message": "Guard Theron approaches you: 'Remember that task I mentioned earlier? I have new information.'"
  }
}
RPGJS Side (Exposing a Webhook Endpoint)RPGJS v4 utilizes expressServer from @rpgjs/server/express, which provides an Express.js application instance.3 This instance can be used to define custom routes for webhook handling. This capability is fundamental, as without it, AgentDock-initiated communication via simple webhooks would not be feasible.Modify your main server file (e.g., src_rpgjs/server.ts or as per your project's structure, considering Module vs. Autoload API preferences 21) to add a custom Express route:TypeScript// In src_rpgjs/server.ts (conceptual example)
import { expressServer, RpgWorld } from '@rpgjs/server';
import modules from './modules'; // Your game modules
import globalConfig from './config/server';
import express from 'express'; // Make sure express is a dependency or use the one from rpgjs if exposed

async function startServer() {
    const { app, server, game } = await expressServer(modules, {
        globalConfig,
        basePath: __dirname,
        envs: import.meta.env
    });

    // Middleware to parse JSON request bodies
    app.use(express.json());

    // Define the webhook endpoint
    app.post('/webhook/agentdock-npc', (req, res) => {
        const payload = req.body;
        const RPGJS_WEBHOOK_SECRET = process.env.RPGJS_WEBHOOK_SECRET;

        // Basic security: check for a shared secret
        if (RPGJS_WEBHOOK_SECRET && payload.secretKey!== RPGJS_WEBHOOK_SECRET) {
            console.warn('Invalid secret key for AgentDock webhook.');
            return res.status(403).send('Forbidden: Invalid secret.');
        }

        console.log('Received webhook from AgentDock:', JSON.stringify(payload));

        if (payload.targetPlayerId && payload.eventType === 'NPC_PROACTIVE_DIALOGUE' && payload.data && payload.data.message) {
            const targetPlayer = RpgWorld.getPlayer(payload.targetPlayerId); // [16]

            if (targetPlayer) {
                // Option 1: Directly try to show text (might only work if player is in an interactive state)
                // targetPlayer.showText(payload.data.message, { /* options */ }); // [10]

                // Option 2 (More robust): Emit a custom event to the player's client,
                // which then triggers a GUI element or notification.
                // This avoids issues if player.showText cannot be called directly in this context.
                targetPlayer.emit('agentdock_npc_message', { npcId: payload.data.npcId, message: payload.data.message });
                console.log(`Emitted 'agentdock_npc_message' to player ${payload.targetPlayerId}`);
            } else {
                console.warn(`Webhook targetPlayerId ${payload.targetPlayerId} not found.`);
            }
        }
        res.status(200).send({ status: 'Webhook received successfully' });
    });

    // The server is already started by expressServer, this just shows where to add routes.
}

startServer();
In this setup:
An Express route /webhook/agentdock-npc is created to listen for POST requests.
express.json() middleware is used to parse incoming JSON payloads.
A basic security check using a shared secret (stored as an environment variable) is included. AgentDock's webhook sending configuration would need to include this secret. AgentDock's platform integration roadmap mentions "Robust webhook implementation" 22, suggesting that secure webhook practices are a design consideration.
RpgWorld.getPlayer(payload.targetPlayerId) 16 is used to retrieve the RpgPlayer instance to whom the message is directed.
The message is then delivered. Directly calling player.showText() might be context-dependent; a more robust method for asynchronous messages could be to player.emit() a custom event to the client, which then handles displaying the message through a dedicated UI element (e.g., a notification or a message log).
The endpoint responds with a 200 OK to acknowledge receipt.
General Express.js routing principles apply here.23The table below illustrates conceptual data structures for these API/webhook interactions:Table 4: Illustrative Webhook/API Request-Response Data Structures
Communication StepSystem SendingSystem ReceivingHTTP MethodKey HeadersExample JSON Payload (Conceptual)Relevant Source(s)Player Input to AgentDockRPGJSAgentDockPOSTContent-Type: application/json, Authorization: Bearer <key>{ "playerId": "p123", "message": "About the quest?", "conversationHistory": }1AI Response from AgentDock (Direct)AgentDockRPGJS200 OKContent-Type: application/json{ "npcResponse": "The quest involves finding a lost amulet.", "actions":, "updatedConversationHistory": [...] }20 (concept)(Optional) AgentDock Webhook to RPGJSAgentDockRPGJSPOSTContent-Type: application/json{ "secretKey": "...", "targetPlayerId": "p123", "eventType": "NPC_MESSAGE", "data": { "message": "I have news!" } }3(Optional) RPGJS Webhook AckRPGJSAgentDock200 OKContent-Type: application/json{ "status": "received" }
5. Data Flow and State Management ConsiderationsEffective communication requires careful management of data flow, particularly player context and conversation history.Passing Player ContextWhen the RPGJS server calls an AgentDock AI-NPC, it is crucial to include a unique playerId in the request payload. This allows AgentDock, if designed to do so through its internal session management or custom orchestration logic within the agent's definition, to maintain context and tailor responses specifically for that player. AgentDock does mention "Session Management" as an advanced capability, designed for managing state isolation for concurrent conversations.1 Additional game-specific context, such as the player's current location (player.getCurrentMap().id), level, or active quest status, can also be passed in the request payload to AgentDock. The AI-NPC's template.json and associated tool nodes would then need to be designed to utilize this contextual information to provide more relevant and dynamic responses.Conversation HistoryFor coherent, multi-turn dialogues, the history of the conversation between the player and the AI-NPC must be maintained and accessible. There are primarily two approaches:
RPGJS Manages and Sends History: The RPGJS server stores the conversation history for each player-NPC interaction (e.g., using player.setVariable() 8 to store an array of dialogue turns, keyed by playerId and npcId). With each new message from the player, RPGJS sends the relevant portion of this history along with the new message to AgentDock. AgentDock then uses this history to generate its response and may return the updated full history. This approach makes the AgentDock interaction potentially stateless from the API endpoint's perspective for that specific call, simplifying AgentDock's session handling for external API users but increasing the size of request/response payloads. It gives RPGJS explicit control over the conversation state.
AgentDock Manages History Internally: AgentDock's template.json includes chatSettings like historyPolicy (e.g., "lastN") 4, and its Open Source Client features chat and session management.1 If AgentDock's API for direct interaction can leverage this internal session management based on a session identifier (perhaps derived from the playerId sent by RPGJS), then RPGJS might not need to pass the full history each time. This would require a clear understanding of AgentDock's API for session initialization and continuation for external callers.
For simplicity and explicit control, especially in initial integrations, having RPGJS manage and pass the conversation history (Option 1) is often more straightforward.Managing NPC State (Beyond Dialogue)If an AI-NPC needs to remember specific facts or states resulting from its interactions with a player (e.g., promises made, tasks assigned, changes in disposition towards the player), this state can be managed:
Primarily in RPGJS: The RPGJS server can store this NPC-related, player-specific state using player.setVariable('npc_memory_key', value) and player.getVariable('npc_memory_key').8
Influenced by AgentDock: The AgentDock AI can suggest state changes through its API response. For instance, the actions array in the response payload (see section 4.1) could instruct RPGJS to set a specific player variable (e.g., { "type": "SET_PLAYER_VARIABLE", "key": "npc_theron_trust", "value": "increased" }). The RPGJS server would then parse this action and execute player.setVariable('npc_theron_trust', 'increased').
This allows the AI's decisions and dialogue to have persistent, tangible effects within the RPGJS game world, using RPGJS's native state management mechanisms. This creates a feedback loop where AI interactions influence game state, which can then be fed back to the AI in subsequent interactions for richer context.6. Best Practices and Adherence to RPGJS RulesImplementing a robust and maintainable integration requires adherence to best practices, particularly concerning RPGJS development rules, error handling, and security.RPGJS ExclusivityA core principle for this integration is that all RPGJS-side code—including event creation, player commands, server setup, and any client-side modifications—must strictly use the APIs, patterns, and methodologies documented in the official RPGJS documentation (found at docs.rpgjs.dev). Introducing external libraries or unconventional patterns for core RPGJS functionalities should be avoided unless explicitly sanctioned or demonstrated within the official documentation. This ensures compatibility, maintainability, and leverages the framework as intended.API Call Error Handling (RPGJS Side)Network requests are inherently fallible. When the RPGJS server calls the AgentDock API:
All API call logic should be enclosed in try...catch blocks to handle exceptions gracefully.
Specific error conditions, such as network failures, timeouts, or non-200 HTTP status codes from AgentDock, should be anticipated.
Instead of allowing an error to crash the event script or freeze the player's interaction, the NPC should provide a fallback response (e.g., await player.showText("I seem to be having trouble collecting my thoughts right now. Please try again in a moment.")).
Detailed errors should be logged on the RPGJS server for debugging purposes, without exposing sensitive information to the player.
Webhook Processing Reliability (RPGJS Side - for Pattern 2)If RPGJS is configured to receive webhooks from AgentDock:
The webhook endpoint should respond quickly to AgentDock with a 200 OK status to acknowledge receipt of the webhook. Lengthy processing should be done asynchronously after sending the acknowledgment to prevent timeouts on AgentDock's side.
Consider potential duplicate webhook deliveries (if AgentDock implements retries on failure). For critical operations, implementing idempotency (e.g., by checking a unique ID in the webhook payload against recently processed IDs) is an advanced but valuable practice.
The endpoint should validate incoming webhook payloads (e.g., ensure required fields like targetPlayerId are present and valid) before processing.
Security ConsiderationsSecurity is a shared responsibility between the two systems and the developer implementing the integration.
AgentDock API Keys: The API key used by RPGJS to authenticate with AgentDock must be treated as a sensitive secret. It should be stored securely on the RPGJS server, typically using environment variables 13, and never exposed in client-side code or insecurely logged.
RPGJS Webhook Endpoints:

If AgentDock supports sending a signature or a shared secret with its webhook calls (AgentDock's roadmap mentions "Robust webhook implementation" 22, which implies security considerations; general webhook security practices also advocate for this 25), the RPGJS endpoint should verify this signature or secret to ensure the request legitimately originated from AgentDock.
If signature verification is not available, use obscure, hard-to-guess URLs for the webhook endpoint.
Consider IP whitelisting if AgentDock's outgoing IP addresses are static and known, although this can be brittle.
The endpoint must be robust against malformed or malicious payloads, performing validation and sanitization as needed.


Asynchronous NatureAll input/output operations within RPGJS event hooks, such as player.showText(), player.showChoices() 10, and any HTTP API calls to AgentDock, are asynchronous. These operations return Promises and must be handled correctly using async/await to prevent blocking the RPGJS server's event loop and to ensure that subsequent code executes only after the asynchronous operation completes.Proper error handling and fallback mechanisms are essential for maintaining a positive player experience. If the AI service becomes temporarily unavailable or returns an error, the NPC should degrade gracefully, perhaps offering a generic response, rather than causing the game interaction to fail or the NPC to become unresponsive. This ensures that the core game remains playable even if the advanced AI features encounter issues.7. ConclusionThe conceptual framework outlined in this report demonstrates a viable path for integrating AI-NPCs, powered by AgentDock, into RPGJS games. This integration leverages AgentDock's template.json for defining AI agent personalities and capabilities, and RPGJS's RpgEvent system for representing NPCs within the game world. Communication between the two systems is primarily achieved through API calls initiated by RPGJS to AgentDock for player-driven dialogues, with the optional use of webhooks from AgentDock to RPGJS for AI-initiated actions or asynchronous responses. The Node.js foundation of both platforms and AgentDock's API-first design principles facilitate this communication.By adhering strictly to RPGJS official documentation for all game-side implementation and by following best practices for API security and error handling, developers can create NPCs that offer significantly more dynamic, intelligent, and engaging interactions than traditional scripted characters. The potential to imbue game worlds with characters that can understand context, carry on nuanced conversations, and react intelligently to player choices opens up new avenues for storytelling and emergent gameplay.The approach detailed here, focusing on simplicity via direct API calls and optional webhooks, serves as a solid foundation. As developers become more comfortable with the integration, they can iteratively enhance its complexity. This might involve developing more sophisticated custom tool nodes in AgentDock, passing richer contextual information from RPGJS, designing more intricate RPGJS event logic to handle diverse AI responses, or even implementing custom GUIs in RPGJS for more natural player input methods. The initial integration, however, acts as a launchpad, enabling a progressive enhancement of NPC intelligence and interactivity, ultimately enriching the player's journey through the RPG world.This integration strategy underscores a shift towards more intelligent and adaptive game environments. The combination of a flexible AI agent framework like AgentDock and a capable game engine like RPGJS empowers developers to explore the next generation of interactive entertainment.