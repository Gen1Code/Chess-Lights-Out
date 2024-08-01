import { useEffect, useState, useContext } from "react";
import { GameContext } from "@context/GameContext";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { GameOverCard } from "@components/GameOverCard";
import { getBotMove } from "@utils/BasicChessBot";
import {
  getRandomMaze,
  scramble,
  getMazeBorders,
  validMoveInMaze,
} from "@utils/OriginShiftMaze";
import {
  pawnSquareInFront,
  kingSurroundingSquares,
  gameOverMessage,
  findKing,
  SQUARES,
} from "@utils/ChessUtils";
import { socket } from "@utils/socket";

import "./ChessGame.css";

//Bug/Feature?
//Check in Maze has side effects due to .moves() of chess.js
// side effects are checking through walls and "false" pins being created

function getLitupSquares(game, orientation) {
  // console.log("getLitupSquares triggered");
  //Make it your turn (done for moves function to work properly)
  if (game.turn() !== orientation[0]) {
    let splitFen = game.fen().split(" ");
    splitFen[1] = splitFen[1] === "w" ? "b" : "w";
    game = new Chess(splitFen.join(" "));
  }

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
        if (piece.type === "k") {
          //if it's your king, light up all the squares around it even non possible moves
          let surroundingSquares = kingSurroundingSquares(square);
          squares = squares.union(surroundingSquares);
        } else if (piece.type === "p") {
          // if it's your pawn, light up the square in front of it
          let squaresInFront = pawnSquareInFront(square, piece.color);
          squares = squares.union(squaresInFront);
        }
      }
    });
  });

  //If you are in check light up the checking pieces (change to .attackers() when new chess.js npm package is released)
  if (game.inCheck()) {
    let lastMove = game.pgn().split(" ").pop();
    //second to last and third to last is the position moved to
    let checkingPiece =
      lastMove[lastMove.length - 3] + lastMove[lastMove.length - 2];
    squares.add(checkingPiece);
  }

  return squares;
}

export function ChessGame() {
  const { currentSettings, status, setStatus } = useContext(GameContext);
  const singlePlayer = currentSettings.mode === "Single";

  const [game, setGame] = useState(new Chess());
  const [orientation, setOrientation] = useState(
    singlePlayer
      ? Math.random() > 0.5
        ? "white"
        : "black"
      : currentSettings.playerColor
  );

  const [maze, setMaze] = useState(() => getRandomMaze());

  const [squareStyles, setSquareStyles] = useState({});
  const [checkStyle, setCheckStyle] = useState({});

  const turn = game.turn() === "w" ? "white" : "black";
  const playing = status === "Playing";
  const inCheck = game.inCheck() && turn === orientation;
  const mazeIsOn = currentSettings.maze !== "Off";
  const isGameOver = mazeIsOn
    ? detctGameOverMaze(game, maze)
    : game.isGameOver();

  function detctGameOverMaze(game, maze) {
    if (!playing) return true;

    let moves = game.moves({ verbose: true });
    let movesRemaining = [];
    // console.log("valid moves", moves);
    moves.forEach((move) => {
      if (validMoveInMaze(maze, move)) {
        movesRemaining.push(move);
      }
    });
    // console.log("valid moves after maze", movesRemaining);
    if (movesRemaining.length === 0) {
      return true;
    }
    return false;
  }

  function makeAMove(move) {
    const gameCopy = new Chess();
    gameCopy.loadPgn(game.pgn());

    console.log("Move made", move);
    try {
      gameCopy.move(move);
    } catch (e) {
      console.log("Invalid move", move);
      console.error(e);
      return;
    }
    setGame(gameCopy);
  }

  function onDrop(sourceSquare, targetSquare, piece) {
    if (turn !== orientation || isGameOver || !playing) return;

    let move = {
      color: piece[0],
      from: sourceSquare,
      to: targetSquare,
      piece: piece[1].toLowerCase(),
      promotion: "q", // always promote to a queen for simplicity
    };

    // check if the move is legal
    if (mazeIsOn) {
      if (!validMoveInMaze(maze, move)) {
        console.log("Invalid move in maze");
        console.log("Move", move);
        return;
      }
    }

    makeAMove(move);
  }

  //Dev testing functions (remove when done)
  function forcegame() {
    let fen = "k7/6Q1/3N4/8/3b3q/8/8/5K2 ";
    if (orientation === "white") {
      fen += "w";
    } else {
      fen += "b";
    }
    fen += " - - 0 1";
    setGame(new Chess(fen));
  }
  function shiftMaze() {
    setMaze(scramble(maze, 400));
  }

  function botMove(g = game) {
    // console.log("botMove triggered with:", orientation, turn, mazeIsOn);
    if (playing && singlePlayer) {
      let mazeCopy = maze;
      if (!mazeIsOn){
        mazeCopy = null;
      }
      const move = getBotMove(g, mazeCopy);
      if (!move) return;
      let gameCopy = new Chess();
      gameCopy.loadPgn(g.pgn());
      gameCopy.move(move);
      setGame(gameCopy);
    }
  }

  function styleForMaze(styles, borders) {
    //flip the maze for black player
    if (orientation === "black") {
      let newBorders = {};
      Object.keys(borders).forEach((squareIndex) => {
        newBorders[squareIndex] = new Set();
        if (borders[squareIndex].has("top")) {
          newBorders[squareIndex].add("bottom");
        }
        if (borders[squareIndex].has("bottom")) {
          newBorders[squareIndex].add("top");
        }
        if (borders[squareIndex].has("left")) {
          newBorders[squareIndex].add("right");
        }
        if (borders[squareIndex].has("right")) {
          newBorders[squareIndex].add("left");
        }
      });
      borders = newBorders;
    }

    Object.keys(borders).forEach((squareIndex) => {
      let square = SQUARES[squareIndex];
      styles[square].boxSizing = "border-box";

      if (borders[squareIndex].has("top")) {
        styles[square].borderTop = "3px solid firebrick";
      }
      if (borders[squareIndex].has("bottom")) {
        styles[square].borderBottom = "3px solid firebrick";
      }
      if (borders[squareIndex].has("left")) {
        styles[square].borderLeft = "3px solid firebrick";
      }
      if (borders[squareIndex].has("right")) {
        styles[square].borderRight = "3px solid firebrick";
      }
    });
    // console.log("styles:", styles);

    return styles;
  }

  function styleForLightsOut(styles, litupSquares) {
    let squares = new Set(SQUARES);

    //Remove the squares that are lit up
    litupSquares.forEach((square) => {
      squares.delete(square);
    });

    squares.forEach((square) => {
      //Make child element invisible and background dark
      styles[square].contentVisibility = "hidden";
      styles[square].backgroundColor = "rgb(20, 20, 20)";
    });

    return styles;
  }

  function styleSquares(litupSquares, borders) {
    // console.log("styleSquares triggered");

    let styles = {};
    let allSquares = new Set(SQUARES);

    allSquares.forEach((square) => {
      styles[square] = {};
    });

    if (currentSettings.lightsOut && playing) {
      styles = styleForLightsOut(styles, litupSquares);
    }

    if (mazeIsOn) {
      styles = styleForMaze(styles, borders);
    }

    // console.log("styles", styles);
    setSquareStyles(styles);
  }

  // On Turn Change
  useEffect(() => {
    console.log("useEffect triggered with turn:", turn);

    if (playing) {
      // if maze is in shift, make shifts
      if (currentSettings.maze === "Shift") {
        setMaze(scramble(maze, 2));
      }

      // if it's the computer's turn, make a move
      if (turn !== orientation && singlePlayer) {
        botMove();
      }
    }
  }, [turn]);

  // If something occurs that changes the board, style the squares
  useEffect(() => {
    // console.log("useEffect triggered with maze:", maze);
    // console.log(maze);
    styleSquares(getLitupSquares(game, orientation), getMazeBorders(maze));
  }, [maze, game, status]);

  // if king is in check, style the square
  useEffect(() => {
    let styles = {};
    if (inCheck) {
      const kingSquare = findKing(game, orientation[0]);
      styles[kingSquare] = squareStyles[kingSquare];
      styles[kingSquare].backgroundColor = "rgba(255,0,0,0.25)";
    }
    setCheckStyle(styles);
  }, [inCheck]);

  // On Game Over
  useEffect(() => {
    if (isGameOver) {
      console.log("Game over");
      if (mazeIsOn) {
        let moves = game.moves({ verbose: true });
        moves.forEach((move) => {
          if (!validMoveInMaze(maze, move)) {
            moves.splice(moves.indexOf(move), 1);
          }
        });
        if (moves.length === 0) {
          if (game.inCheck()) {
            setStatus("Checkmate!");
          } else {
            setStatus("Stalemate!");
          }
        }
      } else {
        setStatus(gameOverMessage(game));
      }
    }
  }, [isGameOver]);

  // On Game Start
  useEffect(() => {
    if (status === "Playing") {
      console.log("Game started");
      const newOrientation = singlePlayer
        ? Math.random() > 0.5
          ? "white"
          : "black"
        : currentSettings.playerColor;
      const newGame = new Chess();
      const newMaze = getRandomMaze();

      setOrientation(newOrientation);
      setGame(newGame);
      setMaze(newMaze);

      // if it's the computer's turn first, trigger a mov
      if (newOrientation === "black" && singlePlayer) {
        botMove(newGame);
      }
    }
  }, [status]);

  function socketAuthCheck(){
    let user_id = localStorage.getItem("user_id");
    socket.emit("auth check", user_id);
    console.log("auth check");
  }

  return (
    <div className="chessboard">
      <Chessboard
        className="board"
        position={game.fen()}
        onPieceDrop={onDrop}
        boardOrientation={orientation}
        isDraggablePiece={({ piece }) => piece[0] === orientation[0]}
        arePiecesDraggable={!isGameOver}
        customSquareStyles={{ ...squareStyles, ...checkStyle }}
      />
      {playing === false && <div className="mist-overlay"></div>}
      <GameOverCard className="card" message={status} />
      {process.env.NODE_ENV === "development" && (
        <>
          <button onClick={forcegame}>Force Game</button>
          <button onClick={shiftMaze}>Shift Maze</button>
          
        </>
      )}
          <button onClick={()=>{socket.connect();console.log("connected");}}>Connect</button>
          <button onClick={socketAuthCheck}>Auth Check</button>
          <button onClick={()=>{socket.disconnect();console.log("disconnected");}}>Disonnect</button>
    </div>
  );
}
