import React from 'react';

export function ChessSettings({ settings, onChangeSettings }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onChangeSettings((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div>
      <h3>Chess Settings</h3>
      <label>
        Mode:
        <select name="mode" onChange={handleChange}>
          <option value="single">Single Player</option>
          <option value="multi">Multiplayer</option>
        </select>
      </label>
      <label>
        Player Color:
        <select name="playerColor" onChange={handleChange}>
          <option value="white">White</option>
          <option value="black">Black</option>
        </select>
      </label>
    </div>
  );
}