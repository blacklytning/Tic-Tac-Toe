let boxes = document.querySelectorAll(".box");
let reset_button = document.querySelector("#reset-button");
let newGame_button = document.querySelector("#new-button");
let msgContainer = document.querySelector(".msg-container");
let msg = document.querySelector("#msg");
let draw = document.querySelector("#draw");

// Online UI elements
let join_button = document.querySelector("#join-button");
let gameIdInput = document.querySelector("#game-id");
let nameInput = document.querySelector("#player-name");
let statusLabel = document.querySelector("#status");
let assignedSymbolLabel = document.querySelector("#assigned-symbol");

let turnO = true;
let count = 0;

// Online state
let socket = null;
let online = false;
let mySymbol = null;
let myGameId = "default";

const winPatterns = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
];

const resetGame = () => {
    turnO = true;
    enableBoxes();
    msgContainer.classList.add("hide");
    count = 0;
    // If online, ask server to reset
    if (online && socket) socket.emit("reset", { gameId: myGameId });
};

boxes.forEach((box, index) => {
    box.addEventListener("click", () => {
        if (online && socket) {
            // Online: emit move and wait for server state
            if (!mySymbol) return;
            // only allow click when it's our symbol's turn
            // server enforces rules, but client UX disallows premature clicks
            if (
                assignedSymbolLabel.dataset.turn &&
                assignedSymbolLabel.dataset.turn !== mySymbol
            )
                return;
            socket.emit("move", { gameId: myGameId, index });
            return;
        }

        // Offline/local behavior (existing)
        count += 1;
        if (count === 9 && !isWinner) {
            drawWinner();
        }
        if (turnO) {
            box.innerText = "O";
            turnO = false;
        } else {
            box.innerText = "X";
            turnO = true;
        }
        box.disabled = true;
        checkWinner();
    });
});

const disableBoxes = () => {
    for (let box of boxes) {
        box.disabled = true;
    }
};

const enableBoxes = () => {
    for (let box of boxes) {
        box.disabled = false;
        box.innerText = "";
    }
};

const drawWinner = () => {
    msg.innerText = `It's a Draw!`;
    msgContainer.classList.remove("hide");
    disableBoxes();
};

const showWinner = (winner) => {
    msg.innerText = `Congratulations! Winner is ${winner}`;
    msgContainer.classList.remove("hide");
    disableBoxes();
};

const checkWinner = () => {
    for (let pattern of winPatterns) {
        let pos1Val = boxes[pattern[0]].innerText;
        let pos2Val = boxes[pattern[1]].innerText;
        let pos3Val = boxes[pattern[2]].innerText;

        if (pos1Val !== "" && pos2Val !== "" && pos3Val !== "") {
            if (pos1Val === pos2Val && pos2Val === pos3Val) {
                showWinner(pos1Val);
            }
        }
    }
};

let isWinner = checkWinner();

newGame_button.addEventListener("click", resetGame);
reset_button.addEventListener("click", resetGame);

// --- Online logic ---
function connectToServer(url = "https://tic-tac-toe-tzek.onrender.com") {
    socket = io(url, {
        transports: ["websocket"]
    });

    socket.on("connect", () => {
        statusLabel.innerText = "Connected";
        statusLabel.style.color = "green";
        online = true;
    });

    socket.on("joined", ({ gameId, symbol }) => {
        myGameId = gameId || "default";
        mySymbol = symbol;
        assignedSymbolLabel.innerText = `You: ${mySymbol}`;
    });

    socket.on("players", (players) => {
        // display players if desired
        // players: [{name, symbol}, ...]
    });

    socket.on("start", ({ board, turn }) => {
        // initialize board and set turn
        for (let i = 0; i < 9; i++) {
            boxes[i].innerText = board[i] || "";
            boxes[i].disabled = !!board[i] || (mySymbol && mySymbol !== turn);
        }
        assignedSymbolLabel.dataset.turn = turn;
        assignedSymbolLabel.innerText = `You: ${mySymbol} | Turn: ${turn}`;
        msgContainer.classList.add("hide");
    });

    socket.on("state", ({ board, turn, winner, draw }) => {
        for (let i = 0; i < 9; i++) {
            boxes[i].innerText = board[i] || "";
            boxes[i].disabled = !!board[i] || (mySymbol && mySymbol !== turn);
        }
        assignedSymbolLabel.dataset.turn = turn;
        assignedSymbolLabel.innerText = `You: ${mySymbol} | Turn: ${turn}`;
        if (winner) {
            msg.innerText = `Winner: ${winner}`;
            msgContainer.classList.remove("hide");
        } else if (draw) {
            msg.innerText = `It's a draw!`;
            msgContainer.classList.remove("hide");
        }
    });

    socket.on("full", ({ message }) => {
        alert(message || "Room is full");
    });

    socket.on("left", ({ message }) => {
        // opponent left
        statusLabel.innerText = "Opponent left";
        msg.innerText = message || "Opponent left";
        msgContainer.classList.remove("hide");
    });

    socket.on("disconnect", () => {
        statusLabel.innerText = "Disconnected";
        statusLabel.style.color = "red";
        online = false;
        mySymbol = null;
        assignedSymbolLabel.innerText = "";
    });
}

join_button.addEventListener("click", () => {
    if (!socket) connectToServer("https://tic-tac-toe-tzek.onrender.com");
    const gameId = gameIdInput.value || "default";
    const name = nameInput.value || "Player";
    socket.emit("join", { gameId, name });
    statusLabel.innerText = `Joined ${gameId}`;
    myGameId = gameId;
});
