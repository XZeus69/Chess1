const board = document.getElementById("board");
let selectedSquare = null;
let position = {};  // {"e2": "wP"}
const squareMap = "abcdefgh";
function toSquareName(row, col) {
    return squareMap[col] + (8 - row);
}
function fromSquareName(square) {
    const col = squareMap.indexOf(square[0]);
    const row = 8 - parseInt(square[1]);
    return [row, col];
}
const getDifficulty = () => parseInt(document.getElementById("difficulty").value);
const initBoard = () => {
    board.innerHTML = "";
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const square = document.createElement("div");
            square.className = `square ${(r + c) % 2 === 0 ? "white" : "black"}`;
            square.dataset.row = r;
            square.dataset.col = c;
            square.onclick = () => onSquareClick(r, c);
            board.appendChild(square);
        }
    }
    placeInitialPieces();
};
const placeInitialPieces = () => {
    position = {};
    const setup = {
        0: ["bR", "bN", "bB", "bQ", "bK", "bB", "bN", "bR"],
        1: Array(8).fill("bP"),
        6: Array(8).fill("wP"),
        7: ["wR", "wN", "wB", "wQ", "wK", "wB", "wN", "wR"]
    };
    for (let r in setup) {
        for (let c = 0; c < 8; c++) {
            const piece = setup[r][c];
            const square = document.querySelector(`.square[data-row='${r}'][data-col='${c}']`);
            const img = document.createElement("div");
            img.className = "piece";
            img.style.backgroundImage = `url('/static/img/pieces/${piece}.png')`;
            square.innerHTML = "";
            square.appendChild(img);
            position[toSquareName(parseInt(r), c)] = piece;
        }
    }
};
function onSquareClick(row, col) {
    const square = toSquareName(row, col);
    clearHighlights();
    if (selectedSquare === null) {
        if (position[square] && position[square].startsWith("w")) {
            selectedSquare = square;
            highlightSquare(square, "yellow");
        }
    } else {
        const move = selectedSquare + square;
        sendMoveToServer(move);
        selectedSquare = null;
    }
}
function highlightSquare(square, color) {
    const [r, c] = fromSquareName(square);
    const sqDiv = document.querySelector(`.square[data-row='${r}'][data-col='${c}']`);
    sqDiv.style.boxShadow = `inset 0 0 0 3px ${color}`;
}
function clearHighlights() {
    document.querySelectorAll(".square").forEach(sq => {
        sq.style.boxShadow = "";
    });
}
function sendMoveToServer(move) {
    fetch("/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ move, difficulty: getDifficulty() })
    })
    .then(res => res.json())
    .then(data => {
        console.log("Server says:", data);
        if (data.status === "checkmate") {
            updateBoard(move, data.ai_move);
            setTimeout(() => showGameOver("Checkmate! You lost."), 600);
        } else if (data.status === "draw") {
            updateBoard(move, data.ai_move);
            setTimeout(() => showGameOver("It's a draw!"), 600);
        } else if (data.status === "ok") {
            updateBoard(move, data.ai_move);
        } else if (data.status === "invalid") {
            alert("Invalid move.");
        } else {
            alert("Error: " + data.message);
        }
    });
}
function updateBoard(playerMove, aiMove) {
    movePiece(playerMove.slice(0, 2), playerMove.slice(2, 4));
    setTimeout(() => {
        movePiece(aiMove.slice(0, 2), aiMove.slice(2, 4));
    }, 500);
}
function movePiece(from, to) {
    const [r1, c1] = fromSquareName(from);
    const [r2, c2] = fromSquareName(to);
    const fromSq = document.querySelector(`.square[data-row='${r1}'][data-col='${c1}']`);
    const toSq = document.querySelector(`.square[data-row='${r2}'][data-col='${c2}']`);
    const pieceDiv = fromSq.querySelector(".piece");
    if (!pieceDiv) return;
    toSq.innerHTML = "";
    toSq.appendChild(pieceDiv);
    fromSq.innerHTML = "";
    position[to] = position[from];
    delete position[from];
}
function showGameOver(text) {
    const banner = document.getElementById("game-over");
    banner.textContent = text;
    banner.style.display = "block";
}
document.getElementById("reset").onclick = () => {
    fetch("/fen").then(() => {
        location.reload();
    });
};
document.addEventListener("DOMContentLoaded", () => {
    initBoard();
    const slider = document.getElementById("difficulty");
    slider.addEventListener("input", () => {
        document.getElementById("levelDisplay").innerText = slider.value;
    });
});