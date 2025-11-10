import { Server } from 'socket.io'

const SocketHandler = (req, res) => {
  if (res.socket.server.io) {
    console.log('Socket is already running')
  } else {
    console.log('Socket is initializing')
    const io = new Server(res.socket.server, {
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    })
    res.socket.server.io = io

    // Game state storage (simple in-memory for demo)
    const games = new Map()
    const players = new Map()

    io.on('connection', (socket) => {
      console.log('New client connected:', socket.id)

      socket.on('join-game', (data) => {
        try {
          const { playerName, gameId } = data

          // Simple game creation/joining logic
          let targetGameId = gameId
          if (!targetGameId) {
            // Find existing game or create new one
            let availableGame = null
            for (const [id, game] of games) {
              if (game.players.size < 10 && game.status === 'waiting') {
                availableGame = id
                break
              }
            }
            targetGameId = availableGame || `game_${Date.now()}`
          }

          if (!games.has(targetGameId)) {
            games.set(targetGameId, {
              id: targetGameId,
              players: new Map(),
              status: 'waiting',
              board: createBoard(16, 16, 40),
              currentPlayer: null,
              scores: new Map()
            })
          }

          const game = games.get(targetGameId)
          const playerId = socket.id

          // Add player to game
          game.players.set(playerId, {
            id: playerId,
            name: playerName,
            color: getPlayerColor(game.players.size)
          })
          game.scores.set(playerId, 0)
          players.set(playerId, targetGameId)

          socket.join(targetGameId)

          socket.emit('joined-game', {
            success: true,
            gameId: targetGameId,
            playerId: playerId,
            gameState: getGameState(game)
          })

          io.to(targetGameId).emit('game-updated', getGameState(game))

        } catch (error) {
          socket.emit('joined-game', {
            success: false,
            error: error.message
          })
        }
      })

      socket.on('start-game', () => {
        const gameId = players.get(socket.id)
        if (!gameId) return

        const game = games.get(gameId)
        if (!game || game.players.size < 2) return

        game.status = 'playing'
        const playerIds = Array.from(game.players.keys())
        game.currentPlayer = playerIds[0]

        io.to(gameId).emit('game-started', getGameState(game))
      })

      socket.on('reveal-cell', (data) => {
        const gameId = players.get(socket.id)
        if (!gameId) return

        const game = games.get(gameId)
        if (!game || game.currentPlayer !== socket.id) return

        const { x, y } = data
        if (revealCell(game, x, y, socket.id)) {
          // Move to next player
          const playerIds = Array.from(game.players.keys())
          const currentIndex = playerIds.indexOf(socket.id)
          const nextIndex = (currentIndex + 1) % playerIds.length
          game.currentPlayer = playerIds[nextIndex]

          io.to(gameId).emit('cell-revealed', {
            x, y,
            gameState: getGameState(game)
          })
        }
      })

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id)
        const gameId = players.get(socket.id)
        if (gameId) {
          const game = games.get(gameId)
          if (game) {
            game.players.delete(socket.id)
            game.scores.delete(socket.id)
            if (game.players.size === 0) {
              games.delete(gameId)
            } else {
              io.to(gameId).emit('player-left', {
                playerId: socket.id,
                gameState: getGameState(game)
              })
            }
          }
          players.delete(socket.id)
        }
      })
    })
  }
  res.end()
}

function createBoard(width, height, mines) {
  const board = Array(height).fill().map(() =>
    Array(width).fill().map(() => ({
      isMine: false,
      isRevealed: false,
      isFlagged: false,
      neighborCount: 0,
      revealedBy: null
    }))
  )

  // Place mines
  let placed = 0
  while (placed < mines) {
    const x = Math.floor(Math.random() * width)
    const y = Math.floor(Math.random() * height)
    if (!board[y][x].isMine) {
      board[y][x].isMine = true
      placed++
    }
  }

  // Calculate neighbor counts
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!board[y][x].isMine) {
        let count = 0
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx
            const ny = y + dy
            if (nx >= 0 && nx < width && ny >= 0 && ny < height && board[ny][nx].isMine) {
              count++
            }
          }
        }
        board[y][x].neighborCount = count
      }
    }
  }

  return { board, width, height }
}

function revealCell(game, x, y, playerId) {
  const { board } = game.board
  if (board[y][x].isRevealed || board[y][x].isFlagged) return false

  board[y][x].isRevealed = true
  board[y][x].revealedBy = playerId

  // Update score
  const currentScore = game.scores.get(playerId) || 0
  game.scores.set(playerId, currentScore + 1)

  return true
}

function getPlayerColor(index) {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
    '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
    '#BB8FCE', '#85C1E9'
  ]
  return colors[index % colors.length]
}

function getGameState(game) {
  return {
    gameId: game.id,
    gameState: game.status,
    players: Array.from(game.players.values()),
    scores: Object.fromEntries(game.scores),
    currentPlayer: game.currentPlayer,
    board: game.board.board.map(row =>
      row.map(cell => ({
        isRevealed: cell.isRevealed,
        isFlagged: cell.isFlagged,
        isMine: cell.isRevealed ? cell.isMine : false,
        neighborCount: cell.isRevealed ? cell.neighborCount : 0,
        revealedBy: cell.revealedBy
      }))
    ),
    width: game.board.width,
    height: game.board.height
  }
}

export default SocketHandler