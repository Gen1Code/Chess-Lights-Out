import express from 'express';
const router = express.Router();

// Import the routers
import testRouter from './test.js';

// Mount dev routers
if (process.env.NODE_ENV !== 'production') {
  router.use('/test', testRouter);
}

// Mount the routers


export default router   
