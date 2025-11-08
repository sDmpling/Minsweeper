import React from 'react';
import './PlayerList.css';

const PlayerList = ({
  players,
  scores,
  currentPlayer,
  playerId,
  gameState,
  onStartGame
}) => {
  const canStartGame = players.length >= 2 && gameState === 'waiting';
  const isCurrentPlayer = currentPlayer === playerId;

  return (
    <div className="player-list">
      <h3>Players ({players.length}/10)</h3>

      {gameState === 'waiting' && (
        <div className="game-controls">
          <button
            onClick={onStartGame}
            className="start-btn"
            disabled={!canStartGame}
          >
            {canStartGame ? 'Start Game' : 'Need 2+ Players'}
          </button>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="turn-indicator">
          <p>
            {isCurrentPlayer ? (
              <span className="your-turn">🎯 Your Turn!</span>
            ) : (
              <span>
                Waiting for{' '}
                <strong>
                  {players.find(p => p.id === currentPlayer)?.name || 'Player'}
                </strong>
              </span>
            )}
          </p>
        </div>
      )}

      {gameState === 'finished' && (
        <div className="game-finished">
          <h4>🎉 Game Over!</h4>
        </div>
      )}

      <div className="players">
        {players
          .sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0))
          .map((player, index) => {
            const isWinner = gameState === 'finished' && index === 0;
            const isActive = currentPlayer === player.id && gameState === 'playing';
            const isYou = player.id === playerId;

            return (
              <div
                key={player.id}
                className={`player-card ${isActive ? 'active' : ''} ${isWinner ? 'winner' : ''}`}
              >
                <div className="player-info">
                  <div
                    className="player-color"
                    style={{ backgroundColor: player.color }}
                  ></div>
                  <div className="player-details">
                    <span className="player-name">
                      {player.name}
                      {isYou && <span className="you-label">(You)</span>}
                      {isWinner && <span className="winner-crown">👑</span>}
                    </span>
                    <span className="player-score">
                      {scores[player.id] || 0} points
                    </span>
                  </div>
                </div>
                {isActive && (
                  <div className="turn-indicator-small">
                    <div className="pulse-dot"></div>
                  </div>
                )}
              </div>
            );
          })}
      </div>

      <div className="game-stats">
        <h4>Game Info</h4>
        <div className="stat-item">
          <span>Status:</span>
          <span className={`status ${gameState}`}>
            {gameState === 'waiting' && '⏳ Waiting'}
            {gameState === 'playing' && '🎮 Playing'}
            {gameState === 'finished' && '✅ Finished'}
          </span>
        </div>
        <div className="stat-item">
          <span>Turn Time:</span>
          <span>30 seconds</span>
        </div>
      </div>
    </div>
  );
};

export default PlayerList;