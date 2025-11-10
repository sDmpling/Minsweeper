import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import GameBoard from './components/GameBoard';
import PlayerList from './components/PlayerList';
import GameLobby from './components/GameLobby';
import './App.css';

const App = () => {
  const [socket, setSocket] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [playerName, setPlayerName] = useState('');
  const [gameId, setGameId] = useState('');
  const [connectionState, setConnectionState] = useState('disconnected');
  const [error, setError] = useState('');

  useEffect(() => {
    const serverUrl = process.env.NODE_ENV === 'production'
      ? window.location.origin
      : 'http://localhost:8080';

    const socketOptions = process.env.NODE_ENV === 'production'
      ? { path: '/api/socket' }
      : {};

    const newSocket = io(serverUrl, socketOptions);

    newSocket.on('connect', () => {
      setConnectionState('connected');
      setSocket(newSocket);
    });

    newSocket.on('disconnect', () => {
      setConnectionState('disconnected');
      setSocket(null);
    });

    newSocket.on('joined-game', (data) => {
      if (data.success) {
        setPlayerId(data.playerId);
        setGameState(data.gameState);
        setGameId(data.gameId);
        setError('');
      } else {
        setError(data.error);
      }
    });

    newSocket.on('game-updated', (state) => {
      setGameState(state);
    });

    newSocket.on('game-started', (state) => {
      setGameState(state);
    });

    newSocket.on('cell-revealed', (data) => {
      setGameState(data.gameState);
    });

    newSocket.on('flag-toggled', (data) => {
      setGameState(data.gameState);
    });

    newSocket.on('player-left', (data) => {
      setGameState(data.gameState);
    });

    newSocket.on('error', (data) => {
      setError(data.message);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const joinGame = (name, gameIdInput = '') => {
    if (!socket) return;

    setPlayerName(name);
    socket.emit('join-game', {
      playerName: name,
      gameId: gameIdInput.trim() || null
    });
  };

  const startGame = () => {
    if (!socket) return;
    socket.emit('start-game');
  };

  const revealCell = (x, y) => {
    if (!socket) return;
    socket.emit('reveal-cell', { x, y });
  };

  const toggleFlag = (x, y) => {
    if (!socket) return;
    socket.emit('toggle-flag', { x, y });
  };

  const leaveGame = () => {
    if (!socket) return;
    socket.emit('leave-game');
    setGameState(null);
    setPlayerId(null);
    setGameId('');
    setError('');
  };

  if (connectionState === 'disconnected') {
    return (
      <div className="app">
        <div className="loading-screen">
          <h2>Connecting to server...</h2>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="app">
        <GameLobby onJoinGame={joinGame} error={error} />
      </div>
    );
  }

  return (
    <div className="app">
      <div className="game-container">
        <div className="game-header">
          <h1>Multiplayer Minesweeper</h1>
          <div className="game-info">
            <span>Game ID: {gameId}</span>
            <button onClick={leaveGame} className="leave-btn">Leave Game</button>
          </div>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="game-layout">
          <div className="sidebar">
            <PlayerList
              players={gameState.players}
              scores={gameState.scores}
              currentPlayer={gameState.currentPlayer}
              playerId={playerId}
              gameState={gameState.gameState}
              onStartGame={startGame}
            />
          </div>

          <div className="main-content">
            {gameState.gameState === 'playing' || gameState.gameState === 'finished' ? (
              <GameBoard
                board={gameState.board}
                width={gameState.width}
                height={gameState.height}
                onCellClick={revealCell}
                onCellRightClick={toggleFlag}
                currentPlayer={gameState.currentPlayer}
                playerId={playerId}
                gameState={gameState.gameState}
                winner={gameState.winner}
                players={gameState.players}
              />
            ) : (
              <div className="waiting-screen">
                <h2>Waiting for game to start...</h2>
                <p>Need at least 2 players to begin</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;