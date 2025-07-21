const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
console.log(`DEBUG: process.env.PORT from Render is: ${process.env.PORT}`);

const PORT = process.env.PORT || 3000;

const stockfishPath = path.join(__dirname, 'stockfish');

try {
  fs.chmodSync(stockfishPath, 0o755);
} catch (e) {
  console.error(`Could not set permissions for Stockfish: ${e.message}`);
}

const corsOptions = {
  origin: 'https://chesska.vercel.app',
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.use(express.json());

app.post('/analyse-position', (req, res) => {
  const fen = req.body.fen;

  if (!fen) {
    return res.status(400).json({ error: 'FEN string is required' });
  }

  const stockfishProcess = spawn(stockfishPath);
  let bestMove = null;
  let score = null;
  let errorOccurred = false;

  stockfishProcess.stdout.on('data', (data) => {
    const output = data.toString();

    const scoreMatch = output.match(/score cp (-?\d+)/);
    if (scoreMatch) {
      score = (parseInt(scoreMatch[1], 10) / 100).toFixed(2);
    }

    const bestMoveMatch = output.match(/bestmove\s+(\S+)/);
    if (bestMoveMatch) {
      bestMove = bestMoveMatch[1];
    }
  });

  stockfishProcess.stderr.on('data', (data) => {
    errorOccurred = true;
  });

  stockfishProcess.on('close', (code) => {
    if (errorOccurred || !bestMove) {
      res.status(500).json({ error: 'Could not determine best move or an error occurred during analysis.' });
    } else {
      res.json({ best_move: bestMove, score: score });
    }
  });

  stockfishProcess.on('error', (err) => {
    errorOccurred = true;
    if (!res.headersSent) {
      res.status(500).json({ error: `Failed to start Stockfish: ${err.message}` });
    }
  });

  stockfishProcess.stdin.write('uci\n');
  stockfishProcess.stdin.write('isready\n');
  stockfishProcess.stdin.write(`position fen ${fen}\n`);
  stockfishProcess.stdin.write('go movetime 3000\n');
});

app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});
