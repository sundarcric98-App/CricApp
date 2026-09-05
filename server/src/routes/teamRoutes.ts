import { Router } from 'express';
import { addPlayerToTeam, createTeam, getTeamById, getTeams } from '../controllers/teamController';

const router = Router();

router.post('/', createTeam);
router.get('/', getTeams);
router.get('/:id', getTeamById);
router.post('/:id/players', addPlayerToTeam);

export default router;
