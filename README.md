# Chess-Lights-Out

A Chess Multiplayer Web Game with Time Control, with 2 additional Settings:
- Lights Out - Similar to Fog of War, the board is darkened and pieces are hidden based on lighting
- Maze - A maze is generated on the board, pieces can only move if no walls are blocking their path

## Technologies
- Frontend: Vite, React, Ably Realtime Messaging; (Deployed by Github Pages)
- Backend: Vercel Serverless Functions, Vercel PostgreSQL, Ably Realtime Messaging; (Deployed by Vercel)

## Where to Play
Go to [Chess Lights Out](https://gen1code.github.io/Chess-Lights-Out/)

## Variant Rules
<u>**Lights Out**</u>: 
The board is darkened and pieces are hidden based on lighting. Lighting is decided by possible moves of a piece. The piece itself and if a piece can move to a square, the square is then lit.

Notable exceptions include the King, which lights up all squares around it, and Pawns, which always light up the square in front of them.

<u>**Maze**</u>:
A maze is generated on the board, pieces can only move if no wall are blocking their path. There are 2 modes Static and Shif. In Static mode, the maze is generated at the start of the game and does not change. In Shift mode, the maze is changed by 25 scramble operations of [Origin Shift Operation](https://www.youtube.com/watch?v=zbXKcDVV4G0) every move, this creates an interesting proabilistic strategy to be developed for choosing moves.

Horse moves are not blocked by walls. Diagonal moves are defined by if a path can be created either side of the diagonal to reach the destination (for each step in a diagonal direction).
(Currently Maze is quite restrictive and not very fun imo but it works as a proof of concept)

## Bug Reporting
Please report any bugs or issues by creating an issue.

## Motivations
I wanted to explore the restrictions/conditionals a serverless architecture would impose on a multiplayer real-time game. I also wanted to not just copy a game but create a variant.