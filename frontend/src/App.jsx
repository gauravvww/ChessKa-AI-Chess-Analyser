import { useState } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import './App.css';

function App() {
  const [game, setGame] = useState(new Chess());
  const [fen, setFen] = useState(game.fen());
  const [analysis, setAnalysis] = useState({ move: null, score: null });

  const handleAnalyse = async () => {
    try {
      const cleanedFen = fen.trim().replace(/\s+/g, ' ');

      const tempGame = new Chess();
      const isValidFen = tempGame.load(cleanedFen);

      if (!isValidFen) {
        setAnalysis({ move: 'Error: Invalid FEN string', score: null });
        return;
      }
      
      setGame(new Chess(cleanedFen));
      setAnalysis({ move: 'Analyzing...', score: null });

     const response = await fetch('https://chesska.onrender.com/analyse-position', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fen: cleanedFen }),
      });
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setAnalysis({ move: data.best_move, score: data.score });
    }
    catch (error) {
      console.error('Error analysing position:', error);
      setAnalysis({ move: 'Failed to get analysis. Is the backend server running?', score: null }); 
    }
  };

    return (
    <div className="app-container">
      <h1>ChessKa - AI Chess Position Analyser</h1>
      <div className="main-content">
        <div className="board-container">
          <Chessboard position={game.fen()} />
        </div>
        
        {/* New wrapper div for the right panel */}
        <div className="right-panel">
          <div className="controls">
            <label>Enter FEN String: </label>
            <input
              type="text"
              value={fen}
              onChange={(e) => setFen(e.target.value)}
              className="fen-input" 
            />
            <button onClick={handleAnalyse}>Analyse Position</button>     
          </div>
          <div className="analysis-result">
            {analysis.move && <h4>Analysis</h4>}
            {analysis.move && <p><strong>Best Move:</strong> {analysis.move}</p>}
            {analysis.score && <p><strong>Evaluation:</strong> {analysis.score}</p>}
            {!analysis.move && <p>Analysis will appear here.</p>}
          </div>
        </div>
      </div>
    </div>
  );

}

export default App;