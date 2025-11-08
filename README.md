# 🚩 Multiplayer Minesweeper

A real-time multiplayer Minesweeper game where up to 10 players take turns revealing cells. Built with React, Node.js, Socket.IO, and deployed on Vercel.

## 🎮 Game Features

- **Multiplayer**: Up to 10 players can join a game
- **Turn-based**: Players take turns clicking cells
- **Real-time**: Live game state synchronization
- **Scoring**: Points awarded for each cell revealed
- **Visual feedback**: Different colors for each player's revealed cells
- **Responsive design**: Works on desktop and mobile devices

## 🛠️ Tech Stack

- **Frontend**: React 18 + Vite
- **Backend**: Node.js + Express
- **Real-time Communication**: Socket.IO
- **Deployment**: Vercel (Frontend + Serverless Functions)

## 🚀 Quick Start

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Git

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd multiplayer-minesweeper
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Start development servers**
   ```bash
   npm run dev
   ```

   This will start:
   - Frontend dev server on `http://localhost:3000`
   - Backend server on `http://localhost:3001`

4. **Open your browser**
   - Navigate to `http://localhost:3000`
   - Enter your name and start playing!

### Individual Server Commands

```bash
# Start only the backend server
npm run server

# Start only the frontend dev server
npm run client

# Build for production
npm run build
```

## 📦 Deployment on Vercel + GitHub

### Step 1: Setup GitHub Repository

1. **Create a new repository on GitHub**
   - Go to [GitHub](https://github.com) and click "New repository"
   - Name it `multiplayer-minesweeper` (or any name you prefer)
   - Make it public or private
   - Don't initialize with README (we already have one)

2. **Push your code to GitHub**
   ```bash
   # Initialize git repository (if not already done)
   git init

   # Add all files
   git add .

   # Commit
   git commit -m "Initial commit: Multiplayer Minesweeper game"

   # Add remote origin (replace with your repository URL)
   git remote add origin https://github.com/yourusername/multiplayer-minesweeper.git

   # Push to GitHub
   git push -u origin main
   ```

### Step 2: Deploy on Vercel

1. **Create a Vercel Account**
   - Go to [Vercel](https://vercel.com)
   - Sign up with your GitHub account

2. **Import your GitHub repository**
   - Click "New Project" in Vercel dashboard
   - Import your `multiplayer-minesweeper` repository
   - Vercel will automatically detect it's a Node.js project

3. **Configure deployment settings**
   - **Framework Preset**: Other
   - **Root Directory**: `./` (leave default)
   - **Build Command**: `cd client && npm install && npm run build`
   - **Output Directory**: `public`
   - **Install Command**: `npm install`

4. **Environment Variables** (Optional)
   - No special environment variables needed for basic setup
   - Vercel will automatically set `NODE_ENV=production`

5. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete (usually 1-2 minutes)
   - Your app will be available at `https://your-project-name.vercel.app`

### Step 3: Update CORS Settings (Important!)

After deployment, you need to update the CORS settings in the server code:

1. **Edit server/index.js**
   ```javascript
   // Replace this line:
   origin: process.env.NODE_ENV === 'production'
     ? ['https://your-vercel-app.vercel.app']
     : ["http://localhost:3000"],

   // With your actual Vercel URL:
   origin: process.env.NODE_ENV === 'production'
     ? ['https://your-actual-vercel-url.vercel.app']
     : ["http://localhost:3000"],
   ```

2. **Commit and push the change**
   ```bash
   git add server/index.js
   git commit -m "Update CORS settings for production"
   git push
   ```

3. **Vercel will auto-deploy** the update

## 🎯 How to Play

1. **Join a Game**
   - Enter your name
   - Either join a random game or enter a specific Game ID

2. **Wait for Players**
   - Minimum 2 players needed to start
   - Up to 10 players can join

3. **Start the Game**
   - Any player can click "Start Game" when ready

4. **Take Turns**
   - Players take turns clicking cells
   - Left-click to reveal, right-click to flag
   - 30 seconds per turn

5. **Scoring**
   - 1 point for each cell you reveal
   - Player with most points wins when game ends

6. **Win Conditions**
   - Game ends when all safe cells are revealed
   - Game ends if someone hits a mine
   - Highest score wins!

## 🔧 Project Structure

```
multiplayer-minesweeper/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── App.jsx         # Main app component
│   │   └── main.jsx        # Entry point
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── server/                 # Node.js backend
│   ├── index.js           # Express server + Socket.IO
│   └── gameLogic.js       # Game logic class
├── public/                # Built frontend (auto-generated)
├── api/                   # Vercel serverless functions
├── package.json           # Root package.json
├── vercel.json           # Vercel configuration
└── README.md
```

## 🐛 Troubleshooting

### Common Issues

1. **"Cannot connect to server"**
   - Check if your Vercel deployment is successful
   - Verify CORS settings match your Vercel URL

2. **Game doesn't update in real-time**
   - Socket.IO connections may take a moment to establish
   - Refresh the page and try again

3. **Build fails on Vercel**
   - Check that all dependencies are listed in package.json
   - Verify build commands are correct

4. **Players can't join**
   - Make sure you're using the correct Game ID
   - Check that the game isn't full (10 player limit)

### Development Issues

1. **Frontend won't start**
   ```bash
   cd client
   npm install
   npm run dev
   ```

2. **Backend won't start**
   ```bash
   npm install
   npm run server
   ```

3. **Port conflicts**
   - Frontend uses port 3000
   - Backend uses port 3001
   - Change ports in package.json scripts if needed

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🎮 Game Customization

You can customize the game by modifying these settings in `server/gameLogic.js`:

```javascript
// Game board size and mine count
const settings = {
  easy: { width: 9, height: 9, mineCount: 10 },
  medium: { width: 16, height: 16, mineCount: 40 },
  hard: { width: 30, height: 16, mineCount: 99 }
};

// Max players (default: 10)
maxPlayers = 10;

// Turn time limit (default: 30 seconds)
turnTimeLimit = 30000;
```

## 📞 Support

If you encounter any issues:

1. Check this README for troubleshooting steps
2. Look for existing issues in the GitHub repository
3. Create a new issue with detailed description
4. Include error messages and browser console logs

---

**Enjoy playing Multiplayer Minesweeper! 🎉**