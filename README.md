# Streamer Shared Loyalty API

This repo contains a small Node.js + Express API that stores shared loyalty points in Firebase Firestore.

## How to run locally

1. `git clone <repo-url>`
2. `npm install`
3. Create a local `.env` (not committed) with:
   - `FIREBASE_SERVICE_ACCOUNT_BASE64` (the service account JSON base64-encoded)
   - `MASTER_API_KEY` (a secret key)
4. `npm start`
