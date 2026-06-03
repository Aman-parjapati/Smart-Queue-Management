# SmartQueue — Skip the Wait

A full-stack real-time queue management system for clinics, salons, government offices and small hospitals. Customers book slots online, get a token with a QR code, and track their queue position live — no more guessing how long the wait is.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React + Vite + Tailwind CSS |
| Backend | Node.js + Express |
| Real-time | SSE (Server-Sent Events) |
| Database | Supabase (Postgres) |
| Cache | Upstash Redis |
| Auth | JWT + bcrypt |
| SMS | Twilio |
| QR Code | `qrcode` npm |
| Deploy | Vercel (frontend) + Railway (backend) |

---

## Quick Start

### 1. Clone & install

```bash
git clone <your-repo>
cd smart-queue
npm install          # root
cd server && npm install
cd ../client && npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run `server/schema.sql`
3. Copy your project URL and anon key

### 3. Set up Upstash Redis

1. Create a Redis database at [upstash.com](https://upstash.com)
2. Copy the REST URL and token

### 4. Configure environment

```bash
cp server/.env.example server/.env
# Fill in all values
```

### 5. Run

```bash
# From root — runs both server and client
npm run dev

# Or separately:
cd server && npm run dev    # http://localhost:5000
cd client && npm run dev    # http://localhost:5173
```

---

## Project Structure

```
smart-queue/
├── client/                     # React + Vite
│   └── src/
│       ├── pages/
│       │   ├── Home.jsx         # Browse businesses
│       │   ├── Login.jsx
│       │   ├── Register.jsx
│       │   ├── BookSlot.jsx     # Pick date + slot
│       │   ├── MyToken.jsx      # Live queue pos + QR
│       │   ├── AdminDashboard.jsx
│       │   └── QueueBoard.jsx   # Public display
│       ├── components/
│       │   └── Layout.jsx
│       ├── hooks/
│       │   └── useSSE.js        # SSE connection hook
│       └── lib/
│           ├── api.js           # Axios + JWT inject
│           └── AuthContext.jsx
│
└── server/                     # Node.js + Express
    ├── schema.sql               # Run in Supabase
    └── src/
        ├── routes/
        │   ├── auth.js
        │   ├── businesses.js
        │   ├── slots.js
        │   ├── bookings.js
        │   ├── queue.js         # SSE endpoint
        │   └── analytics.js
        ├── controllers/
        ├── middleware/
        │   ├── auth.js          # JWT verify
        │   └── rateLimiter.js
        ├── services/
        │   ├── sseService.js    # Broadcast engine
        │   ├── queueService.js  # Redis cache + logic
        │   ├── twilioService.js # SMS/WhatsApp
        │   └── qrService.js    # QR generation
        └── db/
            ├── supabase.js
            └── redis.js
```

---

## API Reference

### Auth
| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login, get JWT |
| GET | `/api/auth/me` | Get current user |

### Businesses
| Method | Path | Auth |
|---|---|---|
| GET | `/api/businesses` | Public |
| GET | `/api/businesses/:id` | Public |
| POST | `/api/businesses` | Admin |
| PUT | `/api/businesses/:id` | Admin |

### Slots
| Method | Path | Auth |
|---|---|---|
| GET | `/api/slots/business/:id?date=YYYY-MM-DD` | Public |
| POST | `/api/slots` | Admin/Staff |

### Bookings
| Method | Path | Auth |
|---|---|---|
| POST | `/api/bookings` | Customer |
| GET | `/api/bookings/my` | Customer |
| GET | `/api/bookings/:id` | Customer |
| POST | `/api/bookings/checkin` | Admin/Staff |

### Queue (Real-time)
| Method | Path | Auth |
|---|---|---|
| GET | `/api/queue/live/:businessId` | Public (SSE) |
| GET | `/api/queue/status/:slotId` | Public |
| POST | `/api/queue/next` | Admin/Staff |
| POST | `/api/queue/skip` | Admin/Staff |

### Analytics
| Method | Path | Auth |
|---|---|---|
| GET | `/api/analytics/:businessId?date=YYYY-MM-DD` | Admin/Staff |

---

## Deployment

### Frontend → Vercel

```bash
cd client
npm run build
# Push to GitHub → Import in Vercel
# Set VITE_API_URL env var if needed
```

### Backend → Railway

1. Push to GitHub
2. Create Railway project from repo
3. Set root to `/server`
4. Add all env vars from `.env.example`
5. Deploy

---

## Features

### Customer Flow
1. Browse businesses on Home page
2. Click "Book Slot" → choose date + time slot
3. Confirm booking → receive token + QR code
4. Open `/token/:id` to see live queue position
5. Show QR to staff on arrival for check-in
6. Receive SMS when 2 tokens away (via Twilio)

### Admin/Staff Flow
1. Login with `admin` or `staff` role
2. Go to `/admin` dashboard
3. **Queue tab** — call next, skip tokens, see live queue
4. **Slots tab** — create new time slots
5. **Analytics tab** — today's served/skipped/pending counts + peak hour chart
6. **Check-in tab** — manual check-in by booking ID

### Public Queue Board
- Visit `/board/:businessId` for a public display screen (TV-friendly)
- Shows "Now Serving" + full waiting queue
- Auto-updates via SSE — no refresh needed

---

## How SSE Works

```
Admin clicks "Call Next"
        ↓
POST /api/queue/next
        ↓
Backend updates DB → invalidates Redis cache
        ↓
broadcastQueue() writes to all open SSE connections
        ↓
Every connected browser receives the update instantly
        ↓
React state updates → UI re-renders
```

No WebSockets, no Socket.io. EventSource is built into every browser.

---

## Add-ons (after core)

- **AI wait prediction** — Python microservice (scikit-learn) using historical queue_events data
- **Walk-in token** — admin generates token on-site without prior booking
- **Multi-branch** — `branch` field already in businesses table
- **Staff analytics** — tokens served per staff member per hour
