import WebSocket from 'ws';

const ws = new WebSocket('ws://localhost:5000/ws', {
  headers: {
    'Cookie': 'connect.sid=s%3Afake-session.signature'
  }
});

ws.on('open', () => {
  console.log('WebSocket opened successfully!');
  ws.close();
});

ws.on('error', (err) => {
  console.log('WebSocket error:', err.message);
});

ws.on('close', (code, reason) => {
  console.log('WebSocket closed with code:', code, 'reason:', reason.toString());
});
