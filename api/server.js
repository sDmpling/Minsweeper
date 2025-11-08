// Vercel serverless function for the game server
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const MinesweeperGame = require('../server/gameLogic');

const app = express();
const server = createServer(app);

// Configure CORS for production
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: false
    },
    transports: ['websocket', 'polling']
});

app.use(cors());
app.use(express.json());

// Game management (using in-memory storage for serverless)
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

        // Clean up game after 30 minutes of inactivity (shorter for serverless)
        setTimeout(() => {
            if (games.has(game.gameId)) {
                this.deleteGame(game.gameId);
            }
        }, 1800000); // 30 minutes

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

    getGame(gameId) {
        return games.get(gameId);
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

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);

    socket.on('join-game', (data) => {
        try {
            const { playerName, gameId } = data;
            const playerId = socket.id;

            gameManager.removePlayerFromGame(playerId);
            const game = gameManager.addPlayerToGame(playerId, playerName, gameId);

            socket.join(game.gameId);
            socket.emit('joined-game', {
                success: true,
                gameId: game.gameId,
                playerId: playerId,
                gameState: game.getCurrentGameState()
            });

            io.to(game.gameId).emit('game-updated', game.getCurrentGameState());

        } catch (error) {
            socket.emit('joined-game', {
                success: false,
                error: error.message
            });
        }
    });

    socket.on('start-game', () => {
        try {
            const game = gameManager.getPlayerGame(socket.id);
            if (!game) {
                throw new Error('Not in a game');
            }

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

            if (!game) {
                throw new Error('Not in a game');
            }

            const result = game.revealCell(x, y, socket.id);

            io.to(game.gameId).emit('cell-revealed', {
                x, y,
                gameState: game.getCurrentGameState(),
                result
            });

        } catch (error) {
            socket.emit('error', { message: error.message });
        }
    });

    socket.on('toggle-flag', (data) => {
        try {
            const { x, y } = data;
            const game = gameManager.getPlayerGame(socket.id);

            if (!game) {
                throw new Error('Not in a game');
            }

            const result = game.toggleFlag(x, y, socket.id);

            io.to(game.gameId).emit('flag-toggled', {
                x, y,
                gameState: game.getCurrentGameState(),
                result
            });

        } catch (error) {
            socket.emit('error', { message: error.message });
        }
    });

    socket.on('get-game-state', () => {
        const game = gameManager.getPlayerGame(socket.id);
        if (game) {
            socket.emit('game-state', game.getCurrentGameState());
        } else {
            socket.emit('error', { message: 'Not in a game' });
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

// API Routes
app.get('/api/games', (req, res) => {
    const gameList = Array.from(games.values()).map(game => ({
        gameId: game.gameId,
        playerCount: game.players.size,
        maxPlayers: game.maxPlayers,
        gameState: game.gameState,
        width: game.width,
        height: game.height,
        mineCount: game.mineCount
    }));

    res.json(gameList);
});

app.get('/api/games/:gameId', (req, res) => {
    const game = games.get(req.params.gameId);
    if (!game) {
        return res.status(404).json({ error: 'Game not found' });
    }

    res.json(game.getCurrentGameState());
});

// Export for Vercel
module.exports = app;