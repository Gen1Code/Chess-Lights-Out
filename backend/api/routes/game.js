import express from 'express';

const router = express.Router();

router.get('/play', (req, res) => {
    res.send('Looking for a game to play');
});
  

export default router;