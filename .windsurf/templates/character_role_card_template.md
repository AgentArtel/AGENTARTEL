# Character Role Card Template for AI Agents

Fill out this card for each new AI agent you want to create and integrate into your RPGJS game using AgentDock.

---

## I. Agent Identity & Backend Configuration

*   **`Agent Name (In-Game Concept)`**:
    *   Description: The general name or concept for the agent.
    *   Example: `Sarcastic Merchant`, `Wise Old Tree`, `Mystic Villager`
    *   Value: `_________________________`

*   **`Agent ID (for AgentDock)`**:
    *   Description: Unique identifier for the agent in AgentDock. Should be URL-friendly (e.g., lowercase, hyphens).
    *   Example: `rpgjs-sarcastic-merchant`, `rpgjs-wise-old-tree`, `rpgjs-mystic-villager`
    *   Value: `_________________________`

*   **`Personality/Role Description (for AI Prompt in AgentDock)`**:
    *   Description: Detailed description of the agent's personality, role, knowledge, speaking style, and how they should respond. This is the core prompt for the AI.
    *   Example: `You are a grumpy but ultimately helpful blacksmith. You complain about your aching back but always provide good advice on weapons and armor. You use old-timey slang.`
    *   Value:
        ```
        ________________________________________________________________________
        ________________________________________________________________________
        ________________________________________________________________________
        ```

---

## II. RPGJS In-Game Configuration

*   **`NPC Event Name (for TMX & EventData)`**:
    *   Description: Identifier used in Tiled map files and in the `@EventData` decorator. Conventionally, derived from Agent Name (e.g., lowercase, hyphens, ending in `-event`).
    *   Example: `sarcastic-merchant-event`, `wise-old-tree-event`, `mystic-villager-event`
    *   Value: `_________________________`

*   **`Default Sprite Graphic (RPGJS)`**:
    *   Description: The spritesheet name to use for the NPC in RPGJS (e.g., from `main/spritesheets/characters/characters.ts`).
    *   Example: `female`, `hero`, `custom_sprite_name`
    *   Value: `_________________________`

*   **`Display Name (Above NPC in RPGJS)`**:
    *   Description: The text that appears above the NPC in-game.
    *   Example: `Sarcastic Merchant`, `Wise Old Tree`, `Mystic Villager`
    *   Value: `_________________________`

*   **`Initial Greeting Message (RPGJS)`**:
    *   Description: The first thing the NPC says when the player interacts with them.
    *   Example: `"Hmph. What do YOU want?"`, `"Greetings, traveler. Rest your weary branches with me."`
    *   Value: `________________________________________________________________________`

*   **`Unique History Variable Name (RPGJS)`**:
    *   Description: A unique string for storing this NPC's conversation history with the player in RPGJS player variables. Convention: ALL_CAPS_SNAKE_CASE.
    *   Example: `SARCASTIC_MERCHANT_HISTORY`, `WISE_OLD_TREE_HISTORY`, `MYSTIC_VILLAGER_HISTORY`
    *   Value: `_________________________`

*   **`Agent Key in config.ts (RPGJS)`**:
    *   Description: The short, camelCase key used to identify this agent within the `agentDock.agents` object in `main/utils/config.ts`. This key links to the `Agent ID (for AgentDock)`.
    *   Example: `sarcasticMerchant`, `wiseOldTree`, `mysticVillager`
    *   Value: `_________________________`

---

## III. Dialogue & Interaction (Optional but Recommended)

*   **`Sample Dialogue Choices (for player.showChoices in RPGJS)`**:
    *   Description: 2-4 example questions or prompts the player can choose from to initiate or guide the conversation. Each choice has a `text` (what the player sees) and a `value` (what's sent as input to the AI).
    *   Example:
        *   `{ text: "Got any good weapons?", value: "Tell me about your available weapons." }`
        *   `{ text: "What's the latest gossip?", value: "What's the latest gossip around town?" }`
        *   `{ text: "Nevermind.", value: "nevermind" }`
    *   Values:
        1.  Text: `_________________________` | Value: `_________________________`
        2.  Text: `_________________________` | Value: `_________________________`
        3.  Text: `_________________________` | Value: `_________________________`
        4.  Text: `_________________________` | Value: `_________________________`

---

## IV. Placement

*   **`Target Map File`**:
    *   Description: The `.tmx` file where this NPC will be placed.
    *   Example: `simplemap2.tmx`, `village_square.tmx`
    *   Value: `_________________________`

*   **`Approximate Location (Coordinates or Description)`**:
    *   Description: Where on the map the NPC should be placed.
    *   Example: `Near the well (X: 320, Y: 480)`, `Inside the tavern`
    *   Value: `_________________________`

---

Date Created: `YYYY-MM-DD`
Completed by: `Your Name/Initials`
