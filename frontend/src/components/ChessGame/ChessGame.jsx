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
  const [orientation, _] = useState(
    mode === "single" ? (Math.random() > 0.5 ? "white" : "black") : playerColor
  );

  const turn = game.turn() === "w" ? "white" : "black";
  const isGameOver = game.isGameOver();

  function makeAMove(move) {
    const gameCopy = new Chess(game.fen());
    const result = gameCopy.move(move);
    setGame(gameCopy);
    return result;
  }

  function onDrop(sourceSquare, targetSquare) {
    if (turn !== orientation || isGameOver) return false;
    const move = makeAMove({
      from: sourceSquare,
      to: targetSquare,
      promotion: "q", // always promote to a queen for simplicity
    });

    // illegal move
    if (move === null) return false;
    return true;
  }

  useEffect(() => {
    console.log("Turn is", turn);
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
      />
    </>
  );
}
