# AgentArtel API Integration Documentation

This document provides technical details on how the AgentArtel API is integrated into the RPGJS game, focusing specifically on handling streaming responses and formatting them for game dialogue.

## Overview

The integration consists of several key components:

1. **Configuration (`config.ts`)**: Stores API keys, endpoints, and agent IDs
2. **API Utility (`agent-artel.ts`)**: Handles communication with the AgentArtel API
3. **NPC Emotions (`npc-emotions.ts`)**: Maps response sentiment to emotion bubbles
4. **NPC Events (e.g., `dream-interpreter.ts`)**: Implements specific AI-powered NPCs

## Streaming Response Handling

The AgentArtel API can return responses in several formats, including a custom streaming format. The streaming format is a string containing line-by-line chunks that need to be parsed and reassembled.

### Streaming Format Structure

The streaming response typically looks like this:

```
f:{"messageId":"msg-IOhBGkGAhtp8Hw7a5VuxRRlU"}
0:"*adjusts "
0:"spectacles "
0:"and "
0:"takes "
...
```

Where:
- The `f:` line contains metadata about the message
- Lines starting with numbers (e.g., `0:`) contain content chunks
- The content is in JSON string format with escaping (e.g., `"*adjusts "`)

### Parsing Logic

The parsing logic in `agent-artel.ts` handles this format through the following steps:

1. **Detect streaming format**: Check if the response string matches heuristics for the streaming format
2. **Split into lines**: Split the response string into individual lines
3. **Process each line**:
   - For `f:` lines: Extract message metadata
   - For content lines: Extract the chunk index and content
4. **Parse content**: Use `JSON.parse()` to handle string unescaping
5. **Assemble message**: Concatenate all chunks in order by their index

### Key Code Sections

#### Streaming Format Detection

```typescript
const isLikelyStream = response.data.includes('\n') && response.data.includes(':') && 
                     (response.data.includes('f:{') || /^\d+:"/m.test(response.data) || /^\d+: /m.test(response.data));
```

#### Line Processing

```typescript
// For metadata lines
if (line.startsWith('f:')) {
    const fJson = line.substring(2);
    try {
        const fParsed = JSON.parse(fJson);
        if (fParsed.messageId) {
            streamMessageId = fParsed.messageId;
        }
    } catch (e) {
        // Handle parsing error
    }
    continue;
}

// For content lines
const contentMatch = line.match(/^(\d+):(.*)$/);
if (contentMatch) {
    const chunkIndex = parseInt(contentMatch[1]);
    const potentialJsonString = contentMatch[2].trim();
    
    try {
        // Use JSON.parse to handle unescaping
        const unescapedContent = JSON.parse(potentialJsonString);
        
        if (typeof unescapedContent === 'string') {
            // Store the chunk
            if (!chunksMap.has(chunkIndex)) {
                chunksMap.set(chunkIndex, []);
            }
            chunksMap.get(chunkIndex)!.push(unescapedContent);
            parseSuccessful = true;
        }
    } catch (jsonError) {
        // Handle parsing error
    }
}
```

#### Message Assembly

```typescript
if (parseSuccessful && chunksMap.size > 0) {
    let fullMessage = '';
    const sortedChunkIndices = Array.from(chunksMap.keys()).sort((a, b) => a - b);
    for (const index of sortedChunkIndices) {
        fullMessage += chunksMap.get(index)!.join('');
    }
    return fullMessage;
}
```

## Markdown Handling

The AgentArtel API may return responses with markdown formatting, which needs to be stripped for proper display in the game's dialogue system.

### Markdown Stripping

The `stripMarkdown` method in `agent-artel.ts` removes common markdown formatting:

```typescript
stripMarkdown(text: string): string {
    if (!text) return '';
    
    // First, handle the markdown formatting
    
    // Remove headers (##, ###, etc)
    text = text.replace(/^#{1,6}\s+/gm, '');
    
    // Remove bold formatting
    text = text.replace(/\*\*([^*]+)\*\*/g, '$1');
    
    // Remove italic with underscore
    text = text.replace(/_([^_]+)_/g, '$1');
    
    // Remove bullet points but keep the dash
    text = text.replace(/^\s*[-*+]\s+/gm, '- ');
    
    // Remove blockquotes
    text = text.replace(/^>\s+/gm, '');
    
    // Remove code blocks
    text = text.replace(/```[\s\S]*?```/g, '');
    text = text.replace(/`([^`]+)`/g, '$1');
    
    // Remove horizontal rules
    text = text.replace(/^\s*[-*_]{3,}\s*$/gm, '');
    
    // Remove extra line breaks (more than 2 consecutive)
    text = text.replace(/\n{3,}/g, '\n\n');
    
    return text;
}
```

### Formatting Instructions

To further ensure proper formatting, explicit instructions are included with each request to the API:

```typescript
const formattedUserMessage = `${userMessage}\n\nIMPORTANT: Please format your response as plain text without markdown formatting. Do not use headers (##), bold (**text**), or other markdown. Keep paragraphs short (2-3 sentences max) for better readability in a dialogue box. Use simple language and natural speech patterns. For actions, use *asterisks* like *adjusts glasses* which will be preserved.`;
```

## Emotion Detection

The `detectEmotion` method analyzes the response text to determine an appropriate emotion for the NPC to display:

```typescript
detectEmotion(text: string): string {
    // Simple heuristic to detect emotions from text
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('confused') || lowerText.includes('puzzled') || lowerText.includes('uncertain')) {
        return 'confusion';
    } else if (lowerText.includes('excited') || lowerText.includes('amazing') || lowerText.includes('wonderful')) {
        return 'exclamation';
    } else if (lowerText.includes('question') || lowerText.includes('curious') || lowerText.includes('wonder')) {
        return 'question';
    } else if (lowerText.includes('happy') || lowerText.includes('pleased') || lowerText.includes('delighted')) {
        return 'heart';
    } else if (lowerText.includes('sad') || lowerText.includes('disappointed') || lowerText.includes('unhappy')) {
        return 'sweat';
    } else if (lowerText.includes('angry') || lowerText.includes('frustrated') || lowerText.includes('annoyed')) {
        return 'anger';
    } else if (lowerText.includes('surprised') || lowerText.includes('shocked') || lowerText.includes('astonished')) {
        return 'surprise';
    } else if (lowerText.includes('thinking') || lowerText.includes('contemplating') || lowerText.includes('considering')) {
        return 'thinking';
    } else {
        return 'idea'; // Default emotion
    }
}
```

## Conversation History Management

Conversation history is managed at the NPC level, typically using player variables:

```typescript
// Initialize conversation history
if (!player.getVariable(HISTORY_VAR)) {
    player.setVariable(HISTORY_VAR, []);
}

// Get conversation history
const conversationHistory = player.getVariable(HISTORY_VAR) || [];

// Add user message to history
conversationHistory.push({
    role: 'user',
    content: userMessage
});

// Limit history to prevent context overflow
const limitedHistory = conversationHistory.slice(-10);

// Update history after response
conversationHistory.push({
    role: 'assistant',
    content: agentResponse
});
player.setVariable(HISTORY_VAR, conversationHistory);
```

## Troubleshooting

### Common Issues

1. **Raw Streaming Format in Dialogue**: If you see raw streaming format (`f:{...}`, `0:"..."`) in the dialogue:
   - Check that the `isLikelyStream` heuristic is correctly identifying the format
   - Verify that the line regex patterns are matching correctly
   - Ensure `JSON.parse()` is successfully parsing the content chunks

2. **Markdown Showing in Dialogue**: If markdown formatting appears in the dialogue:
   - Check that the `stripMarkdown` method is being called
   - Verify that the regex patterns in `stripMarkdown` are matching all markdown elements
   - Ensure the formatting instructions are being included in the request

3. **Slow or Hanging Responses**: If responses are slow or seem to hang:
   - Check for infinite loops in the parsing logic
   - Consider adding timeouts to the API request
   - Limit the amount of conversation history being sent

### Debugging Tips

1. **Enable Verbose Logging**: Uncomment the verbose logging statements in `agent-artel.ts` to see detailed information about each step of the parsing process.

2. **Test with Sample Data**: Create a test function that processes a sample streaming response to verify the parsing logic without making actual API calls.

3. **Check Terminal Output**: The terminal output includes detailed information about the API request, response, and parsing process, which can help identify issues.

## Future Improvements

1. **Chunked Display**: Implement progressive display of streaming chunks as they arrive, rather than waiting for the complete response.

2. **Better Error Handling**: Add more robust error handling and fallback mechanisms for API failures.

3. **Caching**: Implement caching for common responses to reduce API calls and improve performance.

4. **Custom Formatting**: Allow each NPC to specify custom formatting instructions based on their character and role.

5. **Advanced Emotion Detection**: Use more sophisticated sentiment analysis to determine the appropriate emotion bubble.
