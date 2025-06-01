# Next.js Chat Application

This is a modern chat app with real-time support, light/dark mode toggle, encrypted localStorage, and persistent chat history in a MySQL database.

## Features
- User login by unique name only
- Real-time chat (Socket.IO)
- Online users overview
- Chat history stored in MySQL (via Prisma)
- Light/dark mode toggle
- Encrypted user data in localStorage (AES)
- "Clear chat" button to wipe all messages
- Modern and responsive design

## Requirements
- Node.js (recommended 18+)
- MySQL database

## Installation
1. **Clone the repository:**
   ```bash
   git clone ...
   cd chat
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Set up .env:**
   In the project root, create a `.env` file and set:
   ```env
   DATABASE_URL="mysql://user:password@localhost:3306/dbname"
   NEXT_PUBLIC_AES_KEY=somethingverysecret
   ```
4. **Run database migration:**
   ```bash
   npx prisma migrate deploy
   # or for development
   npx prisma migrate dev
   ```
5. **Start the app:**
   ```bash
   npm run dev
   # or
   node server.js
   ```
   The app will run at http://localhost:4000

## Usage
1. **Log in** – enter your (unique) name.
2. **Chat** – send messages, visible to all online users.
3. **Toggle light/dark mode** – button in the top right (sun/moon).
4. **Clear chat** – "Clear chat" button at the bottom left next to the message input (wipes history for everyone).

## Notes
- User data in localStorage is encrypted with AES (key from .env).
- User ID is never stored in localStorage, always verified on the backend.
- If you change .env, restart the server!

## Development
- Main logic: `pages/index.js` (frontend) and `server.js` (backend/socket.io).
- Styles: `styles/globals.css`.
- API for users and messages: `pages/api/users.js` and `pages/api/messages.js`.

## Contact
For questions or modifications, contact the author or open an issue.
