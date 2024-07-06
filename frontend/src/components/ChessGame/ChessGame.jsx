import { useEffect, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { ApiRequest } from "@components/ApiRequest";

function getRandomMove(game) {
  let possibleMoves = game.moves();
  return possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
}  

export function ChessGame({ mode = "single", playerColor = "" }) {
  const [game, setGame] = useState(new Chess());
  const [orientation, setOrientation] = useState(
    mode === "single" ? (Math.random() > 0.5 ? "white" : "black") : playerColor
  );

  const turn = game.turn() === "w" ? "white" : "black";
  const isGameOver = game.isGameOver();

  function makeAMove(move) {
    const gameCopy = new Chess(game.fen());
    try {
      gameCopy.move(move);
    } catch (e) {
      console.error("Invalid move", move);
      return;
    }
    setGame(gameCopy);
  }

  function onDrop(sourceSquare, targetSquare) {
    if (turn !== orientation || isGameOver) return;
    makeAMove({
      from: sourceSquare,
      to: targetSquare,
      promotion: "q", // always promote to a queen for simplicity
    });
  }

  function resetGame() {
    setGame(new Chess());
    setOrientation(Math.random() > 0.5 ? "white" : "black");
  }

  useEffect(() => {
    if (isGameOver) {
      console.log("Game over");
      //Sleep for 10 seconds before resetting the game
      setTimeout(() => {
        resetGame();
      }, 2000);
    }
  }, [isGameOver]);

  useEffect(() => {
    // if it's the computer's turn, make a move
    if (mode === "single" && turn !== orientation && !isGameOver) {
      const move = getRandomMove(game);
      makeAMove(move);
    }
  }, [turn]);

  return (
    <>
      <Chessboard
        position={game.fen()}
        onPieceDrop={onDrop}
        boardOrientation={orientation}
        isDraggablePiece={({ piece }) => piece[0] === orientation[0]}
        arePiecesDraggable={!isGameOver}
      />
    </>
  );
}
