import React from 'react';
import './GameBoard.css';

const GameBoard = ({
  board,
  width,
  height,
  onCellClick,
  onCellRightClick,
  currentPlayer,
  playerId,
  gameState,
  winner,
  players
}) => {
  const isMyTurn = currentPlayer === playerId && gameState === 'playing';

  const handleCellClick = (x, y) => {
    if (!isMyTurn || gameState !== 'playing') return;

    const cell = board[y][x];
    if (cell.isRevealed || cell.isFlagged) return;

    onCellClick(x, y);
  };

  const handleCellRightClick = (e, x, y) => {
    e.preventDefault();

    if (!isMyTurn || gameState !== 'playing') return;

    const cell = board[y][x];
    if (cell.isRevealed) return;

    onCellRightClick(x, y);
  };

  const getCellContent = (cell, x, y) => {
    if (cell.isFlagged) return '🚩';
    if (!cell.isRevealed) return '';
    if (cell.isMine) return '💣';
    if (cell.neighborCount > 0) return cell.neighborCount;
    return '';
  };

  const getCellClass = (cell, x, y) => {
    let className = 'cell';

    if (cell.isRevealed) {
      className += ' revealed';
      if (cell.isMine) {
        className += ' mine';
      } else if (cell.neighborCount > 0) {
        className += ` number-${cell.neighborCount}`;
      }
    } else {
      className += ' hidden';
      if (cell.isFlagged) {
        className += ' flagged';
      }
    }

    if (cell.revealedBy && players) {
      const player = players.find(p => p.id === cell.revealedBy);
      if (player) {
        className += ' revealed-by-player';
      }
    }

    return className;
  };

  const getPlayerColor = (cell) => {
    if (!cell.revealedBy || !players) return null;
    const player = players.find(p => p.id === cell.revealedBy);
    return player ? player.color : null;
  };

  return (
    <div className="game-board-container">
      {gameState === 'finished' && winner && (
        <div className="game-over-banner">
          <h2>
            🎉 Game Over!
            {winner === playerId ? ' You Won!' : ` ${players.find(p => p.id === winner)?.name || 'Someone'} Won!`}
          </h2>
        </div>
      )}

      <div className="turn-status">
        {gameState === 'playing' && (
          <p className={isMyTurn ? 'your-turn' : 'waiting-turn'}>
            {isMyTurn ? '🎯 Your turn - Click to reveal or right-click to flag!' : '⏳ Waiting for other player...'}
          </p>
        )}
      </div>

      <div
        className="game-board"
        style={{
          gridTemplateColumns: `repeat(${width}, 1fr)`,
          gridTemplateRows: `repeat(${height}, 1fr)`
        }}
      >
        {board.map((row, y) =>
          row.map((cell, x) => {
            const playerColor = getPlayerColor(cell);
            return (
              <div
                key={`${x}-${y}`}
                className={getCellClass(cell, x, y)}
                onClick={() => handleCellClick(x, y)}
                onContextMenu={(e) => handleCellRightClick(e, x, y)}
                style={{
                  borderColor: playerColor || undefined,
                  boxShadow: playerColor ? `inset 0 0 0 2px ${playerColor}` : undefined
                }}
                title={
                  cell.revealedBy && players
                    ? `Revealed by ${players.find(p => p.id === cell.revealedBy)?.name || 'Unknown'}`
                    : undefined
                }
              >
                <span className="cell-content">
                  {getCellContent(cell, x, y)}
                </span>
              </div>
            );
          })
        )}
      </div>

      <div className="game-info">
        <div className="controls-hint">
          <p><strong>Controls:</strong></p>
          <p>• Left click to reveal a cell</p>
          <p>• Right click to flag/unflag a cell</p>
          <p>• Numbers show adjacent mine count</p>
        </div>
      </div>
    </div>
  );
};

export default GameBoard;