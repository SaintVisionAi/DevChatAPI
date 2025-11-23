# SaintSal™ WebSocket Streaming Protocol

## Overview
The SaintSal™ platform uses WebSocket-based streaming for real-time AI conversations. This provides token-by-token response delivery for a natural conversational experience.

## Connection Lifecycle

### 1. WebSocket Handshake
```javascript
const ws = new WebSocket('ws://localhost:5000');
```

Server authenticates via session cookies and responds with:
```json
{
  "type": "connected",
  "message": "WebSocket connection established",
  "userId": "user_abc123"
}
```

### 2. Client Ready Signal
After receiving `connected`, client is ready to send messages.

### 3. Sending Messages
```json
{
  "type": "chat",
  "conversationId": "conv_123",  // null for new conversation
  "message": "Hello, SaintSal!",
  "model": "claude-sonnet-4-5",
  "mode": "chat",  // chat | search | research | code | voice
  "imageData": "data:image/png;base64,..."  // optional
}
```

### 4. Receiving Responses

#### New Conversation Created
```json
{
  "type": "conversationCreated",
  "conversationId": "conv_456"
}
```

#### Streaming Chunks (Token-by-Token)
```json
{
  "type": "chunk",
  "content": "Hello"
}
```

Multiple chunks stream in rapid succession for natural flow.

#### Streaming Complete
```json
{
  "type": "done"
}
```

#### Error Occurred
```json
{
  "type": "error",
  "message": "Anthropic API error: Rate limit exceeded"
}
```

## Provider-Specific Behavior

### Anthropic Claude (Streaming)
- **Chunk Cadence**: ~20-50ms between chunks
- **Chunk Size**: 1-5 tokens per chunk
- **Natural Flow**: Async iterator yields text deltas
- **Models**: claude-sonnet-4, claude-opus-4, claude-3.5-sonnet

### OpenAI GPT (Streaming)
- **Chunk Cadence**: ~30-60ms between chunks
- **Chunk Size**: 1-3 tokens per chunk
- **Natural Flow**: SSE stream with delta content
- **Models**: gpt-4o, gpt-4o-mini, gpt-5 (fallback to gpt-4o)

### Grok (Streaming)
- **Chunk Cadence**: ~50-100ms between chunks
- **Chunk Size**: Variable (SSE event based)
- **Note**: Newline-aware buffering to prevent partial JSON parse
- **Models**: grok-2-1212

### Perplexity (Non-Streaming)
- **Mode**: search, research
- **Behavior**: Single batch response (NOT token-by-token)
- **Response Time**: 2-5 seconds
- **Includes**: Citations and source URLs
- **Models**: sonar-pro (search), sonar-reasoning (research)

### Gemini (Batch with Vision)
- **Mode**: Image analysis only
- **Behavior**: Non-streaming batch response
- **Use Case**: Vision AI for uploaded images
- **Model**: gemini-1.5-flash

## Error Handling

### Client-Side Recovery
1. **Connection Lost**: Implement exponential backoff (1s, 2s, 4s, 8s max)
2. **Rate Limits**: Show user-friendly message, retry after 60s
3. **API Errors**: Display error message, allow manual retry
4. **Timeout**: 30s for first chunk, 10s between chunks

### Server-Side Error Types
- `"Unauthorized"`: Session expired, redirect to login
- `"AI services not configured"`: Missing API keys
- `"Rate limit exceeded"`: Provider quota reached
- `"Failed to generate response"`: Generic provider error

## Best Practices

### Client Implementation
```javascript
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch(data.type) {
    case 'connected':
      // Connection established
      break;
    case 'conversationCreated':
      // Save conversation ID
      break;
    case 'chunk':
      // Append to streaming message
      setStreamingMessage(prev => prev + data.content);
      break;
    case 'done':
      // Finalize message, enable input
      setIsStreaming(false);
      break;
    case 'error':
      // Show error, enable retry
      toast.error(data.message);
      break;
  }
};
```

### Performance Optimization
1. **Debounce UI Updates**: Update DOM every 50ms, not on every chunk
2. **Scroll Anchoring**: Auto-scroll to bottom during streaming
3. **Mobile Optimization**: Prevent layout shifts during streaming
4. **Memory Management**: Clear old chunks after message complete

## Testing Streaming Quality

### Expected Behavior
- ✅ Smooth, natural token delivery (not laggy)
- ✅ No visual stuttering or jank
- ✅ Mobile performs as smoothly as desktop
- ✅ Errors are graceful and recoverable
- ✅ Streaming stops cleanly on user interrupt

### Red Flags
- ❌ Chunks arrive in bursts (check buffering)
- ❌ UI freezes during streaming (check render performance)
- ❌ Partial words or broken characters (encoding issue)
- ❌ Connection drops frequently (check keepalive)
- ❌ Memory leaks over multiple conversations

## Security Considerations
- Session-based authentication via HTTP-only cookies
- WebSocket upgrade validates session before accepting
- No sensitive data in WebSocket messages (use HTTPS for login)
- Rate limiting per user ID to prevent abuse

## Monitoring & Debugging
```javascript
// Enable debug logging
localStorage.setItem('debug_websocket', 'true');

// Monitor chunk timing
const chunkTimes = [];
ws.onmessage = (event) => {
  chunkTimes.push(Date.now());
  if (chunkTimes.length > 1) {
    const delta = chunkTimes[chunkTimes.length - 1] - chunkTimes[chunkTimes.length - 2];
    console.log(`Chunk latency: ${delta}ms`);
  }
};
```

## Future Enhancements
- [ ] Compression for faster chunk delivery
- [ ] Multiplexed streams for parallel AI calls
- [ ] Server-sent events (SSE) fallback for restricted networks
- [ ] Binary protocol for voice streaming
