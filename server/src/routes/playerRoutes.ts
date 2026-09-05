import { Router } from 'express';
import { getPlayerById } from '../controllers/playerController';

const router = Router();

router.get('/:id', getPlayerById);

export default router;
