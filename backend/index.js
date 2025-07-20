const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const stockfishPath = path.join(__dirname, 'stockfish');
try {
  fs.chmodSync(stockfishPath, 0o755);
} catch (e) {
  console.error(`Could not set permissions for Stockfish: ${e}`);
}

const app = express();
const PORT = process.env.PORT || 3000;

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
 
  stockfishProcess.stdin.write('go movetime 2000\n');

  
  setTimeout(() => {
    stockfishProcess.stdin.write('quit\n');
  }, 2500);
});

app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});
