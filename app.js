let boxes = document.querySelectorAll('.box');
let reset_button = document.querySelector("#reset-button");
let newGame_button = document.querySelector("#new-button");
let msgContainer = document.querySelector(".msg-container");
let msg = document.querySelector("#msg");
let draw = document.querySelector("#draw");

let turnO = true;
let count = 0;

let isWinner = checkWinner();

const winPatterns = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
];

const resetGame = () => {
    turnO = true;
    enableBoxes();
    msgContainer.classList.add("hide");
    count = 0;
}

boxes.forEach(box => {
    box.addEventListener('click', () => { //for making buttons clickable
        count += 1;
         if (count === 9 && !isWinner) {
            drawWinner();
            }
        if (turnO) {
            box.innerText = "O"; //text on each button
            turnO = false;
        }
        else {
            box.innerText = "X";
            turnO = true;
        }
        box.disabled = true; //when you double click a box, X changes to O and vice versa. hence this prevents.

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
}

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

        if (pos1Val !== "" && pos2Val !== "" && pos3Val !== "" ) {
            if(pos1Val === pos2Val && pos2Val === pos3Val) {
               showWinner(pos1Val);
            }
        }
    }
};

newGame_button.addEventListener('click', resetGame);
reset_button.addEventListener('click', resetGame);