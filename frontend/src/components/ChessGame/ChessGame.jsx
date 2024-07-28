import { useEffect, useState, useContext } from "react";
import { GameContext } from "@context/GameContext";
import { Chess, SQUARES } from "chess.js";
import { Chessboard } from "react-chessboard";
import { GameOverCard } from "@components/GameOverCard";
import { getBotMove } from "@utils/BasicChessBot";

import "./ChessGame.css";

function kingSurroundingSquares(kingSquare){
  let squares = new Set();
  let [file, rank] = kingSquare.split("");
  let fileIndex = "abcdefgh".indexOf(file);
  let rankIndex = "12345678".indexOf(rank);
  for(let i = -1; i <= 1; i++){
    for(let j = -1; j <= 1; j++){
      let newFileIndex = fileIndex + i;
      let newRankIndex = rankIndex + j;
      if(newFileIndex >= 0 && newFileIndex <= 7 && newRankIndex >= 0 && newRankIndex <= 7){
        squares.add("abcdefgh"[newFileIndex] + "12345678"[newRankIndex]);
      }
    }
  }
  return squares;
}

function pawnSquareInFront(pawnSquare, color){
  let squares = new Set();
  //if it's your pawn, light up the squares in front of it
  let [file, rank] = pawnSquare.split("");
  let rankIndex = "12345678".indexOf(rank);
  let direction = color === "w" ? 1 : -1;
  let newRankIndex = rankIndex + direction;
  if(newRankIndex >= 0 && newRankIndex <= 7){
    squares.add(file + "12345678"[newRankIndex]);
  }
    return squares;
}
    

//Get squares to be lit up, for legal moves, your own pieces squares
//pins?
function getLitupSquares(game, orientation) {
  console.log("getLitupSquares triggered");

  const moves = game.moves({ verbose: true });
  let squares = new Set();
  moves.forEach((move) => {
    squares.add(move.to);
  });

  const board = game.board();
  
  board.forEach((row, i) => {
    row.forEach((piece, j) => {
      //If it's your own piece, light it up
      if (piece && piece.color === orientation[0]) {
        let square = SQUARES[8 * i + j];
        squares.add(square);
        if(piece.type === "k"){
          console.log("Your king is at", square);
          //if it's your king, light up all the squares around it even non possible moves
          let surroundingSquares = kingSurroundingSquares(square);
          squares = squares.union(surroundingSquares);
        }else if(piece.type === "p"){
          let squaresInFront = pawnSquareInFront(square, piece.color);
          squares = squares.union(squaresInFront);
        }
      }
    });
  });

  return squares;
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

export function ChessGame() {
  const { currentSettings, status, setStatus } = useContext(GameContext);
  const singlePlayer = currentSettings.mode === "single";

  const [game, setGame] = useState(new Chess());
  const [orientation, setOrientation] = useState(
    singlePlayer ? (Math.random() > 0.5 ? "white" : "black") : currentSettings.playerColor
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
    // console.log("botMove triggered with:", orientation, turn);
    if(playing && singlePlayer){
      const move = getBotMove(g);
      let gameCopy = new Chess(g.fen());
      gameCopy.move(move);
      setGame(gameCopy);
    }
  }

  // On Turn Change
  useEffect(() => {
    console.log("useEffect triggered with turn:", turn);

    if (currentSettings.lightsOut && playing) {
      console.log(getLitupSquares(game, orientation));
      const litupSquares = getLitupSquares(game, orientation);
      console.log("Litup squares:", litupSquares);
    }


    // if it's the computer's turn, make a move
    if (turn !== orientation && singlePlayer) {
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
      const newOrientation = singlePlayer ? (Math.random() > 0.5 ? "white" : "black") : currentSettings.playerColor
      const newGame = new Chess();
      setOrientation(newOrientation);    
      setGame(newGame);
      
      // if it's the computer's turn first, trigger a move
      if (newOrientation === "black" && singlePlayer) {
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
