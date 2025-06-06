---
description: How to create and manage dynamic NPCs in your RPG-JS game
---

# Dynamic NPC Management Workflow

This workflow explains how to create, edit, and delete NPCs in your RPG-JS game using the Agent Artel dashboard.

## Prerequisites

1. Both the RPGJS game and the Agent Artel dashboard must be running:
   - RPGJS game: `cd /Users/satorisan/Desktop/RPGJS_TEST/ARTELIO && npm run dev`
   - Agent Artel dashboard: `cd /Users/satorisan/Desktop/RPGJS_TEST/agent-artel && npm run dev`

2. Make sure your `.env` file in the ARTELIO project includes the necessary API endpoints:
   ```
   NPC_API_ENDPOINT=http://localhost:3000/api/npcs
   AGENTS_API_ENDPOINT=http://localhost:3000/api/agents
   ```

## Creating a New NPC

1. Open your browser and navigate to the Agent Artel dashboard: http://localhost:3000
2. Go to the Game section and click on "NPCs" in the navigation
3. Click the "Add NPC" button in the top-right corner
4. Fill in the NPC details in the form:
   - **Basic Info Tab:**
     - Name: Enter a name for your NPC
     - Sprite: Select a character sprite (e.g., female, male, king)
     - Map: Choose the map where this NPC should appear
     - Position: Set X and Y coordinates for the NPC's position
     - Active: Toggle whether the NPC should be active/visible in the game
   - **Advanced Tab:**
     - Agent: Optionally assign an AI agent to power this NPC's dialogue
     - Hitbox: Adjust the NPC's collision dimensions
     - Description: Add a description of the NPC (will be shown in dialogue)
5. Click "Save NPC" to create the NPC

## Editing an Existing NPC

1. In the Agent Artel NPC management page, find the NPC card you want to edit
2. Click the "Edit" button on the NPC card
3. Modify any fields in the form
4. Click "Save NPC" to update the changes

## Deleting an NPC

1. In the Agent Artel NPC management page, find the NPC card you want to remove
2. Click the "Delete" button on the NPC card
3. Confirm deletion in the dialog that appears

## Testing NPCs in the Game

1. After creating or editing NPCs, go to your RPGJS game: http://localhost:4000
2. Enter a map where you've placed NPCs
3. If you've just created NPCs, you may need to reload the map (leave and re-enter)
4. Interact with the NPCs by walking up to them and pressing the action key

## Troubleshooting

- **NPCs not appearing:** Check that the NPC is set to active and assigned to the correct map
- **NPCs at incorrect positions:** Verify the X and Y coordinates in the NPC settings
- **API connection issues:** Ensure both the game and dashboard are running, and check console logs for errors

## Understanding NPC Types

1. **Basic NPCs:** Only have simple dialogue defined in the description
2. **Agent-powered NPCs:** Have dynamic dialogue when assigned an Agent ID
3. **Guide NPC:** A special NPC that explains the NPC management system (already in the game)

## Advanced: Customizing NPC Behavior

For more advanced NPC behaviors beyond what the management UI offers:

1. Study the dynamic-npcs.ts file in your RPGJS project
2. Extend the createNpcClass function to add custom behaviors
3. Add custom onAction methods for specialized interactions
