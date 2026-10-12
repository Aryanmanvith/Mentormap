# MentorMap

Structured mentorship platform (MERN) from the *MentorMap 2.0* project deck: students, alumni mentors and institution admins share one mentorship record covering **profile → match → schedule → goals → shared knowledge → feedback/analytics**.

## Architecture (slide 5)

| Layer | Implementation |
|---|---|
| React client (`client/`) | Vite + React Router; role-based UI: student portal, mentor workspace, admin dashboard, search & filters |
| Node/Express API (`server/`) | Auth & profiles, matching & availability, sessions & reminders, goals/resources/feedback, admin analytics & moderation |
| MongoDB | `User`, `Mentorship`, `Session`, `Goal`, `Resource` (resources + Q&A), `Feedback`, `AuditLog` |
| Integrations | Calendar: `.ics` export per session · Video: auto-generated Jitsi meeting link · Reminders: `node-cron` job via pluggable `notify()` (console by default; swap in SMTP/push) |
| Cross-cutting | JWT auth, role authorization, zod input validation, audit logs, helmet + CORS + rate-limited auth, bcrypt password hashing |

### Lifecycle mapping

1. **Profile** – `PUT /api/users/me` (interests, skills, industry, target role, availability)
2. **Match** – `GET /api/users/mentors/match` ranks verified mentors with explainable reasons (`server/src/services/matching.js`)
3. **Schedule** – `POST /api/sessions` (conflict detection, meeting link, `.ics`, reminders)
4. **Set goals** – `/api/goals` with milestones and progress
5. **Share knowledge** – `/api/resources` resources + Q&A threads, search, flagging
6. **Review** – `/api/feedback` (ratings + mentor action items) and `/api/admin/analytics`

## Run it

Requires Node 18+ and MongoDB (local or Atlas).

```bash
npm run install:all
# server/.env already copied from .env.example – edit MONGO_URI / JWT_SECRET
npm run seed      # demo data
npm run dev       # API :5000, client :5173
npm test          # matching + ICS unit tests
```

Demo logins (password `password123`): `asha@mentormap.dev` (student), `priya@mentormap.dev` (mentor), `admin@mentormap.dev` (admin). `sam@mentormap.dev` is an unverified mentor to try the admin verification flow.

## API summary

`/api/auth` register · login · me — `/api/users` profile, mentor match — `/api/mentorships` request/accept/decline/complete — `/api/sessions` CRUD + `/:id/ics` — `/api/goals` — `/api/resources` (+ answers, flag) — `/api/feedback` — `/api/admin` analytics, mentor verification, moderation, audit log.

Admins are provisioned via the seed script/database; public registration only allows student or mentor.
