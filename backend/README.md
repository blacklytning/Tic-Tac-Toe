# Tic-Tac-Toe Backend

Minimal Node.js + Socket.IO server for a 2-player Tic-Tac-Toe game.

Quick start

1. Change to the backend folder:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Start the server:

```bash
npm start
```

Server runs on port `3000` by default. Socket.IO endpoint is available at the same origin.

Messages (socket.io)
- `join` { gameId?, name? } -> server replies `joined` and broadcasts `players` and `start` when two players present
- `move` { gameId, index } -> server validates move and broadcasts `state` (board, turn, winner/draw)
- `reset` { gameId } -> server resets the board and broadcasts `start`

This is intentionally minimal — use it for local testing or integrate with the existing front-end (`app.js` / `index.html`).
