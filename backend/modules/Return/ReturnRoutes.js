import { Router } from 'express';
import { createReturn, getReturns, deleteReturn } from './ReturnController.js';
import { protect } from '../../middlewares/AuthMiddleware.js';

const router = Router();

router.use(protect);

router.get('/', getReturns);
router.post('/', createReturn);
router.delete('/:id', deleteReturn);

export default router;
