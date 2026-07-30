import { Router } from 'express';
import { createSale, deleteSale, getSales, getSalesStats, getMostSold, getDailyClose, getDailyCloses, deleteDailyClose, runMigration } from './SaleController.js';
import { protect } from '../../middlewares/AuthMiddleware.js';

const router = Router();

router.use(protect);

router.get('/daily-close', getDailyClose);
router.get('/daily-closes', getDailyCloses);
router.delete('/daily-closes/:id', deleteDailyClose);
router.get('/stats', getSalesStats);
router.get('/most-sold', getMostSold);
router.get('/', getSales);
router.post('/migrate', runMigration);
router.post('/', createSale);
router.delete('/:id', deleteSale);

export default router;
