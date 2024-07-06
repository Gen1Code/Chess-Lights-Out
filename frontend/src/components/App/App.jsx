import { useState } from 'react';
import { ChessGame } from '@components/ChessGame';
import './App.css';
import { ApiRequest } from '@components/ApiRequest';

export function App() {

  return (
    <>
      <h1>Chess Lights Out</h1>
      <ChessGame />
      <div className="card">
      </div>
      <ApiRequest method="POST" path="/auth/" postData={{ name: "examplePlayer" }}/>
      <ApiRequest method="GET" path="/game/play" postData={null}/>

    </>
  );
}
