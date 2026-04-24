import { Router } from 'express';
import { getTasks, createTask, updateTask, deleteTask } from '../controllers/task.controller';
import { verifyAuth } from '../middlewares/auth';

const router = Router();

router.get('/', verifyAuth, getTasks);
router.post('/', verifyAuth, createTask);
router.put('/:id', verifyAuth, updateTask);
router.delete('/:id', verifyAuth, deleteTask);

export default router;
