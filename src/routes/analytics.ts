import { Router } from 'express';
import { getCreatorLeaderboard, getProductPerformance } from '../controllers/analytics.controller';
import { verifyAuth, requireBrandAccess } from '../middlewares/auth';

const router = Router();

router.get('/creator-leaderboard', verifyAuth, getCreatorLeaderboard);
router.get('/product-performance', verifyAuth, getProductPerformance);

export default router;
