const express = require('express');
const cors = require('cors');
// const { spawn } = require('child_process'); // COMMENT THIS OUT
const path = require('path');
// const fs = require('fs'); // COMMENT THIS OUT

const app = express();

console.log(`DEBUG: process.env.PORT from Railway is: ${process.env.PORT}`);
const PORT = process.env.PORT || 3000;

// const stockfishPath = path.join(__dirname, 'stockfish'); // COMMENT THIS OUT
// try { // COMMENT THIS OUT
//   fs.chmodSync(stockfishPath, 0o755); // COMMENT THIS OUT
//   console.log('Stockfish permissions set to 0o755'); // COMMENT THIS OUT
// } catch (e) { // COMMENT THIS OUT
//   console.error(`Could not set permissions for Stockfish: ${e.message}`); // COMMENT THIS OUT
// } // COMMENT THIS OUT

const corsOptions = {
  origin: 'https://chesska.vercel.app',
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());

app.post('/analyse-position', (req, res) => {
  const fen = req.body.fen;

  console.log(`Received analysis request for FEN (Stockfish bypassed): ${fen}`); // New log

  if (!fen) {
    console.error('FEN string is missing from request.');
    return res.status(400).json({ error: 'FEN string is required' });
  }

  // --- TEMPORARY: RETURN A DUMMY RESPONSE INSTEAD OF SPAWNING STOCKFISH ---
  return res.json({ best_move: 'e2e4 (Dummy Move)', score: '+0.50 (Dummy Score)' });
  // --- END TEMPORARY CHANGE ---

  // All stockfishProcess related code below this line should be commented out or removed
  // const stockfishProcess = spawn(stockfishPath);
  // let bestMove = null;
  // let score = null;
  // let errorOccurred = false;
  // // ... (rest of stockfishProcess event handlers and stdin.write calls)
});

app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});