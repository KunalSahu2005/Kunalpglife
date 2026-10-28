# Mini Store - Full Stack E-commerce Project

A simple online store.

- Frontend: React (index.html)
- Backend: Node.js + Express (server.js)
- Database: MongoDB (Mongoose)
- Login: JWT + bcrypt

## Features
- Signup and Login
- Product list with search
- Cart (add, change quantity, remove)
- Place order and order history
- Add / delete products after login

## Files
- server.js - backend (models, routes, login check)
- index.html - frontend (React)
- package.json - packages list
- env.example.txt - example of .env (rename to .env and add your own values)

## How to run
1. Install Node.js
2. Make a `.env` file with `MONGO_URI` (MongoDB Atlas link) and `JWT_SECRET`
3. Run `npm install` then `npm start`
4. Open http://localhost:5000
