import { useState } from 'react';
import reactLogo from '@assets/react.svg';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import './App.css';

export function App() {
  const [game, setGame] = useState(new Chess());

  function makeAMove(move) {
    const gameCopy = new Chess(game.fen());
    const result = gameCopy.move(move);
    setGame(gameCopy);
    return result; // null if the move was illegal, the move object if the move was legal
  }
  function onDrop(sourceSquare, targetSquare) {
    const move = makeAMove({
      from: sourceSquare,
      to: targetSquare,
      promotion: "q", // always promote to a queen for example simplicity
    });

    // illegal move
    if (move === null) return false;
    return true;
  }

  return (
    <>
      <h1>Chess Lights Out</h1>
      <Chessboard position={game.fen()} onPieceDrop={onDrop} />
      <div className="card">
      </div>
    </>
  );
}