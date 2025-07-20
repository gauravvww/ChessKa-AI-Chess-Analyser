const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/analyse-position', (req, res) => {
  const { fen } = req.body;
  if (!fen) return res.status(400).json({ error: 'FEN is required' });

  console.log("\uD83D\uDD25 Received FEN:", fen);

  const stockfish = spawn('stockfish');
  stockfish.stdin.write(`position fen ${fen}\n`);
  stockfish.stdin.write('go depth 15\n');

  let bestMove = null;
  let evalScore = null;

  stockfish.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach((line) => {
      if (line.startsWith('info') && line.includes('score')) {
        const match = line.match(/score (cp|mate) (-?\d+)/);
        if (match) {
          evalScore = match[1] === 'cp' ? `${match[2]} centipawns` : `mate in ${match[2]}`;
        }
      }
      if (line.startsWith('bestmove')) {
        bestMove = line.split(' ')[1];
        console.log("\uD83D\uDD25 Sending best move:", bestMove);
        console.log("\uD83D\uDD25 Sending score:", evalScore);

        stockfish.kill();
        res.json({ best_move: bestMove, score: evalScore });
      }
    });
  });

  stockfish.stderr.on('data', (data) => {
    console.error(`Stockfish error: ${data}`);
  });

  stockfish.on('exit', (code) => {
    console.log(`Stockfish exited with code ${code}`);
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`\uD83C\uDF0D Server running on port ${PORT}`));


