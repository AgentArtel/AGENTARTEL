post request example format: curl -X POST   https://agent-artel-production.up.railway.app/api/chat/example-agent   -H "Content-Type: application/json"   -H "x-api-key: YOUR_ANTHROPIC_API_KEY_HERE"   -d '{
        "messages": [
          {
            "id": "test_railway_with_key_`date +%s`",
            "role": "user",
            "content": "Hello Example Agent, what can you do?"
          }
        ]
      }'   --no-buffer



OPENAL YAML format:

openapi: 3.0.3
info:
  title: AgentDock API
  version: v1.0.0
  description: |
    API for interacting with AgentDock agents. 
    Allows sending messages to various pre-configured agents and receiving streamed responses.
    The primary interaction point is the `/api/chat/{agentId}` endpoint.
  contact:
    name: AgentDock Support
    url: https://hub.agentdock.ai
    email: support@agentdock.ai
servers:
  - url: http://localhost:3003
    description: Local development server
  - url: https://agent-artel-production.up.railway.app # Add this line
    description: Railway production server             # Add this line
  - url: https://hub.agentdock.ai
    description: Production server (example, actual may vary)

components:
  schemas:
    Message:
      type: object
      required:
        - id
        - role
        - content
      properties:
        id:
          type: string
          description: Unique identifier for the message.
          example: msg_01HXZ8Z5V5Q9Z0X7J8P5B6R2K9
        role:
          type: string
          enum: [user, assistant, system, tool]
          description: The role of the entity sending the message.
        content:
          type: string
          description: The text content of the message.
          example: "Hello, agent!"
        tool_calls:
          type: array
          description: Optional. Used by 'assistant' role to request tool execution.
          items:
            type: object
            required:
              - id
              - type
              - function
            properties:
              id:
                type: string
                description: Unique ID for the tool call.
                example: call_01HXZ8Z5V5Q9Z0X7J8P5B6R2KA
              type:
                type: string
                enum: [function]
                default: function
              function:
                type: object
                required:
                  - name
                  - arguments
                properties:
                  name:
                    type: string
                    description: Name of the tool to be called.
                    example: getWeather
                  arguments:
                    type: string
                    description: JSON string of arguments for the tool.
                    example: '{"location": "London", "unit": "celsius"}'
        tool_call_id:
          type: string
          description: Optional. Used by 'tool' role to link to a specific tool_call id.
          example: call_01HXZ8Z5V5Q9Z0X7J8P5B6R2KA

    ChatRequestBody:
      type: object
      required:
        - messages
      properties:
        messages:
          type: array
          description: A list of message objects, representing the conversation history.
          items:
            $ref: '#/components/schemas/Message'
        session_id:
          type: string
          description: Optional. A unique identifier for the chat session to maintain context.
          example: session_01HXZ8Z5V5Q9Z0X7J8P5B6R2KC
        stream_data:
          type: boolean
          description: Optional. Indicates if data should be streamed. Defaults to true by the server.
          default: true

    Error:
      type: object
      required:
        - code
        - message
      properties:
        code:
          type: string
          description: An error code.
        message:
          type: string
          description: A human-readable error message.
        details:
          type: object
          additionalProperties: true
          description: Optional additional error details.

  securitySchemes:
    ApiKeyAuth:
      type: apiKey
      in: header
      name: x-api-key
      description: Optional API key for providers that require it and if `useCustomApiKey` is true in agent's template, or if not found in environment variables.

paths:
  /api/chat/{agentId}:
    post:
      summary: Send a message to an agent
      description: |
        Sends a message or a list of messages to the specified agent and receives a streamed response.
        The response is typically a text/event-stream.
      operationId: chatWithAgent
      tags:
        - Chat
      parameters:
        - name: agentId
          in: path
          required: true
          description: ID of the agent to interact with.
          schema:
            type: string
            enum:
              - agent-planner
              - avalanche-builder
              - avalanche-explorer
              - calorie-vision
              - chandler-bing
              - cognitive-reasoner
              - consumer-rights
              - deepseek-agent
              - deepseek-distill-agent
              - deepseek-reasoner
              - dr-house
              - example-agent
              - finance-assistant
              - gemini-deep-research
              - gemini-grounding
              - gemini-search
              - gemini-visual
              - gemma-research
              - harvey-specter
              - history-mentor
              - marketing-prompt-library
              - mental-health-guide
              - orchestrated-agent
              - prd-creator
              - qwen-agent
              - research-agent
              - schema-designer
              - science-mentor
              - science-translator
              - scout-research
              - sigmund-freud
              - small-claims
              - tenant-rights
              - uncle-bob
      requestBody:
        description: Chat request payload
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ChatRequestBody'
      responses:
        '200':
          description: |
            Successful response. The body will be a stream of events (text/event-stream).
            Each event in the stream can represent different parts of the agent's response, 
            such as text chunks, tool call requests, or final messages.
          content:
            text/event-stream:
              schema:
                type: string
                description: |
                  A stream of Server-Sent Events. Example event lines:
                  `data: {"type":"text","value":"Hello! "}`
                  `data: {"type":"text","value":"How can I help you?"}`
                  `data: {"type":"tool_call","toolCallId":"call_xyz","toolName":"getWeather","args":{"location":"Paris"}}`
        '400':
          description: Bad Request (e.g., invalid input, missing required fields)
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
        '401':
          description: Unauthorized (e.g., missing or invalid API key when required)
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
        '404':
          description: Not Found (e.g., agentId does not exist)
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
        '500':
          description: Internal Server Error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
      security:
        - ApiKeyAuth: []

  # Potentially, a /api/chat/{agentId}/tools endpoint could be documented if its direct usage is intended.
  # For now, focusing on the primary chat interaction.
