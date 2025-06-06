---
description: How to reliably define, configure, and test a new AI agent within the Agent-artel-Dock project.
---

Objective: To reliably define, configure, and test a new AI agent within the Agent-artel-Dock project, ensuring it is fully functional before any game integration begins.

Step 1: Draft the Character Role Card

Use the `character_role_card_template.md` to define the agent's core concept, personality, and required capabilities (including any tools).
This document is the "source of truth" for all subsequent steps.

Step 2: Create Agent Directory & `template.json`

Create a directory in `Agent-artel-Dock/agents/` named after the `agentId` (e.g., `rpgjs-portrait-painter`).
Inside, create `template.json`. This file MUST be structured precisely:

*   **Basic Info**: `agentId`, `name`, `description`.
*   **Personality Prompt**: The `personality` array MUST contain clear, explicit instructions for the LLM on its role, speaking style, and critically, how to handle tool outputs.
    *   For image generation, the prompt must instruct the AI to embed the URL it receives from the tool's output into a Markdown link in its response (e.g., `Here is the portrait: [View Art](URL_FROM_TOOL)`). This was the key to fixing Phin and Seraphina.
*   **Tool Definition (`tools` array)**: If the agent uses a unique capability, define it here. The `function.name` (e.g., `generate_celestial_tapestry`) is the "alias" the LLM will use in its reasoning.
*   **Node Wiring (`nodes` array)**: This array tells AgentDock which backend services to enable. It MUST list the actual, registered node identifier for each capability (e.g., `"llm.openai"`, `"generate_image"`).
*   **Node Configuration (`nodeConfigurations`)**: An entry MUST exist for every item in the `nodes` array. For the `generate_image` tool, this can be an empty object `{}`.

Step 3: Bundle Agent Templates

From the root of the `Agent-artel-Dock` project, you MUST run the template bundling script.
Based on `package.json`, the correct command is: `npm run prebuild`.

Step 4: Restart AgentDock Server

You MUST stop and restart the AgentDock development server (e.g., `pnpm run dev`) for the new agent and any `.env.local` changes to be loaded.

Step 5: Verification Test

Before proceeding to RPGJS, you MUST test the agent's functionality directly in the AgentDock chat interface.
Verify that it can hold a conversation and that its tools (e.g., image generation) are working as expected. This step prevents debugging backend issues on the frontend.
