import { Router } from 'express';
import { recordBallEvent, undoLastBall } from '../controllers/scoringController';

const router = Router();

router.post('/ball', recordBallEvent);
router.post('/undo', undoLastBall);

export default router;
