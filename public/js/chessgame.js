document.addEventListener("DOMContentLoaded", () => {
  const socket = io();
  const chess = new Chess();
  const boardElement = document.querySelector(".chessboard");

  let draggedPiece = null;
  let sourceSquare = null;
  let playerRole = null;

  const renderBoard = () => {
    const board = chess.board();
    boardElement.innerHTML = "";
    board.forEach((row, rowindex) => {
      row.forEach((square, squareindex) => {
        const squareElement = document.createElement("div");
        squareElement.classList.add(
          "square",
          (rowindex + squareindex) % 2 === 0 ? "light" : "dark"
        );
        squareElement.dataset.row = rowindex;
        squareElement.dataset.col = squareindex;
        if (square) {
          let pieceElement;
          if (square.color === "b" && square.type === "p") {
            pieceElement = document.createElement("img");
            pieceElement.src = getPieceUnicode(square);
          } else {
            pieceElement = document.createElement("div");
            pieceElement.innerText = getPieceUnicode(square);
          }
          pieceElement.classList.add(
            "piece",
            square.color === "w" ? "white-piece" : "black-piece"
          );
          pieceElement.draggable = playerRole === square.color;

          pieceElement.addEventListener("dragstart", (e) => {
            if (pieceElement.draggable) {
              draggedPiece = pieceElement;
              sourceSquare = { row: rowindex, col: squareindex };
              e.dataTransfer.setData("text/plain", "");
            }
          });
          pieceElement.addEventListener("dragend", () => {
            draggedPiece = null;
            sourceSquare = null;
          });

          squareElement.appendChild(pieceElement);
        }

        squareElement.addEventListener("dragover", (e) => {
          e.preventDefault();
        });
        squareElement.addEventListener("drop", () => {
          if (draggedPiece) {
            const targetSquare = {
              row: parseInt(squareElement.dataset.row),
              col: parseInt(squareElement.dataset.col),
            };
            handleMove(sourceSquare, targetSquare);
          }
        });
        boardElement.appendChild(squareElement);
      });
    });
    if (playerRole === "b") {
      boardElement.classList.add("flipped");
    } else {
      boardElement.classList.remove("flipped");
    }
  };

  const handleMove = (source, target) => {
    const move = {
      from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
      to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
      promotion: "q",
    };
    console.log("Generated move:", move);
    const result = chess.move(move);
    if (result) {
      socket.emit("move", move);
    } else {
      console.log("Invalid move:", move);
    }
    renderBoard();
  };

  const getPieceUnicode = (piece) => {
    const unicodePieces = {
      p: "https://i.ibb.co/zmCcgzj/blacpawn-removebg-preview.png", // Path to your black pawn image in the public folder
      P: "♙",
      r: "♜",
      R: "♖",
      n: "♞",
      N: "♘",
      b: "♝",
      B: "♗",
      q: "♛",
      Q: "♕",
      k: "♚",
      K: "♔",
    };
    return piece.color === "w"
      ? unicodePieces[piece.type.toUpperCase()]
      : unicodePieces[piece.type.toLowerCase()];
  };

  socket.on("playerRole", (role) => {
    playerRole = role;
    renderBoard();
  });

  socket.on("spectatorRole", () => {
    playerRole = null;
    renderBoard();
  });

  socket.on("boardState", (fen) => {
    chess.load(fen);
    renderBoard();
  });

  socket.on("move", (move) => {
    console.log("Move received:", move);
    chess.move(move);
    renderBoard();
  });

  renderBoard();
});
