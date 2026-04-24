import { Router } from 'express';
import { runAnalysis, getAnalyses, getAnalysis } from '../controllers/ai.controller';
import { verifyAuth } from '../middlewares/auth';

const router = Router();

router.post('/analyze', verifyAuth, runAnalysis);
router.get('/', verifyAuth, getAnalyses);
router.get('/:id', verifyAuth, getAnalysis);

export default router;
