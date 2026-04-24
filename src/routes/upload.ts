import { Router } from 'express';
import multer from 'multer';
import { uploadCSV } from '../controllers/upload.controller';
import { verifyAuth } from '../middlewares/auth';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

const router = Router();

router.post('/csv', verifyAuth, upload.single('file'), uploadCSV);

export default router;
