import React, { useState } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';

function App() {
  const [fen, setFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const [fenInput, setFenInput] = useState('');
  const [analysis, setAnalysis] = useState({ move: null, score: null });

  const handleLoadFen = () => {
    if (fenInput.trim()) {
      try {
        // Validate FEN
        new Chess(fenInput.trim());
        setFen(fenInput.trim());
        setAnalysis({ move: null, score: null });
      } catch {
        alert('Invalid FEN');
      }
    }
  };

  const handleAnalyze = async () => {
    try {
      const response = await fetch('https://chesska.onrender.com/analyse-position', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fen: fen }),
      });

      const data = await response.json();
      setAnalysis({ move: data.best_move, score: data.score });
    } catch {
      alert('Analysis failed');
    }
  };

  return (
    <div>
      <h1>Chess Position Analyzer</h1>
      
      <div>
        <input 
          type="text" 
          placeholder="Enter FEN string"
          value={fenInput}
          onChange={(e) => setFenInput(e.target.value)}
          style={{ width: '500px', marginRight: '10px' }}
        />
        <button onClick={handleLoadFen}>Load Position</button>
      </div>
      
      <div style={{ margin: '20px 0' }}>
        <Chessboard position={fen} arePiecesDraggable={false} />
      </div>
      
      <button onClick={handleAnalyze}>Analyze Position</button>
      
      {analysis.move && (
        <div style={{ marginTop: '20px' }}>
          <p><strong>Best Move:</strong> {analysis.move}</p>
          <p><strong>Evaluation:</strong> {analysis.score}</p>
        </div>
      )}
    </div>
  );
}

export default App;