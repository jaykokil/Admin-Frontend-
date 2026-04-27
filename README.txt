UPDATED ADMIN FRONTEND

This admin frontend is made for the updated backend ZIP.

It connects to:
GET    /api/bottles
POST   /api/bottles
PUT    /api/bottles/:id
DELETE /api/bottles/:id
GET    /api/readings
DELETE /api/readings/:id

Login:
Username: admin
Password: 1234

Local setup:
1. Extract ZIP
2. Run:
   npm install
   npm run dev

Environment:
.env already contains:
VITE_API_URL=https://back-a9dq.onrender.com/api

For Vercel:
Add Environment Variable:
VITE_API_URL = https://back-a9dq.onrender.com/api

Important:
This admin frontend does NOT include scanner component.
Scanner is only for main website.
Admin panel is only for adding/editing/deleting bottles and viewing scanned history.
