# AGENTARTEL

Welcome to the AGENTARTEL monorepo! This repository houses the interconnected projects that power "Fractal of You," an introspective RPG experience.

## Overview

AGENTARTEL combines a player-facing RPGJS game (`ARTELIO`) with a powerful AI backend (`Agent-artel-Dock`). `Agent-artel-Dock` acts as a central hub for AI capabilities, providing services that `ARTELIO` consumes to bring its world and characters to life. The core concept, "Fractal of You," invites players into the world of Artelio to explore themes of self-discovery through interaction with AI-driven characters and the collection and processing of unique 'media fragments.'

This monorepo structure facilitates unified development, version control, and management of both critical components.

## Projects Included

This repository contains the following primary projects:

*   **`ARTELIO/`**: The frontend RPG game built with [RPGJS](https://rpgjs.dev/). This is where players will explore the world, interact with NPCs, and experience the narrative of "Fractal of You." It interfaces with `Agent-artel-Dock` for dynamic AI-driven content and interactions.
*   **`Agent-artel-Dock/`**: The backend AI agent and services hub. This Node.js application, built with Next.js and pnpm, provides the AI-driven dialogue, dynamic content generation, and other intelligent services. It manages connections to various AI models (e.g., OpenAI, Anthropic) and other external services, configured via its own environment variables.

## Purpose

The primary goal of this monorepo is to streamline the development and deployment of the "Fractal of You" experience by:
*   Maintaining both the game client and AI backend under a single version control system.
*   Simplifying dependency management and build processes.
*   Ensuring consistent development practices across both projects.

## Getting Started

### Prerequisites

*   [Node.js](https://nodejs.org/) (LTS version recommended - `Agent-artel-Dock` requires `v20.11.0` or higher)
*   [Git](https://git-scm.com/)
*   [pnpm](https://pnpm.io/) (for `Agent-artel-Dock` - version `9.15.0` or higher specified)

### Cloning the Repository

```bash
git clone https://github.com/AgentArtel/AGENTARTEL.git
cd AGENTARTEL
```

### Setup Instructions

Each project within this monorepo has its own dependencies and setup steps:

1.  **ARTELIO (RPGJS Game)**:
    ```bash
    cd ARTELIO
    npm install 
    # Create a .env file in this directory (ARTELIO/.env).
    # Populate it with necessary environment variables, primarily the base URL 
    # for your local Agent-artel-Dock instance (e.g., AGENT_DOCK_BASE_URL=http://localhost:3001).
    # Other specific configurations for ARTELIO can also be placed here.
    cd ..
    ```

2.  **Agent-artel-Dock (AI Backend)**:
    ```bash
    cd Agent-artel-Dock
    pnpm install 
    # This will also run a postinstall script to set up 'agentdock-core'.
    # Copy .env.example to .env and populate with necessary API keys (e.g., OpenAI, Anthropic) 
    # and other configurations for the AI services it provides.
    cd ..
    ```

## Running the Projects

Both projects need to be run separately, typically in different terminal sessions.

*   **To run `ARTELIO`**:
    ```bash
    cd ARTELIO
    npm run dev
    ```
    The game should then be accessible in your browser, usually at `http://localhost:3000`. Ensure `Agent-artel-Dock` is running and `ARTELIO` is configured with the correct URL to reach it.

*   **To run `Agent-artel-Dock`**:
    ```bash
    cd Agent-artel-Dock
    pnpm run dev 
    ```
    This command will also execute pre-development scripts for bundling templates and building `agentdock-core`. The backend services will then be available, typically on a different port (e.g., `http://localhost:3001` or as configured).

**Important Note on Environment Variables**: Both projects rely heavily on environment variables.
*   For `ARTELIO/`, create a `.env` file. The most critical variable will be the one specifying the URL for your `Agent-artel-Dock` backend.
*   For `Agent-artel-Dock/`, copy `Agent-artel-Dock/.env.example` to `Agent-artel-Dock/.env` and fill in your API keys and other configurations for the AI models and services it uses.
*   These `.env` files are ignored by Git (as per `.gitignore`) to protect sensitive information.
*   For general guidance on setting up environment variables, you can refer to the workflow: `/setup-environment-variables`.

## Key Technologies

*   **Game Engine**: RPGJS (v4.3.0+)
*   **Programming Language**: TypeScript
*   **Backend Framework**: Node.js, Next.js (for Agent-artel-Dock)
*   **Package Management**: npm (for ARTELIO), pnpm (for Agent-artel-Dock)
*   **AI Integration**: `ARTELIO` communicates with `Agent-artel-Dock`, which in turn integrates with various AI models (e.g., OpenAI, Anthropic) and external services.

## Development Workflows

This repository utilizes development workflows managed by Cascade, located in the `.windsurf/workflows/` directory. These workflows provide step-by-step instructions for common tasks such as creating new AI NPCs, managing GUI components, and more. You can ask Cascade to list or run these workflows.

---

This README provides a starting point. Feel free to expand it with more details about specific features, contribution guidelines, or deployment processes as the project evolves.
