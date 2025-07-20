import React, { useState, useCallback } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import './App.css';

function App() {
  const [game, setGame] = useState(new Chess());
  const [fen, setFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const [analysis, setAnalysis] = useState({ move: null, score: null });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [gameStatus, setGameStatus] = useState('');
  const [moveHistory, setMoveHistory] = useState([]);

  const makeMove = useCallback((sourceSquare, targetSquare) => {
    const gameCopy = new Chess(game.fen());
    
    try {
      const move = gameCopy.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q' // Always promote to queen for simplicity
      });

      if (move) {
        setGame(gameCopy);
        setFen(gameCopy.fen());
        setMoveHistory(prev => [...prev, move.san]);
        
        // Update game status
        if (gameCopy.isCheckmate()) {
          setGameStatus(`Checkmate! ${gameCopy.turn() === 'w' ? 'Black' : 'White'} wins!`);
        } else if (gameCopy.isDraw()) {
          setGameStatus('Game is a draw!');
        } else if (gameCopy.isCheck()) {
          setGameStatus(`${gameCopy.turn() === 'w' ? 'White' : 'Black'} is in check!`);
        } else {
          setGameStatus('');
        }
        
        return true;
      }
    } catch (error) {
      console.log('Invalid move:', error);
    }
    
    return false;
  }, [game]);

  const onDrop = useCallback((sourceSquare, targetSquare) => {
    return makeMove(sourceSquare, targetSquare);
  }, [makeMove]);

  const handleAnalyze = async () => {
    if (game.isGameOver()) {
      alert('Game is over!');
      return;
    }

    setIsAnalyzing(true);
    
    try {
      const response = await fetch('https://chesska.onrender.com/analyse-position', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fen: game.fen() }),
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const data = await response.json();
      
      if (data.best_move) {
        const from = data.best_move.slice(0, 2);
        const to = data.best_move.slice(2, 4);
        
        setAnalysis({ 
          move: `${from}-${to}`, 
          score: data.score,
          bestMove: data.best_move
        });
      }
    } catch (error) {
      console.error('Analysis error:', error);
      alert('Failed to analyze position. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleMakeBestMove = () => {
    if (analysis.bestMove) {
      const from = analysis.bestMove.slice(0, 2);
      const to = analysis.bestMove.slice(2, 4);
      makeMove(from, to);
      setAnalysis({ move: null, score: null, bestMove: null });
    }
  };

  const handleReset = () => {
    const newGame = new Chess();
    setGame(newGame);
    setFen(newGame.fen());
    setAnalysis({ move: null, score: null, bestMove: null });
    setGameStatus('');
    setMoveHistory([]);
  };

  const handleUndo = () => {
    const history = game.history();
    if (history.length > 0) {
      const newGame = new Chess();
      
      // Replay all moves except the last one
      for (let i = 0; i < history.length - 1; i++) {
        newGame.move(history[i]);
      }
      
      setGame(newGame);
      setFen(newGame.fen());
      setMoveHistory(prev => prev.slice(0, -1));
      setAnalysis({ move: null, score: null, bestMove: null });
      setGameStatus('');
    }
  };

  return (
    <div className="app">
      <div className="container">
        <h1 className="title">♔ Chess Analyzer ♛</h1>
        
        <div className="game-layout">
          <div className="board-section">
            <div className="board-container">
              <Chessboard 
                position={fen} 
                onPieceDrop={onDrop}
                arePiecesDraggable={!game.isGameOver()}
                boardWidth={400}
                customBoardStyle={{
                  borderRadius: '8px',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.3)'
                }}
              />
            </div>
            
            {gameStatus && (
              <div className="game-status">
                {gameStatus}
              </div>
            )}
          </div>

          <div className="controls-section">
            <div className="control-buttons">
              <button 
                className="btn btn-primary" 
                onClick={handleAnalyze}
                disabled={isAnalyzing || game.isGameOver()}
              >
                {isAnalyzing ? 'Analyzing...' : '🔍 Analyze Position'}
              </button>
              
              <button 
                className="btn btn-secondary" 
                onClick={handleUndo}
                disabled={moveHistory.length === 0}
              >
                ↶ Undo Move
              </button>
              
              <button 
                className="btn btn-secondary" 
                onClick={handleReset}
              >
                🔄 Reset Game
              </button>
            </div>

            {analysis.move && (
              <div className="analysis-panel">
                <h3>Analysis Result</h3>
                <div className="analysis-content">
                  <p><strong>Best Move:</strong> {analysis.move}</p>
                  {analysis.score !== null && (
                    <p><strong>Evaluation:</strong> {analysis.score}</p>
                  )}
                  <button 
                    className="btn btn-success btn-small"
                    onClick={handleMakeBestMove}
                  >
                    ✓ Make This Move
                  </button>
                </div>
              </div>
            )}

            <div className="game-info">
              <h3>Game Info</h3>
              <p><strong>Turn:</strong> {game.turn() === 'w' ? 'White' : 'Black'}</p>
              <p><strong>Move Count:</strong> {Math.ceil(game.history().length / 2)}</p>
              
              {moveHistory.length > 0 && (
                <div className="move-history">
                  <h4>Recent Moves</h4>
                  <div className="moves-list">
                    {moveHistory.slice(-6).map((move, index) => (
                      <span key={index} className="move-item">
                        {move}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;