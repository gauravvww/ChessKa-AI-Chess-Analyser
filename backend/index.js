const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();

// Log the port environment variable for debugging (undefined locally, 8080 on Railway)
console.log(`DEBUG: process.env.PORT is: ${process.env.PORT}`);
const PORT = process.env.PORT || 3000; // Use 3000 locally if PORT env var is not set

// Path to the Stockfish executable
// Ensure your Mac-specific Stockfish binary is in this folder
const stockfishPath = path.join(__dirname, 'stockfish');

// Attempt to set executable permissions for Stockfish
// This is crucial for Linux deployments and good practice locally
try {
  fs.chmodSync(stockfishPath, 0o755);
  console.log('Stockfish permissions set to 0o755');
} catch (e) {
  console.error(`Could not set permissions for Stockfish: ${e.message}`);
}

// CORS configuration - allow requests from your local frontend (Vite's default)
const corsOptions = {
  origin: 'https://chesska.vercel.app', // IMPORTANT: This must match your local frontend URL
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Middleware to parse JSON request bodies
app.use(express.json());

// API endpoint for chess position analysis
app.post('/analyse-position', (req, res) => {
  const fen = req.body.fen;

  // Log incoming request
  console.log(`Received analysis request for FEN: ${fen}`);

  // Validate FEN string presence
  if (!fen) {
    console.error('FEN string is missing from request.');
    return res.status(400).json({ error: 'FEN string is required' });
  }

  // Spawn Stockfish as a child process
  let stockfishProcess;
  try {
    console.log(`Attempting to spawn Stockfish from: ${stockfishPath}`);
    stockfishProcess = spawn(stockfishPath);
    console.log('Stockfish process spawned successfully.');
  } catch (spawnError) {
    console.error(`ERROR: Failed to initiate Stockfish spawn: ${spawnError.message}`);
    // If spawn fails immediately, send a 500 response
    if (!res.headersSent) {
      return res.status(500).json({ error: `Failed to start Stockfish process: ${spawnError.message}` });
    }
  }

  let bestMove = null;
  let score = null;
  let errorOccurred = false;

  // Handle data coming from Stockfish's stdout
  stockfishProcess.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(`Stockfish Output: ${output}`); // CRUCIAL LOG FOR DEBUGGING

    // Extract score if available
    // Stockfish sends multiple 'info score cp' lines, we want the last one before bestmove
    const scoreMatch = output.match(/score cp (-?\d+)/);
    if (scoreMatch) {
      score = (parseInt(scoreMatch[1], 10) / 100).toFixed(2);
    }

    // Extract best move
    // 'bestmove' is usually the last line after analysis is complete
    const bestMoveMatch = output.match(/bestmove\s+(\S+)/);
    if (bestMoveMatch) {
      bestMove = bestMoveMatch[1];
      stockfishProcess.stdin.write('quit\n'); // <--- THIS IS THE CRUCIAL LINE I MISSED BEFORE
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
    console.log(`DEBUG: Final bestMove: ${bestMove}, Final score: ${score}`); // DEBUG LOG FOR FINAL VALUES

    if (errorOccurred || !bestMove) { // If an error occurred or bestMove was never found
      console.error('Failed to determine best move or an error occurred during Stockfish analysis.');
      // Ensure response is only sent once
      if (!res.headersSent) {
        res.status(500).json({ error: 'Could not determine best move or an error occurred during analysis.' });
      }
    } else { // If analysis was successful
      console.log(`Analysis complete: Best Move: ${bestMove}, Score: ${score}`); // CRUCIAL LOG FOR DEBUGGING
      // Ensure response is only sent once
      if (!res.headersSent) {
        res.json({ best_move: bestMove, score: score });
      }
    }
  });

  // Handle potential errors when spawning Stockfish (e.g., executable not found or permissions)
  stockfishProcess.on('error', (err) => {
    console.error(`Failed to start Stockfish process (on 'error' event): ${err.message}`); // CRUCIAL LOG FOR DEBUGGING
    errorOccurred = true;
    // Send an error response if Stockfish couldn't even start, and headers haven't been sent
    if (!res.headersSent) {
      res.status(500).json({ error: `Failed to start Stockfish: ${err.message}` });
    }
  });

  // Send UCI commands to Stockfish
  // Ensure Stockfish is ready before sending position/go commands
  stockfishProcess.stdin.write('uci\n'); // Initialize UCI protocol
  stockfishProcess.stdin.write('isready\n'); // Wait for engine to be ready
  stockfishProcess.stdin.write(`position fen ${fen}\n`); // Set the position
  stockfishProcess.stdin.write('go movetime 3000\n'); // Analyze for 3 seconds (3000 milliseconds)
});

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`); // Confirm which port the server is listening on
});