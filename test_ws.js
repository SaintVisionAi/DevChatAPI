const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:5000/ws', {
  headers: {
    'Cookie': 'connect.sid=fake-session-id'
  }
});

ws.on('open', () => {
  console.log('WebSocket opened');
  ws.send(JSON.stringify({ type: 'test' }));
});

ws.on('error', (err) => {
  console.log('WebSocket error:', err.message);
});

ws.on('close', (code, reason) => {
  console.log('WebSocket closed:', code, reason);
});

setTimeout(() => {
  ws.close();
  process.exit(0);
}, 2000);
