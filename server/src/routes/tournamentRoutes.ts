import { Router } from 'express';
import {
  createTournament,
  getTournaments,
  getTournamentStandings,
} from '../controllers/tournamentController';

const router = Router();

router.post('/', createTournament);
router.get('/', getTournaments);
router.get('/:id/standings', getTournamentStandings);

export default router;
