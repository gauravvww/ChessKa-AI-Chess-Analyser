import React, { useState } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import './App.css';

function App() {
  const [game, setGame] = useState(new Chess());
  const [fen, setFen] = useState(game.fen());
  const [analysis, setAnalysis] = useState({ move: null, score: null });

  const handleAnalyze = async () => {
    const currentFen = game.fen();
    setFen(currentFen);
    console.log('🔍 FEN sent to backend:', currentFen);

    try {
      const response = await fetch('https://chesska.onrender.com/analyse-position', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fen: currentFen }),
      });

      const data = await response.json();
      console.log('✅ Backend response:', data);

      const bestMove = data.best_move;
      const score = data.score;

      if (bestMove) {
        // Make the move on the board
        game.move({
          from: bestMove.slice(0, 2),
          to: bestMove.slice(2, 4),
        });

        // Update the board and state
        setFen(game.fen());
        setGame(new Chess(game.fen()));
        setAnalysis({ move: bestMove, score });
      }
    } catch (error) {
      console.error('❌ Error analyzing position:', error);
    }
  };

  return (
    <div className="App">
      <h2>♟️ Chess Position Analyzer</h2>
      <Chessboard position={fen} />
      <button onClick={handleAnalyze} style={{ marginTop: '16px' }}>
        Analyze Position
      </button>
      {analysis.move && (
        <div style={{ marginTop: '12px' }}>
          <p><strong>Best Move:</strong> {analysis.move}</p>
          <p><strong>Evaluation:</strong> {analysis.score}</p>
        </div>
      )}
    </div>
  );
}

export default App;
