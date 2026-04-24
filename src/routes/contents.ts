import { Router } from 'express';
import { getContents, getContent, deleteContent, getContentStats } from '../controllers/content.controller';
import { verifyAuth } from '../middlewares/auth';

const router = Router();

router.get('/', verifyAuth, getContents);
router.get('/stats', verifyAuth, getContentStats);
router.get('/:id', verifyAuth, getContent);
router.delete('/:id', verifyAuth, deleteContent);

export default router;
