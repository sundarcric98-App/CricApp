import { Router } from 'express';
import { uploadImage } from '../controllers/uploadController';

const router = Router();

router.post('/', uploadImage);

export default router;
