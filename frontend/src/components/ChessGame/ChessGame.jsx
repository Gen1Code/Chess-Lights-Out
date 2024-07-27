import { useEffect, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { GameOverCard } from "@components/GameOverCard";
import { getBotMove } from "@utils/BasicChessBot";
import { ChessSettings } from "@components/ChessSettings";

import "./ChessGame.css";

function getRandomMove(game) {
  let possibleMoves = game.moves();
  return possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
}

function gameOverMessage(game) {
  if (game.isCheckmate()) {
    return "Checkmate!";
  } else if (game.isInsufficientMaterial()) {
    return "Insufficient Material!";
  } else if (game.isStalemate()) {
    return "Stalemate!";
  } else if (game.isThreefoldRepetition()) {
    return "Threefold Repetition!";
  } else if (game.isDraw()) {
    return "50 Move Rule!";
  } else {
    console.error("Game over but no reason found");
    return "Game Over!";
  }
}

export function ChessGame({ settings }) {
  const [game, setGame] = useState(new Chess());
  const [orientation, setOrientation] = useState(
    settings.mode === "single" ? (Math.random() > 0.5 ? "white" : "black") : settings.playerColor
  );
  const [statusMessage, setStatusMessage] = useState("");

  const turn = game.turn() === "w" ? "white" : "black";
  const isGameOver = game.isGameOver();

  function makeAMove(move) {
    const gameCopy = new Chess(game.fen());
    try {
      gameCopy.move(move);
    } catch (e) {
      console.log("Invalid move", move);
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
    setOrientation(Math.random() > 0.5 ? "white" : "black");
    setGame(new Chess());
  }

  useEffect(() => {
    if (isGameOver) {
      console.log("Game over");
      setStatusMessage(gameOverMessage(game));
    }
  }, [isGameOver]);

  useEffect(() => {
    // if it's the computer's turn, make a move
    if (settings.mode === "single" && turn !== orientation && !isGameOver) {
      (async () => {
        const move = await getBotMove(game);
        makeAMove(move);
      })();
    }
  }, [turn, isGameOver]);

  useEffect(() => {
    console.log("Settings changed", settings);
  }, [settings]);

  return (
    <div className="chessboard">
      <Chessboard
        className="board"
        position={game.fen()}
        onPieceDrop={onDrop}
        boardOrientation={orientation}
        isDraggablePiece={({ piece }) => piece[0] === orientation[0]}
        arePiecesDraggable={!isGameOver}
      />
      <GameOverCard
        className="card"
        message={statusMessage}
        onClickReset={resetGame}
        isGameOver={isGameOver}
      />
    </div>
  );
}
