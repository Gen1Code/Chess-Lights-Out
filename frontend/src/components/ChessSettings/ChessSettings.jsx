import React, {useContext} from 'react';
import { GameContext } from '@context/GameContext';

export function ChessSettings() {
  const { settings, setSettings } = useContext(GameContext);
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    //console.log("Settings changed", name, type === 'checkbox' ? checked : value);
  };

  return (
    <div>
      <h3>Chess Settings</h3>
      <label>
        Mode:&nbsp;
        <select name="mode" value={settings.mode} onChange={handleChange}>
          <option value="Single">Single Player</option>
          <option value="Multi">Multiplayer</option>
        </select>
      </label>
      <a> </a>
      <label>
        Lights Out:&nbsp;
        <input type="checkbox" name="lightsOut" checked={settings.lightsOut} onChange={handleChange} />
      </label>
      <a> </a>
      <label>
        Maze:&nbsp;
        <select name="maze" value={settings.maze} onChange={handleChange}>
          <option value="Off">Off</option>
          <option value="Static">Static</option>
          <option value="Shift">Shift</option>
        </select>
      </label>
    </div>
  );
}