import { Router } from 'express';
import {
  getSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from './SupplierController.js';
import { protect } from '../../middlewares/AuthMiddleware.js';

const router = Router();

router.use(protect);

router.get('/', getSuppliers);
router.get('/:id', getSupplier);
router.post('/', createSupplier);
router.put('/:id', updateSupplier);
router.delete('/:id', deleteSupplier);

export default router;
