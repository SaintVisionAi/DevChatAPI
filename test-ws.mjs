// Simple WebSocket test script
import WebSocket from 'ws';

const ws = new WebSocket('ws://localhost:5000/ws');

ws.on('open', () => {
  console.log('WebSocket connected');
  
  // Send a chat message
  const message = {
    type: 'chat',
    message: 'Hello, test message',
    model: 'gpt-4o-mini',
    mode: 'chat'
  };
  
  console.log('Sending message:', message);
  ws.send(JSON.stringify(message));
});

ws.on('message', (data) => {
  const msg = JSON.parse(data);
  console.log('Received:', msg);
  
  if (msg.type === 'done') {
    console.log('Response complete');
    ws.close();
  }
});

ws.on('error', (error) => {
  console.error('WebSocket error:', error);
});

ws.on('close', () => {
  console.log('WebSocket closed');
  process.exit(0);
});

setTimeout(() => {
  console.log('Timeout after 10 seconds');
  ws.close();
  process.exit(1);
}, 10000);