const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());
app.get("/", (req, res) =>
    res.json({ ok: true, message: "Tic-Tac-Toe server" }),
);

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

const games = {};

function createGame(gameId) {
    return {
        players: [],
        sockets: {},
        board: Array(9).fill(null),
        turn: "X",
        status: "waiting",
    };
}

function checkWin(board) {
    const lines = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6],
    ];
    for (const [a, b, c] of lines) {
        if (board[a] && board[a] === board[b] && board[a] === board[c])
            return board[a];
    }
    return null;
}

io.on("connection", (socket) => {
    socket.on("join", ({ gameId = "default", name = "Player" } = {}) => {
        if (!games[gameId]) games[gameId] = createGame(gameId);
        const game = games[gameId];

        if (game.players.length >= 2) {
            socket.emit("full", { message: "Room is full" });
            return;
        }

        const symbol = game.players.length === 0 ? "X" : "O";
        const player = { id: socket.id, name, symbol };
        game.players.push(player);
        game.sockets[socket.id] = socket;
        socket.join(gameId);
        socket.emit("joined", { gameId, symbol });
        io.to(gameId).emit(
            "players",
            game.players.map((p) => ({ name: p.name, symbol: p.symbol })),
        );

        if (game.players.length === 2) {
            game.status = "playing";
            game.board = Array(9).fill(null);
            game.turn = "X";
            io.to(gameId).emit("start", { board: game.board, turn: game.turn });
        }
    });

    socket.on("move", ({ gameId = "default", index } = {}) => {
        const game = games[gameId];
        if (!game || game.status !== "playing") return;
        const player = game.players.find((p) => p.id === socket.id);
        if (!player) return;
        if (player.symbol !== game.turn) return;
        if (typeof index !== "number" || index < 0 || index > 8) return;
        if (game.board[index]) return;

        game.board[index] = player.symbol;
        const winner = checkWin(game.board);
        if (winner) {
            game.status = "finished";
            io.to(gameId).emit("state", {
                board: game.board,
                turn: game.turn,
                winner,
            });
            return;
        }
        if (game.board.every(Boolean)) {
            game.status = "finished";
            io.to(gameId).emit("state", {
                board: game.board,
                turn: game.turn,
                draw: true,
            });
            return;
        }

        game.turn = game.turn === "X" ? "O" : "X";
        io.to(gameId).emit("state", { board: game.board, turn: game.turn });
    });

    socket.on("reset", ({ gameId = "default" } = {}) => {
        const game = games[gameId];
        if (!game) return;
        game.board = Array(9).fill(null);
        game.turn = "X";
        game.status = game.players.length === 2 ? "playing" : "waiting";
        io.to(gameId).emit("start", { board: game.board, turn: game.turn });
    });

    socket.on("disconnect", () => {
        for (const [gameId, game] of Object.entries(games)) {
            const idx = game.players.findIndex((p) => p.id === socket.id);
            if (idx !== -1) {
                game.players.splice(idx, 1);
                delete game.sockets[socket.id];
                game.status = "waiting";
                io.to(gameId).emit(
                    "players",
                    game.players.map((p) => ({
                        name: p.name,
                        symbol: p.symbol,
                    })),
                );
                io.to(gameId).emit("left", { message: "Opponent left" });
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () =>
    console.log(`Tic-Tac-Toe server listening on ${PORT}`),
);
