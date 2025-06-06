---
description: A step-by-step guide to create and integrate a new AI-powered agent/NPC into the RPGJS game using AgentDock.
---

This workflow helps you add new AI agents to your RPGJS game, from backend setup in AgentDock to in-game integration.

**Prerequisite:** Have a "Character Role Card" filled out with the new agent's details.

## Part 1: Backend AI Agent Setup (AgentDock)

1.  **Define Your Agent Details:**
    *   Ensure your "Character Role Card" is complete with all necessary information like `Agent ID (for AgentDock)`, `Personality/Role Description`, `Tools Required`, etc.

2.  **Create Agent `template.json` in AgentDock:**
    *   AgentDock agents are defined by `template.json` files located in the `Agent-artel-Dock/agents/` directory. Each subdirectory within `agents/` typically represents a unique agent.
    *   Navigate to `/Users/satorisan/Desktop/RPGJS_TEST/Agent-artel-Dock/agents/`.
    *   Create a new directory for your agent if it doesn't exist (e.g., `rpgjs-new-agent-name`).
    *   Inside this directory, create a `template.json` file.
    *   **Structure of `template.json`:**
        *   The `template.json` file should include:
            *   `version`: (e.g., "1.0")
            *   `agentId`: The unique identifier for this agent (e.g., "rpgjs-new-agent-name"). This **MUST** match the directory name.
            *   `name`: A human-readable name for the agent (e.g., "New Agent Name").
            *   `description`: A brief description of the agent.
            *   `personality`: A detailed prompt defining the agent's persona, role, how it should behave, and instructions on when/how to use tools.
            *   `tools`: An array defining functions the LLM can call (if any).
            *   `nodes`: An array listing the backend service nodes required by the agent (e.g., "llm.openai", "generate_image").
            *   `nodeConfigurations`: An object providing configurations for each node listed in `nodes`.
        *   Refer to existing `template.json` files like `/Users/satorisan/Desktop/RPGJS_TEST/Agent-artel-Dock/agents/rpgjs-pixel-alchemist-phin/template.json` or `/Users/satorisan/Desktop/RPGJS_TEST/Agent-artel-Dock/agents/rpgjs-seraphina-star-weaver/template.json` for complete structural examples.

3.  **(Optional) Configure Agent Tools in `template.json`:**
    *   If your agent needs tools (e.g., image generation, database lookups):
        *   **Define in `tools` array:**
            *   Specify the tool's `type` (usually "function").
            *   Under `function`, define `name` (this is the **alias the LLM will use**), `description` (crucial for the LLM to know when to use it), and `parameters` (input schema for the tool).
            *   Example for an image generation tool alias:
                ```json
                "tools": [
                  {
                    "type": "function",
                    "function": {
                      "name": "generate_celestial_tapestry", // LLM-facing alias
                      "description": "Generates an image of a celestial tapestry or other cosmic phenomena based on a detailed prompt. Use this when the player asks to see a visual representation of such concepts.",
                      "parameters": {
                        "type": "object",
                        "properties": {
                          "prompt": {
                            "type": "string",
                            "description": "A detailed textual description of the celestial image to generate."
                          }
                        },
                        "required": ["prompt"]
                      }
                    }
                  }
                ]
                ```
        *   **Declare in `nodes` array:**
            *   List the actual backend service identifier for the tool (e.g., `"generate_image"` if that's the service name in AgentDock).
            *   Also include your LLM node (e.g., `"llm.openai"`).
                ```json
                "nodes": [
                  "llm.openai",
                  "generate_image" // Actual backend service name
                ]
                ```
        *   **Configure in `nodeConfigurations`:**
            *   Provide any necessary configuration for the backend service node. For tools like image generation, this might involve specifying which API key environment variable the service should use.
                ```json
                "nodeConfigurations": {
                  "llm.openai": { /* ...LLM config... */ },
                  "generate_image": { // Actual backend service name
                    "apiKeyEnv": "STABILITY_API_KEY" // Example
                  }
                }
                ```
        *   **CRITICAL DISTINCTION:** The `name` used in the `tools[].function.name` (e.g., "generate_celestial_tapestry") is an **alias for the LLM**. The actual backend service that performs the action is identified in the `nodes` array (e.g., "generate_image") and configured in `nodeConfigurations` using that same identifier. Ensure these are correctly mapped.
        *   **Personality Prompt:** Your agent's `personality` in `template.json` **MUST** instruct the LLM on when and how to use the defined tool aliases.

4.  **Bundle Agent Templates:**
    *   After creating or modifying any `template.json` files in the `Agent-artel-Dock/agents/` subdirectories:
    *   Navigate to the root of your AgentDock project: `cd /Users/satorisan/Desktop/RPGJS_TEST/Agent-artel-Dock/`
    *   Run the template bundling script:
        ```bash
        npm run prebuild
        ```
    *   This script typically generates a `_templates.json` file that AgentDock uses to load all agent configurations.

5.  **Restart AgentDock Server:**
    *   After bundling templates or changing any AgentDock-related `.env` files (e.g., adding API keys):
    *   Stop and restart your AgentDock Next.js server to ensure all changes are loaded. If it's running via `npm run dev`, stop it (Ctrl+C) and run `npm run dev` again.
                ```
        *   **Important:** Ensure the agent's `Personality/Role Description` in the Character Role Card and `template.json` instructs the LLM *when* and *how* to consider using this tool. For example: "If the user asks to see their aura or any visual concept you discuss, you can offer to generate a visual representation of it using the `generate_image_of_aura` tool by providing a detailed prompt."

## Part 2: RPGJS Game Integration (ARTELIO Project)

3.  **Configure Agent in RPGJS `config.ts`:**
    *   Open the file: `/Users/satorisan/Desktop/RPGJS_TEST/ARTELIO/main/utils/config.ts`.
    *   Navigate to the `agentDock` section, specifically the `agents` object.
    *   Add a new key-value pair for your new agent. The key is a short, descriptive identifier you'll use in the event file (e.g., `sarcasticMerchant`), and the value is the exact `agentId` you defined in the agent's `template.json` file in Part 1 (e.g., `'rpgjs-sarcastic-merchant'`).
        ```typescript
        // Example in /Users/satorisan/Desktop/RPGJS_TEST/ARTELIO/main/utils/config.ts
        // within agentDock.agents:
        sarcasticMerchant: 'rpgjs-sarcastic-merchant', // Add this line
        ```

4.  **Create NPC Event File:**
    *   The easiest way is to duplicate an existing AI NPC event file. Good candidates are:
        *   `/Users/satorisan/Desktop/RPGJS_TEST/ARTELIO/main/events/AuraWeaverElaraEvent.ts`
        *   `/Users/satorisan/Desktop/RPGJS_TEST/ARTELIO/main/events/SeraphinaStarWeaverEvent.ts`
        *   These examples already handle streamed responses and tool calls.
    *   Rename the duplicated file within `/Users/satorisan/Desktop/RPGJS_TEST/ARTELIO/main/events/` (e.g., `SarcasticMerchantEvent.ts`).
    *   **Modify the new event file:**
        *   **`@EventData` Decorator:** Update `name` to match the `NPC Event Name (for TMX & EventData)` from your role card (e.g., `'sarcastic-merchant-event'`). This name is used in the TMX map file.
        *   **`onInit()` Method:** Update `this.setGraphic('...')` and `this.setComponentsTop(Components.text('...'))` based on your role card.
        *   **`onAction()` Method:**
            *   Update `HISTORY_VAR` to a unique constant for this NPC (e.g., `const HISTORY_VAR = 'SARCASTIC_MERCHANT_HISTORY';`).
            *   Customize the initial greeting message.
            *   If using `player.showChoices`, update choices.
            *   **Crucially**, update the `config.getAgentDockChatUrl('...')` call to use the new agent key you defined in `config.ts` (e.g., `config.getAgentDockChatUrl('sarcasticMerchant')`).
            *   **Streamed Responses:** Ensure your event file correctly handles streamed responses from AgentDock. This typically involves accumulating data chunks. Refer to the parsing logic in `AuraWeaverElaraEvent.ts` or `SeraphinaStarWeaverEvent.ts` for examples of handling Vercel AI SDK-style streaming responses (including those with `0:` prefixes).
        *   Review and adjust any other logic (e.g., emotion bubbles, specific responses) to fit the new agent's personality.
        *   **Handling Agent Tool Usage (e.g., Image Generation):**
            *   If your agent uses tools, AgentDock will typically include a `tool_calls` array in the streamed JSON response. Your event file's response parsing logic (like in `SeraphinaStarWeaverEvent.ts`) needs to detect this.
            *   **Example `tool_calls` structure from AgentDock (similar to OpenAI):**
                ```json
                {
                  "tool_calls": [
                    {
                      "id": "call_abc123",
                      "type": "function",
                      "function": {
                        "name": "generate_celestial_tapestry", // LLM's alias for the tool
                        "arguments": "{\"prompt\": \"A vibrant cosmic cloud.\"}" // JSON string
                      }
                    }
                  ]
                }
                ```
            *   **Executing the Tool (Server-Side in RPGJS Event):**
                1.  Parse `tool_call.function.arguments` (often a JSON string itself) to get parameters (e.g., `prompt`).
                2.  Tool execution (especially those involving API keys like image generation) **MUST** occur server-side within your RPGJS event file. **Never expose API keys to the client.**
                3.  Make an API call from your event script to the actual service (e.g., Stability AI). API keys for these services **MUST** be stored in `/Users/satorisan/Desktop/RPGJS_TEST/ARTELIO/.env` and accessed via your `config.ts` utility (e.g., `config.apiKeys.stabilityAi`). Refer to `setup-environment-variables.md`.
                4.  Handle the response from the service (e.g., get an image URL).
            *   **Displaying Tool Output to Player:**
                *   For images: Use `await player.showImage(imageUrl, { talkWith: this });` or for custom UI, `player.gui('your-custom-gui-name').open({ imageUrl: imageUrl });`. Refer to `creategui.md` and examples like `PixelAlchemistPhinEvent.ts` (uses `rpg-artwork-viewer`).
            *   **Sending Tool Result Back to AgentDock:** This is vital for conversational context.
                *   Construct a "tool" role message including `tool_call_id` (from AI's request), `name` (must match `tool_call.function.name`), and `content` (your tool's output, often a JSON string).
                    ```typescript
                    const toolResponseMessage = {
                      role: 'tool',
                      tool_call_id: toolCall.id,
                      name: toolCall.function.name, // e.g., "generate_celestial_tapestry"
                      content: JSON.stringify({ imageUrl: "...", status: "success" })
                    };
                    conversationHistory.push(toolResponseMessage);
                    // Then make another call to AgentDock with the updated conversationHistory.
                    ```
            *   **Error Handling:** Implement robust error handling for parsing, external API calls, and sending results back. Inform the player gracefully.
            *   **Conceptual Snippet Update (RPGJS Event File - `onAction`):**
                ```typescript
                // ... inside tool call handling ...
                const imageServiceResponse = await fetch('YOUR_IMAGE_GENERATION_API_ENDPOINT', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        // Use API key from config.ts, sourced from .env
                        'Authorization': `Bearer ${config.apiKeys.stabilityAi}` // Example
                    },
                    body: JSON.stringify({ prompt: imagePrompt })
                });
                // ... rest of the snippet ...
                ```

5.  **Add NPC to the Map (`.tmx` file):**
    *   Open your map file (e.g., `/Users/satorisan/Desktop/RPGJS_TEST/ARTELIO/main/worlds/maps/simplemap2.tmx`) in Tiled Map Editor.
    *   Select an object layer.
    *   Add a new Point object.
    *   Properties:
        *   `Name`: Must exactly match the `name` in `@EventData` (e.g., `sarcastic-merchant-event`).
        *   Ensure a unique `ID`.
    *   Position and save.

6.  **Testing Your Integrated AI NPC:**
    *   **Servers:**
        *   Verify AgentDock server (from `Agent-artel-Dock` project) is running. Check its console for confirmation that your new agent (from `template.json`) loaded correctly after `npm run prebuild` and server restart.
        *   // turbo
            Restart and verify your RPGJS game server (from `ARTELIO` project) is running: `npm run dev`.
    *   **In-Game Verification:**
        *   Launch the game in your browser.
        *   Navigate to the map and location of your new NPC.
        *   Interact: Check appearance, initial greeting, and dialogue flow.
    *   **Tool Usage Test (if applicable):**
        *   Through dialogue, prompt the NPC to use its tool.
        *   Monitor AgentDock console: Look for the incoming request, the LLM's decision to use a tool, and the `tool_calls` structure being sent back to RPGJS.
        *   Monitor RPGJS server console (ARTELIO project): Observe logs for: 
            *   Receiving the `tool_calls` from AgentDock.
            *   Parsing the arguments.
            *   Making the call to the external service (e.g., image generation API), including request and response status.
            *   Sending the tool result message back to AgentDock.
        *   In-Game: Verify the tool's output is displayed (e.g., image appears).
        *   Conversation Flow: Confirm the AI NPC acknowledges or uses the tool's result in its subsequent dialogue.
    *   **Error Checks:** Review all server consoles (AgentDock, RPGJS) and the browser console for any errors throughout the interaction.

By following these steps, you can systematically add and test new AI-powered characters in your game world.
