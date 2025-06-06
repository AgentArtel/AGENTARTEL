import axios from 'axios';
import { config } from './config';

/**
 * Utility for interacting with the AgentArtel API
 */
export const AgentArtel = {
    /**
     * Strips markdown formatting from a string
     * @param text Text with markdown formatting
     * @returns Plain text without markdown formatting
     */
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
    },
    
    /**
     * Send a message to an AgentArtel agent and get a response
     * 
     * @param agentId The ID of the agent to chat with
     * @param message The message to send
     * @param history Optional conversation history
     * @returns The agent's response
     */
    async chat(agentId: string, message: string, history: Array<{ role: string, content: string }> = []): Promise<string> {
        try {
            // Create a unique message ID
            const messageId = `rpgjs_${Date.now()}`;
            
            // Prepare the messages array with history and new message
            const messages = [
                ...history,
                {
                    id: messageId,
                    role: 'user',
                    content: message
                }
            ];
            
            // Log the request details
            console.log('=== AGENT ARTEL API REQUEST ===');
            console.log(`Agent ID: ${agentId}`);
            console.log(`Request URL: ${config.agentArtel.baseUrl}/api/chat/${agentId}`);
            console.log('Request payload:', JSON.stringify({ messages }, null, 2));
            
            // Make the API request
            const response = await axios.post(
                `${config.agentArtel.baseUrl}/api/chat/${agentId}`,
                { messages },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': config.agentArtel.apiKey
                    }
                }
            );
            
            // Log the response details
            console.log('=== AGENT ARTEL API RESPONSE ===');
            console.log('Response status:', response.status);
            console.log('Response data structure:', Object.keys(response.data));
            console.log('Response data (sample):', JSON.stringify(response.data, null, 2).substring(0, 500) + '...');
            
            // TYPE 1: Standard JSON object response (non-streaming, e.g. OpenAI format)
            if (response.data && typeof response.data === 'object' && response.data.choices && response.data.choices.length > 0) {
                console.log('Response format: choices array (standard JSON object)');
                return response.data.choices[0].message.content;
            }

            // TYPE 2: String that might contain custom line-by-line streaming format
            if (response.data && typeof response.data === 'string') {
                console.log('Response data is a string. Length:', response.data.length, 'Checking for custom streaming format.');
                const isLikelyStream = response.data.includes('\n') && response.data.includes(':') && 
                                     (response.data.includes('f:{') || /^\d+:"/m.test(response.data) || /^\d+: /m.test(response.data)); // Added heuristic for non-quoted json values

                if (isLikelyStream) {
                    console.log('String matches streaming format heuristic. Attempting to parse...');
                    try {
                        const lines = response.data.trim().split(/\r?\n/); // Robust line splitting
                        const chunksMap: Map<number, string[]> = new Map();
                        let streamMessageId = '';
                        let parseSuccessful = false;

                        for (const rawLine of lines) {
                            const line = rawLine.trim();
                            if (line === '') continue;

                            // console.log(`Processing trimmed line: [${line}]`); // Verbose

                            if (line.startsWith('f:')) {
                                const fJson = line.substring(2);
                                try {
                                    const fParsed = JSON.parse(fJson);
                                    if (fParsed.messageId) {
                                        streamMessageId = fParsed.messageId;
                                        // console.log('Stream Message ID:', streamMessageId); // Verbose
                                    }
                                } catch (e) {
                                    // console.warn('Could not parse f-string content:', fJson, e); // Verbose
                                }
                                continue;
                            }

                            // Regex to capture index and the rest of the line (which should be a JSON string value)
                            const contentMatch = line.match(/^(\d+):(.*)$/);
                            if (contentMatch) {
                                const chunkIndex = parseInt(contentMatch[1]);
                                const potentialJsonString = contentMatch[2].trim(); // e.g., "some text with \"escapes\" and \n newlines"
                                
                                // console.log(`Potential JSON string for index ${chunkIndex}: [${potentialJsonString}]`); // Verbose

                                try {
                                    // JSON.parse will handle unescaping of \", \n, etc. if potentialJsonString is a valid JSON string literal
                                    const unescapedContent = JSON.parse(potentialJsonString);
                                    
                                    if (typeof unescapedContent === 'string') {
                                        // console.log(`Successfully parsed for index ${chunkIndex}. Unescaped: [${unescapedContent.substring(0,50)}...]`); // Verbose
                                        if (!chunksMap.has(chunkIndex)) {
                                            chunksMap.set(chunkIndex, []);
                                        }
                                        chunksMap.get(chunkIndex)!.push(unescapedContent);
                                        parseSuccessful = true;
                                    } else {
                                        // console.warn(`JSON.parse of [${potentialJsonString}] did not yield a string. Type: ${typeof unescapedContent}`); // Verbose
                                    }
                                } catch (jsonError) {
                                    // console.warn(`Failed to JSON.parse content part: [${potentialJsonString}] from line [${line}]. Error: ${jsonError.message}`); // Verbose
                                    // If JSON.parse fails, it might be a non-standard format or simple string not needing JSON parsing.
                                    // As a fallback, consider if it's a simple quoted string not needing JSON.parse, or just raw text.
                                    // For now, we'll be strict: if it looks like index:payload, payload must be valid JSON string.
                                }
                            } else {
                                // console.log(`Line DID NOT match content regex ^(\d+):(.*)$ : [${line}]`); // Verbose
                            }
                        }

                        if (parseSuccessful && chunksMap.size > 0) {
                            console.log('Successfully parsed custom streaming format from string. Assembling message...');
                            let fullMessage = '';
                            const sortedChunkIndices = Array.from(chunksMap.keys()).sort((a, b) => a - b);
                            for (const index of sortedChunkIndices) {
                                fullMessage += chunksMap.get(index)!.join('');
                            }
                            console.log('Concatenated stream message length:', fullMessage.length);
                            console.log('Full Parsed Stream Message:\n', fullMessage);
                            
                            // Strip markdown formatting
                            const strippedMessage = this.stripMarkdown(fullMessage);
                            console.log('Stripped markdown message length:', strippedMessage.length);
                            return strippedMessage;
                        } else {
                            console.log('String looked like stream, but parsing yielded no valid chunks or parseSuccessful is false. Treating as plain string.');
                        }
                    } catch (e) {
                        console.error('Error parsing string as custom streaming data, treating as plain string:', e);
                    }
                } else {
                    console.log('String does not match streaming format heuristic.');
                }
                // If not parsed as stream or if it didn't match heuristic, return as plain string
                console.log('Response format: plain string (fallback).');
                return response.data;
            }

            // TYPE 3: Object that might be a pre-parsed custom streaming format (less likely for this specific stream format)
            if (response.data && typeof response.data === 'object' && !response.data.choices) {
                const keys = Object.keys(response.data);
                if (keys.some(k => /^\d+$/.test(k)) || keys.includes('f')) {
                    console.log('Response format: pre-parsed custom streaming object.');
                    try {
                        let fullMessage = '';
                        const sortedNumericKeys = keys
                            .filter(key => key !== 'f' && /^\d+$/.test(key))
                            .sort((a, b) => parseInt(a) - parseInt(b));
                        
                        for (const key of sortedNumericKeys) {
                            if (typeof response.data[key] === 'string') {
                                fullMessage += response.data[key];
                            } else if (Array.isArray(response.data[key])) {
                                fullMessage += response.data[key].join('');
                            }
                        }
                        if (fullMessage) {
                            console.log('Concatenated message length (from object):', fullMessage.length);
                            console.log('Message sample (from object):', fullMessage.substring(0, 200) + (fullMessage.length > 200 ? '...' : ''));
                            return fullMessage;
                        } else {
                            console.log('Pre-parsed object looked like stream, but processing yielded no message.');
                        }
                    } catch (e) {
                        console.error('Error processing pre-parsed custom streaming object:', e);
                    }
                }
            }
            
            // Fallback for all other unhandled cases
            console.log('Response format: unknown or unhandled. Full response data (sample):', JSON.stringify(response.data).substring(0, 500));
            return 'I seem to be having trouble connecting to my thoughts right now.';
        } catch (error) {
            console.error('=== AGENT ARTEL API ERROR ===');
            console.error('Error communicating with AgentArtel:', error);
            if (error.response) {
                console.error('Error response status:', error.response.status);
                console.error('Error response data:', error.response.data);
            }
            return 'I seem to be having trouble connecting to my thoughts right now. Let\'s talk again later.';
        }
    },
    
    /**
     * Extract the emotion from an agent response
     * Simple implementation that looks for emotion keywords in the response
     * 
     * @param response The agent's response text
     * @returns The detected emotion or 'think' as default
     */
    detectEmotion(response: string): string {
        const lowerResponse = response.toLowerCase();
        
        if (lowerResponse.includes('happy') || lowerResponse.includes('joy') || lowerResponse.includes('excited')) {
            return 'happy';
        }
        if (lowerResponse.includes('sad') || lowerResponse.includes('depressed') || lowerResponse.includes('melancholy')) {
            return 'sad';
        }
        if (lowerResponse.includes('surprised') || lowerResponse.includes('amazed') || lowerResponse.includes('astonished')) {
            return 'surprise';
        }
        if (lowerResponse.includes('confused') || lowerResponse.includes('puzzled')) {
            return 'confused';
        }
        if (lowerResponse.includes('question') || lowerResponse.includes('curious') || lowerResponse.includes('wonder')) {
            return 'question';
        }
        if (lowerResponse.includes('idea') || lowerResponse.includes('thought')) {
            return 'idea';
        }
        if (lowerResponse.includes('like') || lowerResponse.includes('love') || lowerResponse.includes('appreciate')) {
            return 'like';
        }
        if (lowerResponse.includes('exclaim') || lowerResponse.includes('wow')) {
            return 'exclamation';
        }
        
        // Default emotion
        return 'think';
    }
};

export default AgentArtel;
