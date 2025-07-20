import { useState } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import './App.css';

function App() {
  const [boardPosition, setBoardPosition] = useState(new Chess().fen());
  const [fenInput, setFenInput] = useState(new Chess().fen());
  const [analysis, setAnalysis] = useState({ move: null, score: null });
  const [boardKey, setBoardKey] = useState(0);

  const handleAnalyse = async () => {
    try {
      const rawFen = fenInput;
      const cleanedFen = rawFen.trim().replace(/\s+/g, ' ');
      console.log("\uD83D\uDD0D Raw FEN input:", rawFen);
      console.log("\uD83E\uDDEC Cleaned FEN:", cleanedFen);

      const tempGame = new Chess();
      const isValidFen = tempGame.load(cleanedFen);
      console.log("\u2705 Is valid FEN?", isValidFen);

      if (!isValidFen) {
        setAnalysis({ move: 'Error: Invalid FEN string', score: null });
        return;
      }

      setBoardKey(prevKey => prevKey + 1);
      console.log("\u267B\uFE0F Updating board key to:", boardKey + 1);
      setBoardPosition(cleanedFen);

      setAnalysis({ move: 'Analyzing...', score: null });
      console.log("\uD83D\uDCF1 Sending request to backend...");

      const response = await fetch('https://chesska.onrender.com/analyse-position', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fen: cleanedFen })
      });

      if (!response.ok) throw new Error('Network response was not ok');

      const data = await response.json();
      console.log("\u2705 Backend response received:", data);

      if (!data.best_move) {
        console.warn("\u26A0\uFE0F No best_move in backend response!", data);
        setAnalysis({ move: "Error: No best move returned", score: null });
        return;
      }

      setAnalysis({ move: data.best_move, score: data.score });
    } catch (error) {
      console.error('Error analysing position:', error);
      setAnalysis({ move: 'Failed to get analysis. Is the backend server running?', score: null });
    }
  };

  return (
    <div className="app-container">
      <h1>ChessKa - AI Chess Position Analyser</h1>
      <div className="main-content">
        <div className="board-container">
          <Chessboard key={boardKey} position={boardPosition} />
        </div>
        <div className="right-panel">
          <div className="controls">
            <label>Enter FEN String: </label>
            <input
              type="text"
              value={fenInput}
              onChange={(e) => setFenInput(e.target.value)}
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

