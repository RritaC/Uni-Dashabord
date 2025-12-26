import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { seedDatabase } from './db/seed.ts'
import { useSettingsStore } from './store/settings.ts'

// Initialize database and settings
seedDatabase()
    .then(() => {
        console.log('Database seeded successfully');
        useSettingsStore.getState().loadSettings();
    })
    .catch((error) => {
        console.error('Failed to seed database:', error);
    })
    .finally(() => {
        ReactDOM.createRoot(document.getElementById('root')!).render(
            <React.StrictMode>
                <App />
            </React.StrictMode>,
        );
    });

