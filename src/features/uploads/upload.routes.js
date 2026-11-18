import { Router } from 'express';
import multer from 'multer';
import * as uploadController from './upload.controller.js';
import { protect, requireStaff } from '../../middleware/auth.js';

const MAX_FILE_BYTES = 50 * 1024 * 1024;

// Images, videos and PDF documents may be uploaded to Cloudinary.
const ALLOWED_MIME = [/^image\//, /^video\//, /^application\/pdf$/];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_BYTES },
  fileFilter(req, file, callback) {
    if (!ALLOWED_MIME.some((pattern) => pattern.test(file.mimetype))) {
      callback(new Error('Unsupported file type. Upload an image, video or PDF.'));
      return;
    }
    callback(null, true);
  },
});

const router = Router();

router.post('/', protect, requireStaff, upload.single('file'), uploadController.uploadMedia);
router.delete('/', protect, requireStaff, uploadController.deleteMedia);

export default router;
