# Installation Fix for better-sqlite3

If you're getting compilation errors when installing `better-sqlite3`, try these solutions:

## Solution 1: Install Xcode Command Line Tools (Recommended)

```bash
xcode-select --install
```

Then try installing again:
```bash
npm install
```

## Solution 2: Use Prebuilt Binaries

Try installing with the `--build-from-source` flag disabled:

```bash
npm install better-sqlite3 --no-build-from-source
```

## Solution 3: Install with Specific Build Flags

```bash
npm install better-sqlite3 --build-from-source --sqlite=/usr/local
```

## Solution 4: Use Node Version Manager

If you're using Node.js v22, try downgrading to Node.js v20 LTS:

```bash
nvm install 20
nvm use 20
npm install
```

## Solution 5: Manual Build

If all else fails, you can try building manually:

```bash
npm install --ignore-scripts
cd node_modules/better-sqlite3
npm run build-release
cd ../..
```

## Verify Installation

After installation, verify it works:

```bash
node -e "const db = require('better-sqlite3')('test.db'); console.log('SQLite works!'); db.close();"
```

If this works, delete `test.db` and start the server.

