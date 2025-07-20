const express = require('express');
const {spawn} = require('child_process');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());

app.post('/analyse-position', (req,res)=>{
   
  const fen = req.body.fen;
  if(!fen){
    return res.status(400).json({error: 'FEN string is required'});
  }
  const stockfishProcess = spawn('./stockfish');
  let bestMove = null;


  stockfishProcess.stdout.on('data', (data)=>{
    const output = data.toString();

    if(output.includes('bestmove')){
      const match = output.match(/bestmove\s+(\S+)/);
      if(match) {
        bestMove= match[1];
      }
    }
  })
  stockfishProcess.stderr.on('data', (data) => {
    console.error(`Stockfish Error: ${data}`);
  });

  stockfishProcess.on('close',()=>{
    if(bestMove){
        res.json({best_move : bestMove});
    } else {
        res.status(500).json({error: 'Could not determine best move'});
    }
  });

  stockfishProcess.stdin.write(`position fen ${fen}\n`);
  stockfishProcess.stdin.write('go movetime 1000\n');

    setTimeout(() => {
      stockfishProcess.stdin.write('quit\n');
    }, 1500);

});

app.listen(PORT, () => {
  console.log(`Server is running on https://localhost:${PORT}`);
});