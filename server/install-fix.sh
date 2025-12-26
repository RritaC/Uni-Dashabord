#!/bin/bash

# Fix for better-sqlite3 installation on macOS
# This script helps resolve native compilation issues

echo "Installing better-sqlite3 with build fixes..."

# Try to install with npm rebuild
npm install better-sqlite3 --build-from-source

# If that fails, try with specific flags
if [ $? -ne 0 ]; then
    echo "Trying alternative installation method..."
    npm install better-sqlite3 --build-from-source --sqlite=/usr/local
fi

echo "Installation complete!"

