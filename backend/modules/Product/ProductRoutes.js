import { Router } from 'express';
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getDashboardStats,
  sellProduct,
  exchangeProduct,
  addStock,
  migrateVariants,
  getLowStock,
} from './ProductController.js';
import { protect } from '../../middlewares/AuthMiddleware.js';

const router = Router();

router.use(protect);

router.get('/stats', getDashboardStats);
router.get('/low-stock', getLowStock);
router.get('/', getProducts);
router.get('/:id', getProduct);
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.put('/:id/sell', sellProduct);
router.put('/:id/add-stock', addStock);
router.post('/exchange', exchangeProduct);
router.delete('/:id', deleteProduct);
router.post('/migrate-variants', migrateVariants);

export default router;
