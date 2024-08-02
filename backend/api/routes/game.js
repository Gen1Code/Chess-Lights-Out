import express from 'express';

const router = express.Router();

router.post('/play', async (req, res) => {
    res.json({ message: "looking For a game" });
});
  

export default router;