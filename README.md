# Uni Dashboard

A personal university dashboard application for managing university information, applications, grades, documents, and tasks. Features dynamic columns, AI-powered data refresh, and offline-first storage.

## Features

- **Dynamic Columns**: Add, edit, hide, and pin custom columns for universities
- **AI Refresh**: Automatically refresh university data using AI (with proper API key management)
- **Offline-First**: All data stored locally in IndexedDB (no backend required)
- **Data History**: Track all changes with confidence scores and sources
- **Export/Import**: Backup and restore your data as JSON
- **Multiple Pages**: Universities, Applications, Grades, Documents, Tasks, and Settings

## Tech Stack

- **Frontend**: Vite + React + TypeScript
- **Backend**: Node.js + Express
- **Database**: SQLite (better-sqlite3)
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Validation**: Zod
- **Icons**: Lucide React

## Setup

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone or download this repository
2. Install dependencies:

```bash
npm install
```

3. (Optional) Set up environment variables for AI features:

Create a `.env` file in the root directory:
```bash
VITE_OPENAI_API_KEY=your_api_key_here
VITE_AI_API_BASE_URL=https://api.openai.com/v1/chat/completions
```

**Note**: The app looks for `VITE_OPENAI_API_KEY` (or `VITE_AI_API_KEY` as fallback). Make sure your env variable starts with `VITE_` for Vite to expose it to the client.

### Running the Application

**IMPORTANT**: You must run both the backend server and frontend dev server.

1. Start the backend server (required):

```bash
cd server
npm install
```

**If you get compilation errors with `better-sqlite3`**, try one of these fixes:

```bash
# Option 1: Install with build flags
npm install better-sqlite3 --build-from-source

# Option 2: Use the quick fix script
./quick-fix.sh

# Option 3: See INSTALL.md for more solutions
```

Then start the server:
```bash
npm run dev
```

The backend will run on `http://localhost:3001` and automatically seed the database with 30 universities and the "General" view with all specified columns. The database file will be created at `server/uni-dashboard.db`.

2. Start the frontend dev server:

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Database

The application uses SQLite for data storage. The database file (`uni-dashboard.db`) is created automatically in the `server` directory when you first run the backend.

You can view and edit the database using any SQLite client like:
- DB Browser for SQLite (https://sqlitebrowser.org/)
- TablePlus
- VS Code SQLite extensions

### Optional: AI Proxy Server

For production use, it's **strongly recommended** to use the proxy server to keep your API keys secure. The proxy server runs separately and handles AI API calls server-side.

**Why use the proxy?**
- API keys are never exposed in client-side code
- Better security for production deployments
- Centralized API key management

**Setup:**

1. Navigate to the server directory:

```bash
cd server
npm install
```

2. Create a `.env` file in the `server` directory:

```bash
OPENAI_API_KEY=your_api_key_here
AI_API_BASE_URL=https://api.openai.com/v1/chat/completions
PORT=3001
```

**Note**: The server looks for `OPENAI_API_KEY` (or `AI_API_KEY` as fallback).

3. Start the proxy server:

```bash
npm run dev
```

The proxy server will run on `http://localhost:3001`

4. In the main app Settings page, ensure "Proxy" mode is selected (default).

**WARNING**: If you use "Direct" mode, your API keys will be exposed in the browser. This is only suitable for development. Always use Proxy mode in production.

## Usage

### First Run

On first launch, the backend server will automatically:
- Create the SQLite database
- Seed 30 universities
- Create a "General" view with all the specified columns (Nr, Uni Name, Cntr., State, City, etc.)
- Set initial values for basic fields

The database file is stored in `server/uni-dashboard.db` and can be viewed with any SQLite client.

### Spreadsheet View

The Universities page now features a Google Sheets-like grid interface:

1. **Multiple Views**: Create multiple table views, each with its own set of columns
2. **Default "General" View**: Pre-configured with all standard columns (Nr, Uni Name, Cntr., State, City, etc.)
3. **Inline Editing**: Click any cell to edit directly in the grid
4. **Edit University**: Click the edit icon in the first column to open a full edit form
5. **Pinned Columns**: Important columns (like Nr, Uni Name) are pinned and stay visible when scrolling
6. **Notes Column**: Each university has a notes field for additional information

### Managing Columns

1. Go to **Universities** page
2. Create a new view or use the existing "General" view
3. Columns can be added, edited, and organized
4. Each view maintains its own column configuration

### AI Refresh

1. Select one or more universities in the table
2. Click **AI Refresh**
3. Select the columns you want to refresh
4. The AI will fetch updated information and save it with confidence scores

**Note**: AI refresh requires an API key to be configured (either via `.env` or in Settings).

### Data Backup

1. Go to **Settings**
2. Click **Export Backup** to download all your data as JSON
3. Use **Import Backup** to restore from a previously exported file

## Project Structure

```
uni-dashboard/
├── src/
│   ├── components/       # Reusable components
│   ├── db/              # Database schema and seed data
│   ├── pages/           # Page components
│   ├── schemas/         # Zod validation schemas
│   ├── services/        # AI service abstraction
│   ├── store/           # Zustand state management
│   └── types/           # TypeScript types
├── server/              # Optional proxy server
├── package.json
└── README.md
```

## AI Provider System

The app uses a provider abstraction system for AI calls:

- **Direct Mode**: Calls AI API directly from the browser (development only)
- **Proxy Mode**: Uses local proxy server (recommended for production)

You can extend the system by implementing the `AIProvider` interface in `src/services/ai/provider.ts`.

## System Prompt

The AI uses a strict system prompt to ensure accurate, verifiable data:

- Outputs only valid JSON
- Never invents facts
- Provides confidence scores
- Uses official sources when possible
- Keeps notes brief and factual

## Data Storage

All data is stored in a SQLite database (`server/uni-dashboard.db`):

- **views**: Table view definitions
- **universities**: University information (including notes field)
- **columns**: Column definitions per view
- **values**: University-specific column values per view
- **values_history**: Change history with timestamps, sources, and confidence scores

You can directly access and query the database using any SQLite client. The database file persists on disk and is not cleared when you restart the server.

## Development

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Security Notes

- **API Keys**: Never commit `.env` files or expose API keys in client code
- **Proxy Server**: Always use the proxy server in production to keep keys secure
- **Data Privacy**: All data is stored locally in your browser - no data is sent to external servers except for AI API calls

## License

MIT

