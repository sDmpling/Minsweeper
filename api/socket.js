// Simple API endpoint for Vercel
import { Server } from 'socket.io';

const ioHandler = (req, res) => {
  if (!res.socket.server.io) {
    console.log('Setting up Socket.IO server...');

    const io = new Server(res.socket.server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    // Import game logic
    const MinesweeperGame = require('../server/gameLogic');

    // Game management
    const games = new Map();
    const playerToGame = new Map();

    class GameManager {
      createGame(difficulty = 'medium') {
        const settings = {
          easy: { width: 9, height: 9, mineCount: 10 },
          medium: { width: 16, height: 16, mineCount: 40 },
          hard: { width: 30, height: 16, mineCount: 99 }
        };

        const config = settings[difficulty] || settings.medium;
        const game = new MinesweeperGame(config.width, config.height, config.mineCount);

        games.set(game.gameId, game);
        return game;
      }

      findAvailableGame() {
        for (let [gameId, game] of games) {
          if (game.gameState === 'waiting' && game.players.size < game.maxPlayers) {
            return game;
          }
        }
        return null;
      }

      deleteGame(gameId) {
        const game = games.get(gameId);
        if (game) {
          for (let playerId of game.players.keys()) {
            playerToGame.delete(playerId);
          }
        }
        games.delete(gameId);
      }

      getPlayerGame(playerId) {
        const gameId = playerToGame.get(playerId);
        return gameId ? games.get(gameId) : null;
      }

      addPlayerToGame(playerId, playerName, gameId = null) {
        let game;

        if (gameId) {
          game = games.get(gameId);
          if (!game) {
            throw new Error('Game not found');
          }
        } else {
          game = this.findAvailableGame();
          if (!game) {
            game = this.createGame();
          }
        }

        game.addPlayer(playerId, playerName);
        playerToGame.set(playerId, game.gameId);
        return game;
      }

      removePlayerFromGame(playerId) {
        const gameId = playerToGame.get(playerId);
        if (gameId) {
          const game = games.get(gameId);
          if (game) {
            game.removePlayer(playerId);
            if (game.players.size === 0) {
              this.deleteGame(gameId);
            }
          }
          playerToGame.delete(playerId);
        }
      }
    }

    const gameManager = new GameManager();

    // Socket.IO event handlers
    io.on('connection', (socket) => {
      console.log(`Player connected: ${socket.id}`);

      socket.on('join-game', (data) => {
        try {
          const { playerName, gameId } = data;
          gameManager.removePlayerFromGame(socket.id);
          const game = gameManager.addPlayerToGame(socket.id, playerName, gameId);

          socket.join(game.gameId);
          socket.emit('joined-game', {
            success: true,
            gameId: game.gameId,
            playerId: socket.id,
            gameState: game.getCurrentGameState()
          });

          io.to(game.gameId).emit('game-updated', game.getCurrentGameState());
        } catch (error) {
          socket.emit('joined-game', { success: false, error: error.message });
        }
      });

      socket.on('start-game', () => {
        try {
          const game = gameManager.getPlayerGame(socket.id);
          if (!game) throw new Error('Not in a game');

          game.startGame();
          io.to(game.gameId).emit('game-started', game.getCurrentGameState());
        } catch (error) {
          socket.emit('error', { message: error.message });
        }
      });

      socket.on('reveal-cell', (data) => {
        try {
          const { x, y } = data;
          const game = gameManager.getPlayerGame(socket.id);
          if (!game) throw new Error('Not in a game');

          const result = game.revealCell(x, y, socket.id);
          io.to(game.gameId).emit('cell-revealed', {
            x, y, gameState: game.getCurrentGameState(), result
          });
        } catch (error) {
          socket.emit('error', { message: error.message });
        }
      });

      socket.on('toggle-flag', (data) => {
        try {
          const { x, y } = data;
          const game = gameManager.getPlayerGame(socket.id);
          if (!game) throw new Error('Not in a game');

          const result = game.toggleFlag(x, y, socket.id);
          io.to(game.gameId).emit('flag-toggled', {
            x, y, gameState: game.getCurrentGameState(), result
          });
        } catch (error) {
          socket.emit('error', { message: error.message });
        }
      });

      socket.on('disconnect', () => {
        console.log(`Player disconnected: ${socket.id}`);
        const game = gameManager.getPlayerGame(socket.id);
        if (game) {
          gameManager.removePlayerFromGame(socket.id);
          if (game.players.size > 0) {
            io.to(game.gameId).emit('player-left', {
              playerId: socket.id,
              gameState: game.getCurrentGameState()
            });
          }
        }
      });
    });

    res.socket.server.io = io;
  }

  res.end();
};

export default ioHandler;