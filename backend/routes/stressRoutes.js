import express from 'express';
import stressController from '../controllers/stressController.js';
import upload from '../config/multer.js';

const stressRouter = express.Router();

stressRouter
  .post('/', stressController.getStress)
  

export default stressRouter;