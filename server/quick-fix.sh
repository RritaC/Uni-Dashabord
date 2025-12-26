#!/bin/bash

# Quick fix for better-sqlite3 installation
echo "Attempting to fix better-sqlite3 installation..."

# Remove node_modules and package-lock
rm -rf node_modules package-lock.json

# Try installing with different methods
echo "Method 1: Standard install..."
npm install express cors dotenv

echo "Method 2: Installing better-sqlite3 with build flags..."
npm install better-sqlite3 --build-from-source || {
    echo "Method 2 failed, trying Method 3..."
    npm install better-sqlite3 --no-optional || {
        echo "All methods failed. Please check INSTALL.md for manual fixes."
        exit 1
    }
}

echo "Installation complete! Try running: npm run dev"

