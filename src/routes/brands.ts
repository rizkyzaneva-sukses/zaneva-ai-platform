import { Router } from 'express';
import { getAllBrands, getBrand, createBrand, updateBrand, deleteBrand } from '../controllers/brand.controller';
import { verifyAuth, requireRole } from '../middlewares/auth';

const router = Router();

router.get('/', verifyAuth, getAllBrands);
router.get('/:id', verifyAuth, getBrand);
router.post('/', verifyAuth, requireRole('OWNER'), createBrand);
router.put('/:id', verifyAuth, requireRole('OWNER'), updateBrand);
router.delete('/:id', verifyAuth, requireRole('OWNER'), deleteBrand);

export default router;
