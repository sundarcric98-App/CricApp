# CricLiveX Backend & Supabase Database Guide

Production-ready Node.js + Express.js backend with Supabase PostgreSQL database and real-time Socket.io broadcasting for the CricLiveX Cricket Scoring application.

---

## 🗄️ 1. Supabase Database Setup

### Step 1: Create Database Tables in Supabase
1. Log in to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Create a new project (e.g. `criclivex-db`).
3. In the left sidebar, click **SQL Editor**.
4. Click **New query**, then copy & paste the entire contents of [`server/db/schema.sql`](./db/schema.sql).
5. Click **Run** (or `Ctrl + Enter`).
   - This creates all **11 tables** matching your ER diagram:
     1. `users`
     2. `player_stats`
     3. `teams`
     4. `team_players`
     5. `tournaments`
     6. `tournament_teams`
     7. `points_table`
     8. `matches`
     9. `innings`
     10. `ball_events`
     11. `match_comments`

### Step 2: Seed Initial Test Data (Optional but Recommended)
1. In the Supabase **SQL Editor**, open another new query.
2. Copy & paste the contents of [`server/db/seed.sql`](./db/seed.sql).
3. Click **Run**.
   - This seeds sample teams (Bengaluru Royals, Mumbai Warriors, Chennai Kings, Kolkata Knights), players (Virat Kohli, Rohit Sharma, Jasprit Bumrah, etc.), a live match, innings, and initial ball events.

---

## 🔑 2. Configure Backend Credentials

1. In Supabase Dashboard, navigate to **Project Settings** -> **API**.
2. Copy:
   - **Project URL** (`https://<project-id>.supabase.co`)
   - **anon key** or **service_role key**
3. In the `server/` directory, open `.env` and set your credentials:

```env
PORT=5000
NODE_ENV=development

SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

JWT_SECRET=criclivex_super_secret_jwt_key_2025
```

---

## 🚀 3. Run the Backend Server

```bash
# Navigate to backend directory
cd server

# Install dependencies (already installed)
npm install

# Start development server with auto-reload
npm run dev

# Or build & run for production
npm run build
npm start
```

Server will start on `http://localhost:5000` with real-time Socket.io enabled.

---

## 📡 4. REST API Endpoints Reference

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Description | Payload |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new user + player profile | `{ mobile, name, pin, profileImage }` |
| `POST` | `/api/auth/login` | Login with Mobile and 4-digit PIN | `{ mobile, pin }` |
| `GET` | `/api/auth/profile/:id` | Fetch user profile and stats | — |

### 🛡️ Teams (`/api/teams`)
| Method | Endpoint | Description | Payload |
|---|---|---|---|
| `POST` | `/api/teams` | Create a new team | `{ name, logoUrl, createdBy }` |
| `GET` | `/api/teams` | List all teams | — |
| `GET` | `/api/teams/:id` | Get team details & player roster | — |
| `POST` | `/api/teams/:id/players` | Add player to team with role | `{ userId, role }` |

### 🏆 Tournaments (`/api/tournaments`)
| Method | Endpoint | Description | Payload |
|---|---|---|---|
| `POST` | `/api/tournaments` | Create a tournament | `{ name, location, overs, startDate, endDate }` |
| `GET` | `/api/tournaments` | List all tournaments | — |
| `GET` | `/api/tournaments/:id/standings` | Get tournament points table | — |

### 🏏 Matches (`/api/matches`)
| Method | Endpoint | Description | Query / Payload |
|---|---|---|---|
| `POST` | `/api/matches` | Create a match | `{ tournamentId, teamAId, teamBId, overs, venue }` |
| `GET` | `/api/matches` | List matches | `?status=live` or `upcoming` or `completed` |
| `GET` | `/api/matches/:id` | Get full match details | — |
| `GET` | `/api/matches/:id/scorecard` | Get match scorecard (innings 1 & 2) | — |
| `GET` | `/api/matches/:id/commentary` | Get ball-by-ball commentary | — |

### ⚡ Live Scoring & Ball Events (`/api/scoring`)
| Method | Endpoint | Description | Payload |
|---|---|---|---|
| `POST` | `/api/scoring/ball` | Record ball event & broadcast real-time | `{ matchId, inningNo, over, ball, batsmanId, bowlerId, runsScored, extraType, isWicket, wicketType, commentaryText }` |
| `POST` | `/api/scoring/undo` | Undo last ball delivery & rollback innings | `{ matchId }` |

### 👤 Players (`/api/players`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/players/:id` | Get player profile & career statistics |

---

## ⚡ 5. Real-Time Socket.io Events

- **Client Subscribe**: `socket.emit('subscribe_match', { matchId })`
- **Server Broadcasts**:
  - `score_update`: Emits updated runs, wickets, overs, and ball details.
  - `wicket_alert`: Emits instant wicket notifications.
  - `match_status`: Emits toss, innings completion, and match end events.
