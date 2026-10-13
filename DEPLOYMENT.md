# Deployment Guide: Hospital Network

This project is configured to run smoothly in **local development** and deploy cleanly across **Render (Backend)** and **Vercel (Frontend)**.

---

## 1. Local Development

You can run the full project locally using the root scripts:

```bash
# Install dependencies across all packages
npm run install:all

# Start both backend and frontend concurrently
npm run dev
```

- **Frontend:** Runs at `http://localhost:5173`
- **Backend:** Runs at `http://localhost:5000`
- The frontend Vite dev server automatically proxies all `/api/*` requests to `http://localhost:5000`.

---

## 2. Deploy Backend on Render

1. Sign in to [Render](https://render.com/) and click **New + > Web Service**.
2. Connect your Git repository.
3. Configure the service settings:
   - **Name:** `hospital-network-backend` (or your preferred name)
   - **Root Directory:** `backend`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. Under **Environment Variables**, add:
   - `MONGODB_URI`: Your MongoDB Atlas connection string (e.g. `mongodb+srv://...`)
   - `JWT_SECRET`: A secure random secret string for JWT authentication
5. Click **Create Web Service**.
6. Once deployed, copy your Render Web Service URL (e.g., `https://hospital-network-backend.onrender.com`).
   - You can test it in your browser: `https://hospital-network-backend.onrender.com/api/health` should return `{"status":"healthy"}`.

---

## 3. Deploy Frontend on Vercel

1. Sign in to [Vercel](https://vercel.com/) and click **Add New > Project**.
2. Import your Git repository.
3. In the project configuration:
   - **Framework Preset:** `Vite`
   - **Root Directory:** Click *Edit* and select `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Under **Environment Variables**, add:
   - `VITE_API_URL`: Your Render backend API endpoint:
     ```
     https://<your-render-backend-url>.onrender.com/api
     ```
     *(Note: The app will work whether you include or omit the trailing `/api`)*
5. Click **Deploy**.
6. The included `frontend/vercel.json` ensures that client-side SPA routing (e.g. `/referrals`, `/facilities`) refreshes without 404 errors.

---

## 4. Git Initialization & Security Checklist

Before pushing to GitHub:

1. Confirm that `.env` files are not staged:
   ```bash
   git status
   ```
   *(The root `.gitignore` is already set up to ignore `.env`, `node_modules`, and build outputs).*

2. Initialize and commit:
   ```bash
   git init
   git add .
   git commit -m "feat: configure deployment for Vercel and Render"
   ```

3. Add your remote repository and push:
   ```bash
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git push -u origin main
   ```
