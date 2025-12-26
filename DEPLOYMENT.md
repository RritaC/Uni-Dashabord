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

#### Option A: Railway (Recommended for SQLite)
1. Go to [Railway](https://railway.app)
2. Create a new project
3. Connect your GitHub repository
4. Add the `server` folder as a service
5. Set environment variables:
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `PORT`: 3001 (or let Railway assign one)
6. Railway will automatically detect Node.js and deploy
7. Copy the deployed URL (e.g., `https://your-app.railway.app`)

#### Option B: Render
1. Go to [Render](https://render.com)
2. Create a new Web Service
3. Connect your repository
4. Set:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node
5. Add environment variables:
   - `OPENAI_API_KEY`: Your OpenAI API key
6. Copy the deployed URL

#### Option C: Fly.io
1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. In the `server` directory, run: `fly launch`
3. Set environment variables: `fly secrets set OPENAI_API_KEY=your-key`
4. Deploy: `fly deploy`
5. Copy the deployed URL

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

