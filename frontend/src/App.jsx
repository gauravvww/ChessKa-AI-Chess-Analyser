import { useState } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import './App.css';

function App() {
  const [boardPosition, setBoardPosition] = useState(new Chess().fen());
  const [fenInput, setFenInput] = useState(new Chess().fen());
  const [analysis, setAnalysis] = useState({ move: null, score: null });
  // --- FIX: Add a 'key' state to force the board to re-render ---
  const [boardKey, setBoardKey] = useState(0);

  const onDrop = (sourceSquare, targetSquare, piece) => {

    const tempGame = new Chess(boardPosition);
    try{
      const move = tempGame.move({
        //this returns the move object   as well as modifies the game state V IMP detail
        from: sourceSquare, 
        to: targetSquare,
        promotion: 'q' ,
    });


    if(move){
      const newFen = tempGame.fen();
      setBoardPosition(newFen);
      setFenInput(newFen);
      setBoardKey(prevKey => prevKey + 1); // Update key to force re-render
      console.log(`DEBUG (Frontend): Move made from ${sourceSquare} to ${targetSquare}. New FEN: ${newFen}`);
      setAnalysis({move: null, score: null}); // clear previous analysis when board changes
      return true;
      //react-chessboard docs : If onPieceDrop returns true, the move is accepted and the piece animates to the target square.
    // if it returns false, the move is rejected and the piece snaps back to its original square.
    }}

catch(e){
  console.error('DEBUG (Frontend): Illegal move attempted: ', e);
  return false;

}
return false;
  }






  const handleAnalyse = async () => {
    try {
      const cleanedFen = fenInput.trim().replace(/\s+/g, ' ');
      console.log('DEBUG (Frontend): FEN input received:', fenInput);
      console.log('DEBUG (Frontend): Cleaned FEN:', cleanedFen);

      const tempGame = new Chess();
      const isValidFen = tempGame.load(cleanedFen);
      console.log('DEBUG (Frontend): Is FEN valid from chess.js?', isValidFen);

      if (!isValidFen) {
        setAnalysis({ move: 'Error: Invalid FEN string', score: null });
        console.log('DEBUG (Frontend): FEN is invalid, stopping analysis.');
        return;
      }
     
      setBoardPosition(cleanedFen);
      // --- FIX: Update the key and position to guarantee a re-render ---
      setBoardKey(prevKey => prevKey + 1);
      
      console.log('DEBUG (Frontend): Board position updated to:', cleanedFen);
      setAnalysis({ move: 'Analyzing...', score: null });

      const response = await fetch('https://chesska-ai-chess-analyser-production.up.railway.app/analyse-position', {
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
      console.log('DEBUG (Frontend): Analysis data received:', data);
      setAnalysis({ move: data.best_move, score: data.score });
    }
    catch (error) {
      console.error('Error analysing position:', error);
      setAnalysis({ move: 'Failed to get analysis. Is the backend server running?', score: null }); 
    }
  };

  return (
    <div className="app-container">
      <h1>AI Chess Position Analyser</h1>
      <div className="main-content">
        <div className="board-container">
          {/* --- FIX: Pass the 'key' prop to the Chessboard --- */}
          <Chessboard 
          key={boardKey}
           position={boardPosition}
           onPieceDrop = {onDrop}
           />
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
            <p>Current Board FEN State: {boardPosition}</p> 
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;