const express = require('express');
const cors = require('cors');

const app = express();

// Allow requests from your frontend
app.use(cors({
  origin: 'https://chesska.vercel.app'
}));

app.use(express.json());

app.post('/analyse-position', (req, res) => {
  const { fen } = req.body;

  if (!fen) {
    return res.status(400).json({ error: 'FEN is required' });
  }

  console.log("✅ Received FEN:", fen);
  
  // Send dummy response
  res.json({
    best_move: 'e2e4',
    score: '50 centipawns'
  });
});

// Basic test route
app.get('/', (req, res) => {
  res.send('♟️ Backend is up and running!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🌍 Server running on port ${PORT}`));

