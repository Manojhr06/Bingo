# 🎯 Bingo 25 — Mobile Game

A modern, real-time **5×5 Bingo game using numbers 1–25** (the classic school & college grid game, distinct from 90-ball Tambola).

Built with **React Native + Expo + TypeScript**, powered by a **Node.js + Express + Socket.IO + MongoDB** backend.

---

## 🌟 Key Features

### 🎲 Core Game Mechanics
- **5×5 Grid (Numbers 1–25)**: Each player arranges numbers 1 to 25 exactly once.
- **Turn-Based Calling**: Players take turns calling an uncalled number.
- **Universal Marking**: All players mark the called number on their own 5×5 board.
- **Line Detection**: Detects completed rows (5), columns (5), and diagonals (2) — total 12 possible lines.
- **B-I-N-G-O Progression**:
  - 1 line = **B**
  - 2 lines = **I**
  - 3 lines = **N**
  - 4 lines = **G**
  - 5 lines = **O** → **B-I-N-G-O!**
- **Win Condition**: The first player to complete 5 lines wins the game.
- **Strict Validation**: Duplicate and out-of-turn calls are prevented at the server and engine levels.

### 🌐 Real-Time Online Multiplayer
- **2, 3, or 4 Real Players**.
- **Create Room**: Generates an intuitive, readable 5-character alphanumeric room code (e.g. `BG7X2`).
- **Share Room Code**: 1-tap Copy to clipboard and native OS share dialog.
- **Join Room**: Enter the 5-character code to jump straight into the lobby.
- **Server-Authoritative State**: Synchronized game state across all devices via Socket.IO.
- **Reconnection Handling**: Automatic session token recovery if WiFi or mobile data drops temporarily.
- **Host Migration**: If the room host disconnects, host privileges automatically migrate to the next active player.
- **Live Reactions**: Quick emoji reactions (🔥, 😂, 👏, 😱, 🎉, 👑) during matches.
- **Rematch Flow**: 1-tap Rematch resets the match state for another round.

### 📋 Board Setup
- **Random Board**: Instant 1-tap Fisher-Yates shuffle of numbers 1–25.
- **Manual Board**:
  - Tap-to-Swap any two numbers on the board.
  - Number Bank picker for manual placement.
  - Shuffle and Auto-Fill Remaining helpers.
  - Strict validation preventing duplicates or missing numbers.

### 🎮 Offline Mode (No Internet Required)
- **Player vs AI**:
  - **Easy**: Casual play, picks random uncalled numbers.
  - **Medium**: Evaluates board lines, prioritizes numbers completing or advancing near-complete lines.
  - **Hard**: Advanced heuristic scoring factoring in line intersection density (center and corners) and opponent threats.
- **Local Pass & Play**:
  - 2 to 4 players on a single device.
  - **Privacy Handover Screen**: "Pass Phone to [Player Name]" screen conceals boards between turns.

### 🎨 Visual Craft & Polish
- **Responsive 5×5 Board**: Adapts to any mobile phone or tablet screen.
- **Dark & Light Mode**: Curated color palettes with high-contrast cognitive hierarchy.
- **Audio & Haptics**: Native vibration feedback (`expo-haptics`) and sound effects on cell tap, number called, line complete, and victory.
- **Victory Celebration**: Animated confetti particles, winner trophy, and detailed match stats.
- **Called Numbers Tray**: Glowing latest-called highlight and chronological history scroll.

---

## 🏗️ Project Architecture

```
BINGO/
├── server/                    # Node.js + Express + Socket.IO + MongoDB
│   ├── src/
│   │   ├── core/
│   │   │   └── bingoLogic.ts  # Pure 5x5 Bingo rules, line calculation, validators
│   │   ├── models/
│   │   │   ├── Room.ts        # Mongoose Schema
│   │   │   └── RoomStore.ts   # In-Memory Cache + MongoDB Synchronizer
│   │   ├── socket/
│   │   │   └── socketHandler.ts # Real-time turns, reconnection, and room lifecycle
│   │   ├── server.ts          # Express + Socket.IO entrypoint
│   │   └── types.ts           # Shared contracts
│   ├── tests/
│   │   ├── bingoLogic.test.ts # Unit tests for 5x5 lines, BINGO letters, AI moves
│   │   └── socketGame.test.ts # Integration tests for multiplayer turns, winners, disconnects
│   ├── package.json
│   └── tsconfig.json
├── mobile/                    # React Native + Expo + TypeScript
│   ├── assets/                # App icon, adaptive icon, splash
│   ├── src/
│   │   ├── components/        # BingoBoard, BingoProgress, TurnIndicator, AudioEffects, Theme
│   │   ├── core/              # Bingo rules & AI engine
│   │   ├── screens/           # Home, ModeSelect, OnlineLobby, BoardSetup, GameScreen, Settings
│   │   ├── services/          # socketService (Socket.IO client), offlineGameEngine
│   │   └── types/             # TypeScript definitions
│   ├── app.json               # Android package (com.bingo25.game) & Expo configuration
│   ├── eas.json               # EAS Build configuration for Google Play Store AAB
│   ├── App.tsx                # App root provider & navigation
│   └── package.json
├── package.json               # Root monorepo scripts
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher, tested on v24)
- npm (v10 or higher)
- Optional: MongoDB running locally at `mongodb://127.0.0.1:27017/bingo25` (the server includes automatic in-memory fallback if MongoDB is not running).

---

### 1. Run the Backend Server

```bash
cd server
npm install
npm run dev
```

The server will start on `http://0.0.0.0:3000`:
- **Health check**: `http://localhost:3000/health`
- **Active rooms**: `http://localhost:3000/api/rooms`

#### Run Server Tests:
```bash
npm test
```
All 16 unit and real-time multiplayer socket integration tests will execute.

---

### 2. Run the Mobile App

```bash
cd mobile
npm install
npm start
```

- Press **`a`** to open in Android Emulator.
- Press **`w`** to run in Web browser.
- Scan the QR code using the **Expo Go** app on your physical Android or iOS device!

> **💡 Connecting Physical Device to Local Server:**
> In the mobile app, tap the ⚙️ Settings icon and update the **Server URL** to your computer's local IP address (e.g. `http://192.168.1.50:3000`).

---

## 📱 Google Play Store Android Build (AAB)

The project is pre-configured for production Android App Bundle (`.aab`) builds:

1. **`mobile/app.json`**:
   - Package: `com.bingo25.game`
   - Version: `1.0.0`
   - Permissions: `VIBRATE`, `INTERNET`
2. **`mobile/eas.json`**:
   - `build.production.android.buildType`: `"app-bundle"`

To build the production AAB:
```bash
cd mobile
npx eas-cli build -p android --profile production
```
The resulting `.aab` file can be directly uploaded to the **Google Play Console** for release.
