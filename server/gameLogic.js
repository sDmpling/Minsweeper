class MinesweeperGame {
    constructor(width = 16, height = 16, mineCount = 40, maxPlayers = 10) {
        this.width = width;
        this.height = height;
        this.mineCount = mineCount;
        this.maxPlayers = maxPlayers;
        this.players = new Map();
        this.currentPlayerIndex = 0;
        this.gameState = 'waiting'; // waiting, playing, finished
        this.winner = null;
        this.gameId = this.generateGameId();
        this.board = this.initializeBoard();
        this.revealedCells = new Set();
        this.flaggedCells = new Set();
        this.scores = new Map(); // playerId -> score
        this.turnTimeLimit = 30000; // 30 seconds per turn
        this.turnTimer = null;
    }

    generateGameId() {
        return Math.random().toString(36).substr(2, 9);
    }

    initializeBoard() {
        const board = Array(this.height).fill().map(() =>
            Array(this.width).fill().map(() => ({
                isMine: false,
                neighborCount: 0,
                isRevealed: false,
                isFlagged: false,
                revealedBy: null
            }))
        );

        // Place mines randomly
        const mines = new Set();
        while (mines.size < this.mineCount) {
            const x = Math.floor(Math.random() * this.width);
            const y = Math.floor(Math.random() * this.height);
            const key = `${x},${y}`;

            if (!mines.has(key)) {
                mines.add(key);
                board[y][x].isMine = true;
            }
        }

        // Calculate neighbor counts
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (!board[y][x].isMine) {
                    board[y][x].neighborCount = this.countNeighborMines(x, y, board);
                }
            }
        }

        return board;
    }

    countNeighborMines(x, y, board) {
        let count = 0;
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;

                const nx = x + dx;
                const ny = y + dy;

                if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
                    if (board[ny][nx].isMine) count++;
                }
            }
        }
        return count;
    }

    addPlayer(playerId, playerName) {
        if (this.players.size >= this.maxPlayers) {
            throw new Error('Game is full');
        }

        if (this.gameState !== 'waiting') {
            throw new Error('Game already started');
        }

        this.players.set(playerId, {
            id: playerId,
            name: playerName,
            color: this.getPlayerColor(this.players.size),
            joinedAt: Date.now()
        });

        this.scores.set(playerId, 0);

        return this.players.get(playerId);
    }

    removePlayer(playerId) {
        this.players.delete(playerId);
        this.scores.delete(playerId);

        // Adjust current player index if needed
        if (this.players.size > 0) {
            const playerIds = Array.from(this.players.keys());
            this.currentPlayerIndex = this.currentPlayerIndex % playerIds.length;
        }
    }

    getPlayerColor(index) {
        const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
            '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
            '#BB8FCE', '#85C1E9'
        ];
        return colors[index % colors.length];
    }

    startGame() {
        if (this.players.size < 2) {
            throw new Error('Need at least 2 players to start');
        }

        this.gameState = 'playing';
        this.startTurnTimer();
        return this.getCurrentGameState();
    }

    getCurrentPlayer() {
        const playerIds = Array.from(this.players.keys());
        return playerIds[this.currentPlayerIndex];
    }

    nextTurn() {
        if (this.players.size === 0) return;

        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.size;
        this.startTurnTimer();
    }

    startTurnTimer() {
        if (this.turnTimer) {
            clearTimeout(this.turnTimer);
        }

        this.turnTimer = setTimeout(() => {
            this.nextTurn();
        }, this.turnTimeLimit);
    }

    revealCell(x, y, playerId) {
        if (this.gameState !== 'playing') {
            throw new Error('Game is not in playing state');
        }

        if (playerId !== this.getCurrentPlayer()) {
            throw new Error('Not your turn');
        }

        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            throw new Error('Invalid coordinates');
        }

        const cell = this.board[y][x];

        if (cell.isRevealed || cell.isFlagged) {
            throw new Error('Cell already revealed or flagged');
        }

        // Reveal the cell
        cell.isRevealed = true;
        cell.revealedBy = playerId;

        // Award points for revealing
        this.scores.set(playerId, this.scores.get(playerId) + 1);

        // If it's a mine, game over
        if (cell.isMine) {
            this.gameState = 'finished';
            this.winner = this.findWinner();
            return { gameOver: true, hitMine: true, winner: this.winner };
        }

        // Auto-reveal empty cells
        if (cell.neighborCount === 0) {
            this.revealEmptyNeighbors(x, y, playerId);
        }

        // Check win condition
        if (this.checkWinCondition()) {
            this.gameState = 'finished';
            this.winner = this.findWinner();
            return { gameOver: true, winner: this.winner };
        }

        // Move to next turn
        this.nextTurn();

        return { gameOver: false };
    }

    revealEmptyNeighbors(x, y, playerId) {
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;

                const nx = x + dx;
                const ny = y + dy;

                if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
                    const neighbor = this.board[ny][nx];

                    if (!neighbor.isRevealed && !neighbor.isFlagged && !neighbor.isMine) {
                        neighbor.isRevealed = true;
                        neighbor.revealedBy = playerId;
                        this.scores.set(playerId, this.scores.get(playerId) + 1);

                        if (neighbor.neighborCount === 0) {
                            this.revealEmptyNeighbors(nx, ny, playerId);
                        }
                    }
                }
            }
        }
    }

    toggleFlag(x, y, playerId) {
        if (this.gameState !== 'playing') {
            throw new Error('Game is not in playing state');
        }

        if (playerId !== this.getCurrentPlayer()) {
            throw new Error('Not your turn');
        }

        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            throw new Error('Invalid coordinates');
        }

        const cell = this.board[y][x];

        if (cell.isRevealed) {
            throw new Error('Cannot flag revealed cell');
        }

        cell.isFlagged = !cell.isFlagged;

        // Move to next turn after flagging
        this.nextTurn();

        return { flagged: cell.isFlagged };
    }

    checkWinCondition() {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const cell = this.board[y][x];
                if (!cell.isMine && !cell.isRevealed) {
                    return false;
                }
            }
        }
        return true;
    }

    findWinner() {
        let maxScore = -1;
        let winner = null;

        for (let [playerId, score] of this.scores) {
            if (score > maxScore) {
                maxScore = score;
                winner = playerId;
            }
        }

        return winner;
    }

    getCurrentGameState() {
        return {
            gameId: this.gameId,
            gameState: this.gameState,
            players: Array.from(this.players.values()),
            scores: Object.fromEntries(this.scores),
            currentPlayer: this.getCurrentPlayer(),
            board: this.getBoardForClient(),
            width: this.width,
            height: this.height,
            winner: this.winner
        };
    }

    getBoardForClient() {
        return this.board.map(row =>
            row.map(cell => ({
                isRevealed: cell.isRevealed,
                isFlagged: cell.isFlagged,
                isMine: cell.isRevealed ? cell.isMine : false,
                neighborCount: cell.isRevealed ? cell.neighborCount : 0,
                revealedBy: cell.revealedBy
            }))
        );
    }
}

module.exports = MinesweeperGame;