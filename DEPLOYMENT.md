# Catalogue Website - Free Deployment Guide

This guide outlines exactly how to deploy the decoupled architecture of the Catalogue application to absolute zero-dollar cloud hosting services.

## Architecture Overview
The application is separated into two parts:
1. **Frontend:** A static folder (`/frontend`) containing Vanilla HTML/CSS/JS. It can be hosted on any static site generator/CDN.
2. **Backend:** A Node.js/Express REST API (`/backend`) connecting to MongoDB.

---

## 1. Frontend Deployment (Vercel or Netlify)

Because the frontend uses Vanilla JS/HTML with no build step, deploying it is incredibly fast and completely free on Vercel or Netlify.

### Option A: Using Vercel (Recommended for speed)
1. Push your entire repository to GitHub.
2. Go to [Vercel.com](https://vercel.com) and create an account.
3. Click **Add New -> Project** and import your GitHub repository.
4. **Configuration:**
   - **Framework Preset:** `Other` (or leave as default).
   - **Root Directory:** Edit this and select `frontend`.
   - **Build Command:** Leave empty (override it if necessary, as there is no build step).
   - **Output Directory:** Leave empty (it will serve the folder as is).
5. Click **Deploy**. Vercel will give you a live URL (e.g., `https://catalogue-front.vercel.app`).

### Option B: Using Netlify
1. Go to [Netlify.com](https://netlify.com) and sign in.
2. Click **Add new site -> Import an existing project**.
3. Connect your GitHub repository.
4. **Configuration:**
   - **Base directory:** `frontend`
   - **Build command:** (Leave blank)
   - **Publish directory:** `frontend`
5. Click **Deploy Site**.

**Important Configuration:**
Once deployed, make note of the frontend URL. You will need to update `app.js` later:
```javascript
// In app.js, change this:
const API_BASE = 'http://localhost:3000/api';
// To your upcoming backend URL:
const API_BASE = 'https://your-backend.onrender.com/api';
```

---

## 2. Backend Deployment (Render or Railway)

The Node.js server needs a runtime environment. Services like Render and Railway offer generous free tiers.

### Option A: Using Render (Recommended for REST APIs)
1. Go to [Render.com](https://render.com) and create an account.
2. Click **New -> Web Service**.
3. Connect your GitHub repository.
4. **Configuration:**
   - **Root Directory:** `backend`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start` (Make sure your `package.json` has `"start": "node src/server.js"`)
   - **Instance Type:** `Free`
5. **Environment Variables:** Scroll down to Advanced -> Environment Variables and add the following:
   - `PORT`: `10000` (Render defaults to 10000 usually)
   - `MONGO_URI`: `your_mongodb_atlas_connection_string`
   - `JWT_SECRET`: `your_secure_random_string`
   - `NODE_ENV`: `production`
6. Click **Create Web Service**. 
   *Note: Render free tiers spin down after 15 minutes of inactivity. The first request after spinning down might take ~30 seconds to wake up.*

### Option B: Using Railway
1. Go to [Railway.app](https://railway.app).
2. Click **New Project -> Deploy from GitHub repo**.
3. Point it to your repository. Railway usually detects the Node.js environment automatically.
4. Go to **Settings -> Service -> Root Directory** and change it to `/backend`.
5. Go to the **Variables** tab and add your `.env` variables (`MONGO_URI`, `JWT_SECRET`, etc.).

---

## 3. Connecting the Pieces (CORS & Environment Variables)

For the frontend and backend to securely communicate, you must configure CORS on the backend.

1. **Backend CORS Setup:**
   In your `backend/src/server.js` (or `app.js`), ensure `cors` is installed and configured to accept requests from your Vercel/Netlify frontend URL:
   
   ```javascript
   const cors = require('cors');
   app.use(cors({
       origin: 'https://catalogue-front.vercel.app', // Your frontend URL
       credentials: true
   }));
   ```

2. **Frontend API URL:**
   Update `frontend/app.js` to point to the new Render/Railway backend URL before pushing your final commit to GitHub.

---

## 4. Post-Deployment Checklist

- [ ] **MongoDB IP Access:** Ensure your MongoDB Atlas cluster network settings allow connections from anywhere (`0.0.0.0/0`), as Render/Railway IPs are dynamic.
- [ ] **JWT_SECRET Check:** Ensure `JWT_SECRET` in Render matches exactly what you intended and isn't falling back to a default.
- [ ] **API Tests:** Open your live Vercel URL and check the browser console. If you get CORS errors, double-check step 3. If you get 401s on library fetches, sign in to get a valid token.
