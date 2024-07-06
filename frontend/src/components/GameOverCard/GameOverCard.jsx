import { useEffect, useState } from 'react';
import './GameOverCard.css';

export function GameOverCard({
  message,
  onClickReset,
  isGameOver
}) {

  if (!isGameOver) {
    return null;
  }

  return (
    <div className="card">
        <h3>{message}</h3>
        <button onClick={onClickReset}>Reset</button>
    </div>
  );
}