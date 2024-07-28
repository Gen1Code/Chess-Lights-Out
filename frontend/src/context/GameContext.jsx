import React, { createContext, useState } from 'react';

export const GameContext = createContext();

export const GameProvider = ({ children }) => {
  const [settings, setSettings] = useState({ mode: "single", lightsOut: true, maze: "off" });
  const [currentSettings, setCurrentSettings] = useState({ mode: "single", lightsOut: true, maze: "off" });
  const [status, setStatus] = useState("Haven't started yet");

  return (
    <GameContext.Provider value={{ 
      settings, setSettings, 
      currentSettings, setCurrentSettings, 
      status, setStatus
    }}>
      {children}
    </GameContext.Provider>
  );
};