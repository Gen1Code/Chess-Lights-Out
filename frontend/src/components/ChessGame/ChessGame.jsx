import { useEffect, useState, useContext } from "react";
import { GameContext } from "@context/GameContext";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { GameOverCard } from "@components/GameOverCard";
import { getBotMove } from "@utils/BasicChessBot";

import "./ChessGame.css";


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

export function ChessGame() {
  const { settings, status, setStatus } = useContext(GameContext);
  const [game, setGame] = useState(new Chess());
  const [orientation, setOrientation] = useState(
    settings.mode === "single" ? (Math.random() > 0.5 ? "white" : "black") : settings.playerColor
  );

  const turn = game.turn() === "w" ? "white" : "black";
  const playing = status === "Playing";
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
    if (turn !== orientation || isGameOver || !playing) return;
    makeAMove({
      from: sourceSquare,
      to: targetSquare,
      promotion: "q", // always promote to a queen for simplicity
    });
  }

  function forcegame(){
    let fen = "k7/6Q1/3N4/8/3b3q/8/8/5K2 ";
    if(orientation === "white"){
      fen+="w"
    }else {
      fen+="b";
    }
    fen+=" - - 0 1";
    setGame(new Chess(fen));
  }

  function botMove(g = game) { 
    console.log("botMove triggered with:", orientation, turn);
    if(playing && settings.mode === "single"){
      const move = getBotMove(g);
      let gameCopy = new Chess(g.fen());
      gameCopy.move(move);
      setGame(gameCopy);
    }
  }

  // On Turn Change
  useEffect(() => {
    console.log("useEffect triggered with turn:", turn);
    // if it's the computer's turn, make a move
    if (turn !== orientation && settings.mode === "single") {
      botMove();
    }
  }, [turn]);

  // On Game Over
  useEffect(() => {
    if (isGameOver) {
      console.log("Game over");
      setStatus(gameOverMessage(game));
    }
  }, [isGameOver]);    

  // On Game Start
  useEffect(() => {
    if (status === "Playing") {
      console.log("Game started");
      const newOrientation = settings.mode === "single" ? (Math.random() > 0.5 ? "white" : "black") : settings.playerColor
      const newGame = new Chess();
      setOrientation(newOrientation);    
      setGame(newGame);
      
      // if it's the computer's turn first, trigger a move
      if (newOrientation === "black" && settings.mode === "single") {
        botMove(newGame);
      }
    }
  }, [status]);

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
      {playing === false && <div className="mist-overlay"></div>}
      <GameOverCard
        className="card"
        message={status}
      />
      {process.env.NODE_ENV === 'development' && (
        <button onClick={forcegame} >Force Game</button>
      )}
    </div>
  );
}
