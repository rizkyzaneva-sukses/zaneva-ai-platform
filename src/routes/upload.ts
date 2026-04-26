import { Router } from 'express';
import multer from 'multer';
import { uploadFile, clearBrandData } from '../controllers/upload.controller';
import { verifyAuth } from '../middlewares/auth';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.mimetype === 'application/csv' || file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.originalname.endsWith('.csv') || file.originalname.endsWith('.xlsx')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and XLSX files are allowed'));
    }
  }
});

const router = Router();

router.post('/file', verifyAuth, upload.single('file'), uploadFile);
router.delete('/clear', verifyAuth, clearBrandData);

export default router;
