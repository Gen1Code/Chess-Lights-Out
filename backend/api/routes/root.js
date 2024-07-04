import express from 'express';
const router = express.Router();

// Import the routers
import testRouter from './test.js';
import authRouter from './auth.js';
import gameRouter from './game.js';

// Mount dev routers
if (process.env.NODE_ENV !== 'production') {
  router.use('/test', testRouter);
}

// Mount the routers
router.use('/auth', authRouter);
router.use('/game', gameRouter);

export default router   
