import React, { useState } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';

function App() {
  const [game, setGame] = useState(new Chess());
  const [fen, setFen] = useState(game.fen());
  const [analysis, setAnalysis] = useState({ move: null, score: null });

  const handleAnalyze = async () => {
    const response = await fetch('https://chesska.onrender.com/analyse-position', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fen: game.fen() }),
    });

    const data = await response.json();
    if (data.best_move) {
      const from = data.best_move.slice(0, 2);
      const to = data.best_move.slice(2, 4);

      const newGame = new Chess(game.fen());
      newGame.move({ from, to });

      setGame(newGame);
      setFen(newGame.fen());
      setAnalysis({ move: data.best_move, score: data.score });
    }
  };

  return (
    <div>
      <h1>Chess Analyzer</h1>
      <Chessboard position={fen} arePiecesDraggable={false} />
      <button onClick={handleAnalyze}>Analyze</button>
      {analysis.move && (
        <div>
          <p>Best Move: {analysis.move}</p>
          <p>Score: {analysis.score}</p>
        </div>
      )}
    </div>
  );
}

export default App;
