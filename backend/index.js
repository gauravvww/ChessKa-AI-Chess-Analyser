const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
// --- CHANGE: Import built-in modules for handling file paths and permissions ---
const path = require('path');
const fs = require('fs');

// --- CHANGE: Create a reliable path to Stockfish and set execute permissions for servers ---
const stockfishPath = path.join(__dirname, 'stockfish');
try {
  fs.chmodSync(stockfishPath, 0o755);
} catch (e) {
  console.error(`Could not set permissions for Stockfish: ${e}`);
}

const app = express();
// --- CHANGE: Use the port provided by the hosting service (Render), or 3000 locally ---
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.post('/analyse-position', (req, res) => {
  const fen = req.body.fen;

  if (!fen) {
    return res.status(400).json({ error: 'FEN string is required' });
  }

  // --- CHANGE: Use the dynamic path variable to start Stockfish ---
  const stockfishProcess = spawn(stockfishPath);
  let bestMove = null;
  let score = null;

  stockfishProcess.stdout.on('data', (data) => {
    const output = data.toString();

    if (output.includes('info score cp')) {
      const scoreMatch = output.match(/score cp (-?\d+)/);
      if (scoreMatch) {
        score = (parseInt(scoreMatch[1], 10) / 100).toFixed(2);
      }
    }

    if (output.includes('bestmove')) {
      const match = output.match(/bestmove\s+(\S+)/);
      if (match) {
        bestMove = match[1];
      }
    }
  });

  stockfishProcess.stderr.on('data', (data) => {
    console.error(`Stockfish Error: ${data}`);
  });

  stockfishProcess.on('close', () => {
    if (bestMove) {
      res.json({ best_move: bestMove, score: score });
    } else {
      res.status(500).json({ error: 'Could not determine best move' });
    }
  });

  stockfishProcess.stdin.write(`position fen ${fen}\n`);
  stockfishProcess.stdin.write('go movetime 1000\n');

  setTimeout(() => {
    stockfishProcess.stdin.write('quit\n');
  }, 1500);
});

app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});
