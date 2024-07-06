import { useState } from 'react';
import { ChessGame } from '@components/ChessGame';
import { ApiRequest } from '@components/ApiRequest';
import './App.css';

export function App() {

  return (
    <>
      <h1>Chess Lights Out</h1>
      <ChessGame />
      <ApiRequest method="POST" path="/auth/" postData={{ name: "examplePlayer" }}/>
      <ApiRequest method="GET" path="/game/play" postData={null}/>
    </>
  );
}
