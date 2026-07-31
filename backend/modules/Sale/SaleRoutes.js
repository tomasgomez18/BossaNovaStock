import { Router } from 'express';
import { createSale, deleteSale, getSales, getSalesStats, getMostSold, getDailyClose, getDailyCloses, deleteDailyClose, runMigration } from './SaleController.js';
import { protect, admin } from '../../middlewares/AuthMiddleware.js';

const router = Router();

router.use(protect);

router.get('/daily-close', getDailyClose);
router.get('/daily-closes', getDailyCloses);
router.delete('/daily-closes/:id', admin, deleteDailyClose);
router.get('/stats', getSalesStats);
router.get('/most-sold', getMostSold);
router.get('/', getSales);
router.post('/migrate', admin, runMigration);
router.post('/', createSale);
router.delete('/:id', admin, deleteSale);

export default router;
