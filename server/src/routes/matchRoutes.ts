import { Router } from 'express';
import {
  createMatch,
  getCommentary,
  getMatchById,
  getMatches,
  getScorecard,
} from '../controllers/matchController';

const router = Router();

router.post('/', createMatch);
router.get('/', getMatches);
router.get('/:id', getMatchById);
router.get('/:id/scorecard', getScorecard);
router.get('/:id/commentary', getCommentary);

export default router;
