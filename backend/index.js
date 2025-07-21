const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();

// Log the port environment variable, now correctly referencing Railway
console.log(`DEBUG: process.env.PORT from Railway is: ${process.env.PORT}`);
const PORT = process.env.PORT || 3000; // Railway will set process.env.PORT

// Path to the Stockfish executable
const stockfishPath = path.join(__dirname, 'stockfish');

// Attempt to set executable permissions for Stockfish
try {
  fs.chmodSync(stockfishPath, 0o755);
  console.log('Stockfish permissions set to 0o755'); // Crucial log
} catch (e) {
  console.error(`Could not set permissions for Stockfish: ${e.message}`); // Crucial log
}

// CORS configuration - allow requests from your Vercel frontend
const corsOptions = {
  origin: 'https://chesska.vercel.app', // Ensure this is your EXACT Vercel frontend URL
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Middleware to parse JSON request bodies
app.use(express.json());

// API endpoint for chess position analysis
app.post('/analyse-position', (req, res) => {
  const fen = req.body.fen;

  // Log incoming request
  console.log(`Received analysis request for FEN: ${fen}`); // Crucial log

  // Validate FEN string presence
  if (!fen) {
    console.error('FEN string is missing from request.'); // Crucial log
    return res.status(400).json({ error: 'FEN string is required' });
  }

  // Spawn Stockfish as a child process
  const stockfishProcess = spawn(stockfishPath);
  let bestMove = null;
  let score = null;
  let errorOccurred = false;

  // Handle data coming from Stockfish's stdout
  stockfishProcess.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(`Stockfish Output: ${output}`); // CRUCIAL LOG FOR DEBUGGING

    // Extract score if available
    const scoreMatch = output.match(/score cp (-?\d+)/);
    if (scoreMatch) {
      score = (parseInt(scoreMatch[1], 10) / 100).toFixed(2);
    }

    // Extract best move
    const bestMoveMatch = output.match(/bestmove\s+(\S+)/);
    if (bestMoveMatch) {
      bestMove = bestMoveMatch[1];
    }
  });

  // Handle errors from Stockfish's stderr
  stockfishProcess.stderr.on('data', (data) => {
    const errorOutput = data.toString();
    console.error(`Stockfish Error: ${errorOutput}`); // CRUCIAL LOG FOR DEBUGGING
    errorOccurred = true;
  });

  // Handle Stockfish process closing
  stockfishProcess.on('close', (code) => {
    console.log(`Stockfish process closed with code ${code}`); // CRUCIAL LOG FOR DEBUGGING

    if (errorOccurred || !bestMove) {
      console.error('Failed to determine best move or an error occurred during Stockfish analysis.'); // Crucial log
      // Ensure response is only sent once
      if (!res.headersSent) {
        res.status(500).json({ error: 'Could not determine best move or an error occurred during analysis.' });
      }
    } else {
      console.log(`Analysis complete: Best Move: ${bestMove}, Score: ${score}`); // Crucial log
      // Ensure response is only sent once
      if (!res.headersSent) {
        res.json({ best_move: bestMove, score: score });
      }
    }
  });

  // Handle potential errors when spawning Stockfish (e.g., executable not found)
  stockfishProcess.on('error', (err) => {
    console.error(`Failed to start Stockfish process: ${err.message}`); // CRUCIAL LOG FOR DEBUGGING
    errorOccurred = true;
    if (!res.headersSent) {
      res.status(500).json({ error: `Failed to start Stockfish: ${err.message}` });
    }
  });

  // Send UCI commands to Stockfish
  stockfishProcess.stdin.write('uci\n');
  stockfishProcess.stdin.write('isready\n');
  stockfishProcess.stdin.write(`position fen ${fen}\n`);
  stockfishProcess.stdin.write('go movetime 3000\n'); // Analyze for 3 seconds
});

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`); // Crucial log
});