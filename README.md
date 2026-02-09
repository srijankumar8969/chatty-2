# Chatty

A simple real-time chat application with authentication, profile management, and image uploads via Cloudinary. Built with React + Vite (frontend) and Express + MongoDB (backend). 

---

## Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
  - [Requirements](#requirements)
  - [Environment Variables](#environment-variables)
  - [Local Development](#local-development)
  - [Build & Production](#build--production)
- [API Endpoints](#api-endpoints)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## Features
- Email/password authentication (JWT cookie-based)
- OTP Email Verification (Resend)
- Profile picture upload (Cloudinary)
- Realtime messaging (Socket.io)
- Minimal, responsive UI built with Tailwind/DaisyUI

## Tech Stack
- Frontend: React, Vite, Tailwind, Zustand
- Backend: Node.js, Express, Mongoose, Socket.IO
- Image hosting: Cloudinary

## Project Structure
- `/backend` — Express server, routes, controllers, models
- `/frontend` — React + Vite app
- Root scripts orchestrate install/build across packages

## Quick Start

### Requirements
- Node.js (>=18 recommended)
- npm
- MongoDB connection (Atlas or local)

### Environment Variables (backend `.env`)
Create `backend/.env` with the following:

```
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.example.mongodb.net/dbname
TOKEN_SECRETS=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
RESEND_API_KEY=re_123456789
NODE_ENV=development
```

Optional (for OAuth):
```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=
```

### Local Development
1. Install dependencies for each package:
   - npm install --prefix backend
   - npm install --prefix frontend
2. Start backend (dev):
   - npm run dev --prefix backend
3. Start frontend (dev):
   - npm run dev --prefix frontend

Open the app at http://localhost:5173 (default Vite port) and ensure backend runs on `5001`.

### Build & Production
- Build frontend: `npm run build --prefix frontend` (the root `npm run build` script does this for you)
- Start backend (serves `frontend/dist` in production): `npm run start --prefix backend`

## API Endpoints (summary)
- Auth
  - POST `/api/auth/signup` — create user
  - POST `/api/auth/login` — login (sets JWT cookie)
  - POST `/api/auth/logout` — clears cookie
  - PUT `/api/auth/update-profile` — update profile (accepts JSON base64 `profilePic`)
  - PATCH `/api/auth/upload-avatar` — upload multipart avatar (FormData)
  - GET `/api/auth/check` — validate current auth cookie
- Messages
  - GET `/api/messages/users` — fetch sidebar users
  - GET `/api/messages/:id` — get messages for a conversation
  - POST `/api/messages/send/:id` — send message

## Troubleshooting
- "Payload too large" when uploading images: increase `express.json({ limit: '50mb' })` in `backend/src/index.js` or use multipart upload (smaller base64 payloads recommended).
- Cloudinary upload errors: confirm `CLOUDINARY_*` env vars are set and valid.
- Cookies not set in dev: ensure cookie options use `sameSite: 'lax'` in development and `secure` only in production.

## Contributing
- Create feature branches and open PRs against `main`.
- Keep changes focused and add tests or manual checks for new features.

## License
MIT — feel free to use and modify.

---

If you'd like, I can add a `.env.example`, small health-check endpoint, or CI workflow to run builds automatically. Which would you prefer next?