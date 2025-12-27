# Deployment Guide

This guide will help you deploy the Uni Dashboard to Netlify with both the frontend and backend working.

## Architecture

- **Frontend**: React/TypeScript app (deployed to Netlify)
- **Backend**: Express server with SQLite database (needs separate hosting)
- **AI**: OpenAI API integration (works through backend proxy)

## Option 1: Deploy Backend Separately (Recommended)

This is the recommended approach since the backend uses SQLite which requires persistent storage.

### Step 1: Deploy Backend

Deploy your backend server to one of these services:

#### Option A: Vercel + Supabase (FREE - No Credit Card Required) ⭐⭐
**Best option for serverless with accessible database!**

Vercel provides free serverless hosting, and Supabase provides free PostgreSQL database (both no credit card required).

**Setup Supabase Database (Free PostgreSQL):**

1. **Sign up at [Supabase](https://supabase.com)** (no credit card needed)
2. **Create a new project**:
   - Click "New Project"
   - Choose a name (e.g., "uni-dashboard")
   - Set a database password (save this!)
   - Choose a region close to you
   - Wait for project to be created (~2 minutes)

3. **Get your database connection string**:
   - Go to Project Settings → Database
   - Find "Connection string" → "URI"
   - Copy the connection string (looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres`)

4. **Run the database migration**:
   - Go to SQL Editor in Supabase
   - Create a new query and paste the schema from `server/supabase-schema.sql` (we'll create this)
   - Or use the Supabase dashboard to create tables manually

**Deploy to Vercel:**

1. **Install Vercel CLI** (optional, can also use GitHub):
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Navigate to server directory**:
   ```bash
   cd server
   ```

4. **Deploy**:
   ```bash
   vercel
   ```
   - Follow prompts (use defaults)
   - When asked about environment variables, add:
     - `DATABASE_URL`: Your Supabase connection string
     - `OPENAI_API_KEY`: Your OpenAI API key

5. **Or deploy via GitHub**:
   - Push your code to GitHub
   - Go to [Vercel](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Set **Root Directory** to `server`
   - Add environment variables:
     - `DATABASE_URL`: Your Supabase connection string
     - `OPENAI_API_KEY`: Your OpenAI API key
   - Deploy!

6. **Get your backend URL**:
   - After deployment, Vercel will show your URL
   - It will be: `https://your-app.vercel.app`

**Important Note**: 
- The database is fully accessible via Supabase dashboard where you can view/edit data, run queries, and manage your database.
- **Code Update Required**: The current codebase uses SQLite (synchronous). To use Vercel + Supabase, you'll need to update the database calls to use async PostgreSQL. The files `database-pg.js` and `db-adapter.js` are provided as a starting point, but the API routes in `api.js` need to be updated to use async/await for database operations.

**Alternative**: If you want to avoid code changes, use **Render** (Option C below) which supports SQLite with persistent storage on the free tier.

#### Option B: Deta Space (FREE - No Credit Card Required) ⭐
**Best option if you don't want to add a payment method!**

Deta Space is completely free with no paid tiers and doesn't require a credit card.

1. **Sign up at [Deta Space](https://deta.space)** (no credit card needed)
2. **Install Deta CLI**:
   ```bash
   curl -fsSL https://get.deta.dev/cli.sh | sh
   ```
   Then run: `source ~/.zshrc` (or open a new terminal)

3. **Login to Deta**:
   ```bash
   deta login
   ```

4. **Navigate to server directory**:
   ```bash
   cd server
   ```

5. **Create a new Micro** (Deta's term for a service):
   ```bash
   deta new
   ```
   - Choose "Node.js" when prompted
   - Give it a name (e.g., "uni-dashboard-server")

6. **Set environment variables**:
   ```bash
   deta secrets put OPENAI_API_KEY=your-actual-api-key-here
   ```

7. **Deploy**:
   ```bash
   deta deploy
   ```

8. **Get your app URL**:
   ```bash
   deta details
   ```
   Your app will be at: `https://your-app-name.deta.dev`

**Note**: Deta Space uses ephemeral storage, so SQLite data may not persist between restarts. For persistent data, consider using Deta Base (their database service) or migrate to a cloud database.

#### Option C: Render (FREE - No Credit Card Required) ⭐⭐
**Best option if you want to use SQLite without code changes!**

Render supports SQLite with persistent storage on the free tier and typically doesn't require a credit card.

1. **Sign up at [Render](https://render.com)** (no credit card needed for free tier)
2. **Create a new Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
3. **Configure the service**:
   - **Name**: `uni-dashboard-server` (or your choice)
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. **Add environment variables**:
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `NODE_ENV`: `production`
5. **Click "Create Web Service"**
6. **Wait for deployment** (first deploy takes ~5 minutes)
7. **Copy the deployed URL** (e.g., `https://uni-dashboard-server.onrender.com`)

**Note**: 
- Free tier includes 512MB RAM and persistent disk storage (SQLite will work!)
- Services on free tier spin down after 15 minutes of inactivity (first request may be slow)
- Your database file persists between deployments

#### Option D: Railway (Free Tier - May Require Card)
1. Go to [Railway](https://railway.app)
2. Create a new project
3. Connect your GitHub repository
4. Add the `server` folder as a service
5. Set environment variables:
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `PORT`: 3001 (or let Railway assign one)
6. Railway will automatically detect Node.js and deploy
7. Copy the deployed URL (e.g., `https://your-app.railway.app`)

#### Option E: Fly.io (Requires Payment Method)
**Note**: Fly.io requires a payment method, but you can stay within the **free tier** which includes:
- 3 shared-cpu-1x VMs with 256MB RAM (this app uses 1)
- 3GB of persistent volume storage (this app uses ~1GB)
- 160GB outbound data transfer
- You'll only be charged if you exceed these limits

1. **Install Fly CLI**: 
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```
   **Important**: After installation, run `source ~/.zshrc` (or open a new terminal) to load the PATH

2. **Login to Fly.io**:
   ```bash
   flyctl auth login
   ```

3. **Add Payment Method** (required, but free tier usage won't charge you):
   - When prompted during `flyctl launch`, choose "Yes" to add a payment method
   - Or add it later at: https://fly.io/dashboard/personal/billing
   - You won't be charged if you stay within free tier limits

4. **Navigate to server directory**:
   ```bash
   cd server
   ```

5. **Launch the app** (first time only):
   ```bash
   flyctl launch
   ```
   - When prompted, choose to use the existing `fly.toml` file
   - Enter a unique app name (or use the suggested one)
   - Choose a region close to you (e.g., `iad`, `sjc`, `lax`, `ord`)
   - **Don't** deploy yet when asked (we need to create the volume first)

6. **Create persistent volume for SQLite database**:
   ```bash
   flyctl volumes create db_data --size 1 --region <your-region>
   ```
   Replace `<your-region>` with the region you chose (e.g., `iad`)
   - 1GB volume is within the free 3GB allowance

7. **Set environment variables**:
   ```bash
   flyctl secrets set OPENAI_API_KEY=your-actual-api-key-here
   ```

8. **Deploy the application**:
   ```bash
   flyctl deploy
   ```

9. **Get your app URL**:
   ```bash
   flyctl status
   ```
   Or check the output from deployment. The URL will be: `https://your-app-name.fly.dev`

10. **Verify deployment**:
    - Visit `https://your-app-name.fly.dev/api` to test
    - Check logs: `flyctl logs`

**Note**: The database will persist in the `db_data` volume. If you need to reset it, you can delete and recreate the volume, but this will lose all data.

**Cost**: This configuration stays within Fly.io's free tier, so you won't be charged as long as you don't exceed the free allowances.

### Step 2: Deploy Frontend to Netlify

1. **Push your code to GitHub** (if not already done)

2. **Connect to Netlify**:
   - Go to [Netlify](https://netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Connect your GitHub repository

3. **Configure Build Settings** (should auto-detect):
   - Build command: `npm run build`
   - Publish directory: `dist`

4. **Set Environment Variables** in Netlify:
   - Go to Site settings → Environment variables
   - Add: `VITE_API_BASE_URL` = `https://your-backend-url.com/api`
     (Replace with your actual backend URL from Step 1)

5. **Deploy**: Netlify will automatically build and deploy

### Step 3: Configure AI

The AI functionality works through the backend proxy. Make sure your backend has the `OPENAI_API_KEY` environment variable set.

## Option 2: Use Netlify Functions (Alternative)

If you want to keep everything on Netlify, you can:

1. Convert the backend API to Netlify Functions
2. Use a cloud database (like Supabase, PlanetScale, or Neon) instead of SQLite
3. This requires more refactoring but keeps everything in one place

## Environment Variables Summary

### Frontend (Netlify)
- `VITE_API_BASE_URL`: Your backend API URL (e.g., `https://your-backend.railway.app/api`)

### Backend (Railway/Render/Fly.io)
- `OPENAI_API_KEY`: Your OpenAI API key
- `PORT`: Port number (usually auto-assigned)
- `NODE_ENV`: `production`

## Testing After Deployment

1. Visit your Netlify site URL
2. Check that the dashboard loads
3. Try creating a university entry
4. Test the AI refresh feature (make sure backend has OpenAI key configured)

## Troubleshooting

### Frontend can't connect to backend
- Check that `VITE_API_BASE_URL` is set correctly in Netlify
- Ensure your backend URL is accessible (not blocked by CORS)
- Check browser console for errors

### AI not working
- Verify `OPENAI_API_KEY` is set in backend environment
- Check backend logs for AI-related errors
- Ensure backend is accessible from the frontend

### Database issues
- SQLite files are ephemeral on most platforms
- Consider migrating to a cloud database for production
- Or use a service like Railway that supports persistent volumes

## Local Development

For local development, create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=http://localhost:3001/api
```

Then run:
- Frontend: `npm run dev` (in root directory)
- Backend: `npm run dev` (in server directory)

