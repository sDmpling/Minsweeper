import React, { useState } from 'react';
import './GameLobby.css';

const GameLobby = ({ onJoinGame, error }) => {
  const [playerName, setPlayerName] = useState('');
  const [gameId, setGameId] = useState('');

  const handleJoinGame = () => {
    if (!playerName.trim()) {
      alert('Please enter your name');
      return;
    }

    onJoinGame(playerName.trim(), gameId.trim());
  };

  const handleJoinRandomGame = () => {
    if (!playerName.trim()) {
      alert('Please enter your name');
      return;
    }

    onJoinGame(playerName.trim(), '');
  };

  return (
    <div className="game-lobby">
      <div className="lobby-content">
        <h1>🚩 Multiplayer Minesweeper</h1>
        <p className="game-description">
          Take turns revealing cells in a collaborative Minesweeper game!
          Up to 10 players can play together.
        </p>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="form-section">
          <div className="input-group">
            <label htmlFor="playerName">Your Name</label>
            <input
              id="playerName"
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              maxLength={20}
              onKeyPress={(e) => e.key === 'Enter' && handleJoinRandomGame()}
            />
          </div>

          <div className="input-group">
            <label htmlFor="gameId">Game ID (optional)</label>
            <input
              id="gameId"
              type="text"
              value={gameId}
              onChange={(e) => setGameId(e.target.value)}
              placeholder="Enter game ID to join specific game"
              onKeyPress={(e) => e.key === 'Enter' && handleJoinGame()}
            />
          </div>

          <div className="button-group">
            <button
              onClick={handleJoinRandomGame}
              className="btn btn-primary"
              disabled={!playerName.trim()}
            >
              Join Random Game
            </button>

            <button
              onClick={handleJoinGame}
              className="btn btn-secondary"
              disabled={!playerName.trim() || !gameId.trim()}
            >
              Join Specific Game
            </button>
          </div>
        </div>

        <div className="game-rules">
          <h3>How to Play</h3>
          <ul>
            <li>Players take turns clicking cells to reveal them</li>
            <li>Numbers show how many mines are adjacent to that cell</li>
            <li>Right-click to flag suspected mines</li>
            <li>Avoid clicking on mines!</li>
            <li>Score points for each cell you reveal</li>
            <li>Player with the most points wins!</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default GameLobby;