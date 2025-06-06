# AgentDock & RPGJS Integration Plan

This document outlines the phased approach for integrating AgentDock AI-NPCs with an RPGJS game, based on the conceptual plan in `Dev_rules/plan.md`.

## Phase 1: AgentDock AI-NPC Definition and Service Setup

**Goal:** Create the AI-NPC within AgentDock and ensure it's accessible via API.

*   [x] **Step 1.1: Define the AI-NPC Core (`template.json`)**
    *   [x] Assign a unique `agentId`.
    *   [x] Define `name` and `description`.
    *   [x] Craft `personality` array (system prompt).
    *   [x] Specify `nodes` (e.g., `llm.anthropic`, `search`).
    *   [x] Configure `nodeConfigurations` (LLM model, temperature, etc.).
    *   **Deliverable:** Complete `template.json` file for the AI-NPC. (Verified)

*   [x] **Step 1.2: Prepare AgentDock for External API Interaction**
    *   [x] 1.2.1. Identify/establish the API endpoint URL (e.g., `http://<agentdock_host>:<port>/api/agent/<agentId>/interact`).
        - Confirmed: `http://localhost:3000/api/chat/{agentId}` (assuming default AgentDock port).
    *   [x] 1.2.2. Confirm expected API request structure (JSON: `playerId`, `message`, `conversationHistory`, `gameStateContext`).
        - Confirmed: Request body to include `messages` (array for current message and history) and `config` (object for `runtimeOverrides`, which can include `playerId` and `gameStateContext`).
    *   [x] 1.2.3. Set up/note the API key for authentication (RPGJS to call AgentDock).
        - Implemented: AgentDock API route `/api/chat/[agentId]` now requires an `Authorization: Bearer <key>` header. The key value should be set in AgentDock's `.env.local` as `AGENTDOCK_ACCESS_KEY`.
    *   [x] 1.2.4. Confirm expected API response structure (JSON: `npcResponse`, `actions`, `updatedConversationHistory`).
        - Confirmed: `npcResponse` is a text stream. `actions` will be inferred from text or handled by other AgentDock mechanisms. `updatedConversationHistory` is managed implicitly by client and server session.
    *   **Deliverable:** [DONE] A running AgentDock service exposing the AI-NPC via a secured API endpoint (requires `AGENTDOCK_ACCESS_KEY` to be set and provided by RPGJS).

## Phase 2: RPGJS Client Implementation for AgentDock Communication

**Goal:** Enable the RPGJS game to communicate with the AgentDock AI-NPC.

*   [ ] **Step 2.1: Create the Basic AI-NPC Event in RPGJS**
    *   [ ] Define a new `RpgEvent` class.
    *   [ ] Use `@EventData` to set `name` and `mode` (e.g., `EventMode.Scenario`).
    *   [ ] Implement `onInit()` for basic setup (e.g., `this.setGraphic()`).
    *   **Deliverable:** A basic, placeable NPC event in RPGJS.

*   [ ] **Step 2.2: Implement Player Interaction and Input Gathering**
    *   [ ] In the `RpgEvent`'s `onAction()` method, use `await player.showChoices()` to present dialogue options.
    *   [ ] Capture the chosen option's `value` as the player's message.
    *   **Deliverable:** RPGJS NPC can present choices and capture player input.

*   [ ] **Step 2.3: Develop API Call Logic to AgentDock**
    *   [ ] Within `onAction()`, retrieve AgentDock API key and endpoint URL (from environment variables).
    *   [ ] Construct the JSON `requestPayload` (`playerId`, `message`, `conversationHistory`).
    *   [ ] Use `fetch` to make the HTTP POST request to AgentDock API (with `Content-Type` and `Authorization` headers).
    *   **Deliverable:** RPGJS NPC can send requests to the AgentDock API.

*   [ ] **Step 2.4: Process AgentDock's Response and Update Game State**
    *   [ ] Handle the `fetch` response: parse JSON.
    *   [ ] Display `npcResponse` using `await player.showText()`.
    *   [ ] Manage `conversationHistory` (e.g., using `player.setVariable()`).
    *   [ ] (Conceptual) Plan for processing `actions` array from AI response.
    *   **Deliverable:** Player sees AI dialogue; conversation state is maintained.

*   [ ] **Step 2.5: Implement Robust Error Handling and Security**
    *   [ ] Wrap API call logic in `try...catch` blocks.
    *   [ ] Provide fallback dialogue on API error/unavailability.
    *   [ ] Log errors server-side.
    *   [ ] Ensure AgentDock API key is stored and accessed securely.
    *   **Deliverable:** Stable and secure communication between RPGJS and AgentDock.

## Phase 3: Advanced Features (Future Iteration)

*   [ ] Explore AgentDock-initiated communication (Webhooks to RPGJS).
*   [ ] Implement more complex game state interactions based on AI `actions`.
*   [ ] Develop custom tool nodes in AgentDock for game-specific NPC capabilities.
*   [ ] Refine player input methods in RPGJS (if beyond `showChoices`).
