---
description: How to integrate a functional AgentDock agent as an interactive NPC in the ARTELIO RPGJS project.
---

Objective: To take a fully functional and tested AgentDock agent and correctly integrate it as an interactive NPC in the ARTELIO RPGJS project.

Prerequisite: A working `agentId` from Workflow 1 (`/create_agentdock_agent`).

Step 1: Update RPGJS Configuration

This step was previously forgotten and is critical.
You MUST open `ARTELIO/main/utils/config.ts` and add a new entry to the `agentDock.agents` object.
Example: `portraitPainter: 'rpgjs-portrait-painter'`.

Step 2: Create NPC Event File

Create a new event file in `ARTELIO/main/events/` (e.g., `PortraitPainterEvent.ts`). Use an existing AI NPC event file like `PixelAlchemistPhinEvent.ts` as a template to ensure all necessary logic is included.

*   **`onInit()`**: Set the NPC's graphic and display name.
*   **`onAction()`**:
    *   The interaction logic MUST use a `fetch` call to the AgentDock API endpoint, which is retrieved using the helper function: `config.getAgentDockChatUrl('portraitPainter')` (replace `'portraitPainter'` with the key you defined in `config.ts`).
    *   DO NOT invent or use non-existent functions like `player.callPluginHook()`. The working pattern is a direct `fetch` call.
*   **Response Handling**:
    *   The logic MUST correctly parse the streamed response from AgentDock. The successful pattern involves a `try/catch` block that first attempts a standard `JSON.parse()` and, on failure, falls back to parsing Vercel AI SDK-style stream lines (lines starting with `0:`).
*   **Tool Output Handling**: The RPGJS event does NOT call tool endpoints directly. Its only job is to handle the final output from the AI agent.
    *   For images, the logic MUST use a regular expression to extract the image URL from the Markdown link `[text](URL)` in the AI's response.
    *   The image MUST be displayed using the established GUI pattern: `player.gui('rpg-artwork-viewer').open({ imageUrl: ..., ... })`.

Step 3: Add NPC to Map

Edit the target `.tmx` map file.
Add a new `<object>` with a unique `id`. Its `name` attribute MUST exactly match the `name` defined in the `@EventData` decorator of the NPC's event file.

Step 4: Run Both Servers & Test In-Game

Ensure both the Agent-artel-Dock and ARTELIO development servers are running.
Interact with the NPC in the game and verify all functionality: dialogue, tool usage (image display), and any other custom logic.
