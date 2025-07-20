import { useState } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import './App.css';

function App() {
  const initialFen = new Chess().fen();
  const [boardPosition, setBoardPosition] = useState(initialFen);
  const [fenInput, setFenInput] = useState(initialFen);
  const [analysis, setAnalysis] = useState({ move: null, score: null });
  const [boardKey, setBoardKey] = useState(0);

  const handleAnalyse = async () => {
    try {
      console.log("🔍 Raw FEN input:", fenInput);
      const cleanedFen = fenInput.trim().replace(/\s+/g, ' ');
      console.log("🧼 Cleaned FEN:", cleanedFen);

      const tempGame = new Chess();
      const isValidFen = tempGame.load(cleanedFen);
      console.log("✅ Is valid FEN?", isValidFen);

      if (!isValidFen) {
        setAnalysis({ move: '❌ Error: Invalid FEN string', score: null });
        console.warn("❗ Invalid FEN, aborting analysis");
        return;
      }

      // Update board and trigger rerender
      setBoardPosition(cleanedFen);
      setBoardKey(prevKey => {
        const newKey = prevKey + 1;
        console.log("♻️ Updating board key to:", newKey);
        return newKey;
      });

      setAnalysis({ move: '🕐 Analyzing...', score: null });

      console.log("📡 Sending request to backend...");
      const response = await fetch('https://chesska.onrender.com/analyse-position', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fen: cleanedFen }),
      });

      if (!response.ok) {
        throw new Error(`🚨 Network error: ${response.status}`);
      }

      const data = await response.json();
      console.log("✅ Backend response received:", data);

      setAnalysis({ move: data.best_move, score: data.score });
    } catch (error) {
      console.error("🔥 Error in analysis flow:", error);
      setAnalysis({ move: '❌ Failed to get analysis. Is backend running?', score: null });
    }
  };

  return (
    <div className="app-container">
      <h1>ChessKa - AI Chess Position Analyser</h1>
      <div className="main-content">
        <div className="board-container">
          <Chessboard key={`board-${boardKey}`} position={boardPosition} />
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
