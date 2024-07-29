import { useEffect, useState, useContext } from "react";
import { GameContext } from "@context/GameContext";
import { Chess, SQUARES } from "chess.js";
import { Chessboard } from "react-chessboard";
import { GameOverCard } from "@components/GameOverCard";
import { getBotMove } from "@utils/BasicChessBot";
import { OriginShiftMaze } from "@utils/OriginShiftMaze";

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
    

function getLitupSquares(game, orientation) {
  // console.log("getLitupSquares triggered");

  const moves = game.moves({ verbose: true });
  let squares = new Set();
  moves.forEach((move) => {
    squares.add(move.to);
  });

  const board = game.board();
  
  board.forEach((row, i) => {
    row.forEach((piece, j) => {
      if (piece && piece.color === orientation[0]) {
        let square = SQUARES[8 * i + j];
        //If it's your own piece, light it up
        squares.add(square);
        if(piece.type === "k"){
          //if it's your king, light up all the squares around it even non possible moves
          let surroundingSquares = kingSurroundingSquares(square);
          squares = squares.union(surroundingSquares);
        }else if(piece.type === "p"){
          // if it's your pawn, light up the square in front of it
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

function findKing(game, color) {
  let kingSquare = null;
  const board = game.board();
  // console.log("findKing triggered with color:", color);
  // console.log("board", board);
  board.forEach((row, i) => {
    row.forEach((piece, j) => {
      if (piece && piece.type === "k" && piece.color === color) {
        kingSquare = SQUARES[8 * i + j];
      }
    });
  });
  return kingSquare;
}

export function ChessGame() {
  const { currentSettings, status, setStatus } = useContext(GameContext);
  const singlePlayer = currentSettings.mode === "Single";

  const [game, setGame] = useState(new Chess());
  const [orientation, setOrientation] = useState(
    singlePlayer ? (Math.random() > 0.5 ? "white" : "black") : currentSettings.playerColor
  );
  const [maze, setMaze] = useState(new OriginShiftMaze());

  const [squareStyles, setSquareStyles] = useState({});
  const [checkStyle, setCheckStyle] = useState({});

  const turn = game.turn() === "w" ? "white" : "black";
  const playing = status === "Playing";
  const inCheck = game.inCheck() && turn === orientation;
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
      if (!move) return;
      let gameCopy = new Chess(g.fen());
      gameCopy.move(move);
      setGame(gameCopy);
    }
  }

  function styleSquares_Maze(borders){
    console.log("styleSquares_Maze triggered");
    console.log("borders", borders);

    if(currentSettings.maze === "Off"){
      setSquareStyles({});
      return;
    }

    if (orientation === "black"){
      //flip the maze for black player
      let newBorders = {};
      Object.keys(borders).forEach((squareIndex) => {
        newBorders[squareIndex] = new Set();
        if(borders[squareIndex].has("top")){
          newBorders[squareIndex].add("bottom");
        }
        if(borders[squareIndex].has("bottom")){
          newBorders[squareIndex].add("top");
        }
        if(borders[squareIndex].has("left")){
          newBorders[squareIndex].add("right");
        }
        if(borders[squareIndex].has("right")){
          newBorders[squareIndex].add("left");
        }
      });
      borders = newBorders;
    }

    let styles = {};
    Object.keys(borders).forEach((squareIndex) => {
      let square = SQUARES[squareIndex];
      let style = {boxSizing: "border-box"};
      if(borders[squareIndex].has("top")){
        style.borderTop = "3px solid black";
      }
      if(borders[squareIndex].has("bottom")){
        style.borderBottom = "3px solid black";
      }
      if(borders[squareIndex].has("left")){
        style.borderLeft = "3px solid black";
      }
      if(borders[squareIndex].has("right")){
        style.borderRight = "3px solid black";
      }
      styles[square] = style;
    });

    console.log("styles", styles);
    setSquareStyles(styles);

  }


  function styleSquares(litupSquares) {
    console.log("styleSquares triggered");

    if(currentSettings.lightsOut === false || playing === false){
      setSquareStyles({});
      return;
    }

    let allSquares = new Set(SQUARES);

    litupSquares.forEach((square) => {
      allSquares.delete(square);
    });

    let styles = {};
    allSquares.forEach((square) => {
      styles[square] = { 
        //Make only child element invisible
        contentVisibility: "hidden",
        backgroundColor: "rgb(0, 0, 0)",        
       };
    });


    console.log("styles", styles);
    setSquareStyles(styles);
  }

  // On Turn Change
  useEffect(() => {
    console.log("useEffect triggered with turn:", turn);

    if(playing){
      // if maze is in shift, make shifts
      if(currentSettings.maze === "Shift"){
        console.log("Maze:", maze.tree);
        //console.log(maze.getMazeBorders());

        maze.scramble(2); // 2 shifts per turn
        console.log("Maze:", maze.tree);
        //console.log(maze.getMazeBorders());
        styleSquares_Maze(maze.getMazeBorders());
      }

      if (currentSettings.lightsOut){
          const litupSquares = getLitupSquares(game, orientation);
          styleSquares(litupSquares);
          console.log("Litup squares:", litupSquares);
      }

      // if it's the computer's turn, make a move
      if(turn !== orientation && singlePlayer){
        botMove();
      }
    }  

  }, [turn]);

  // if king is in check, style the square
  useEffect(() => {
    // console.log("useEffect triggered with inCheck:", inCheck);
    let styles = {};
    if (inCheck) {
      const kingSquare = findKing(game, orientation[0]);
      styles[kingSquare] = squareStyles[kingSquare] || {};
      styles[kingSquare].backgroundColor = "rgba(255,0,0,0.25)";
    }
    setCheckStyle(styles);
  }, [inCheck]);

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
      const newMaze = new OriginShiftMaze();

      setOrientation(newOrientation);    
      setGame(newGame);
      setMaze(newMaze);

      //TODO: Maze stuff

      styleSquares(getLitupSquares(newGame, newOrientation));
      
      // if it's the computer's turn first, trigger a move
      if (newOrientation === "black" && singlePlayer) {
        botMove(newGame);
      }
    }else{
      setSquareStyles({});
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
        customSquareStyles={{...squareStyles, ...checkStyle}}
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
