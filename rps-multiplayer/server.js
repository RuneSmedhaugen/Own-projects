const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // or your frontend URL
    methods: ["GET", "POST"],
  },
});

socket.on("leaveQueue", () => {
    if (socket.lobby && lobbies[socket.lobby]) {
      lobbies[socket.lobby] = lobbies[socket.lobby].filter(p => p !== socket);
    }
    socket.emit("leftQueue", "You have left the queue.");
  });
  

// Store player stats keyed by socket.id
const playerStats = {}; // { socket.id: { wins, losses, currentStreak, bestStreak } }

// Store lobby queues; each lobby is an array of sockets
const lobbies = {};

io.on("connection", (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // Expect payload: { name, lobby }
  socket.on("setName", (payload) => {
    if (!payload.name || !payload.name.trim()) return;

    socket.playerName = payload.name.trim();
    socket.lobby = payload.lobby && payload.lobby.trim() ? payload.lobby.trim() : "default";

    // Initialize stats if not already set
    if (!playerStats[socket.id]) {
      playerStats[socket.id] = { wins: 0, losses: 0, currentStreak: 0, bestStreak: 0 };
    }

    // Ensure lobby exists
    if (!lobbies[socket.lobby]) {
      lobbies[socket.lobby] = [];
    }

    console.log(`Player ${socket.playerName} joining lobby: ${socket.lobby}`);
    lobbies[socket.lobby].push(socket);
    attemptMatch(socket.lobby);
  });

  socket.on("play", (choice) => {
    console.log(`${socket.playerName} chose ${choice}`);
    
    if (!socket.opponent) {
      console.log("No opponent for this player");
      return;
    }
    socket.choice = choice;
    if (socket.opponent.choice) {
      console.log("Both players have chosen. Processing result...");
      processGameResult(socket, socket.opponent);
    }
  });

  socket.on("disconnect", () => {
    console.log(`Player disconnected: ${socket.id}`);
    
    // Remove from the appropriate lobby queue
    if (socket.lobby && lobbies[socket.lobby]) {
      lobbies[socket.lobby] = lobbies[socket.lobby].filter(p => p !== socket);
    }

    if (socket.opponent) {
      console.log(`${socket.playerName}'s opponent left`);
      socket.opponent.emit("opponentLeft", "Your opponent left. Waiting for a new player...", playerStats[socket.opponent.id]);
      socket.opponent.opponent = null;
    }
    delete playerStats[socket.id];
  });
});

// Try to match two players in the given lobby
function attemptMatch(lobbyName) {
  const queue = lobbies[lobbyName];
  console.log(`Attempting match in lobby '${lobbyName}'. Players in queue: ${queue.length}`);
  if (queue.length >= 2) {
    const player1 = queue.shift();
    const player2 = queue.shift();

    if (!player1 || !player2) {
      console.log("Match failed. One of the players is missing.");
      return;
    }

    player1.opponent = player2;
    player2.opponent = player1;

    console.log(`Match found in lobby '${lobbyName}': ${player1.playerName} vs ${player2.playerName}`);

    // Send gameStart with the opponent's name and current stats
    player1.emit("gameStart", { opponentName: player2.playerName, stats: playerStats[player1.id] });
    player2.emit("gameStart", { opponentName: player1.playerName, stats: playerStats[player2.id] });
  }
}

function processGameResult(player1, player2) {
  console.log(`Processing result: ${player1.playerName} vs ${player2.playerName}`);
  
  const result = determineWinner(player1.choice, player2.choice);

  // Update stats for both players
  updateStats(player1, result);
  updateStats(player2, result === "Win" ? "Lose" : result === "Lose" ? "Win" : "Draw");

  // Emit result along with updated stats
  player1.emit("result", {
    yourChoice: player1.choice,
    opponentChoice: player2.choice,
    result,
    stats: playerStats[player1.id]
  });
  player2.emit("result", {
    yourChoice: player2.choice,
    opponentChoice: player1.choice,
    result: result === "Win" ? "Lose" : result === "Lose" ? "Win" : "Draw",
    stats: playerStats[player2.id]
  });

  delete player1.choice;
  delete player2.choice;

  // Requeue the players in the same lobby if still connected
  if (player1.lobby) lobbies[player1.lobby].push(player1);
  if (player2.lobby) lobbies[player2.lobby].push(player2);
  attemptMatch(player1.lobby);
}

function determineWinner(p1, p2) {
  if (p1 === p2) return "Draw";
  if (
    (p1 === "rock" && p2 === "scissors") ||
    (p1 === "paper" && p2 === "rock") ||
    (p1 === "scissors" && p2 === "paper")
  ) {
    return "Win";
  }
  return "Lose";
}

function updateStats(player, result) {
  const stats = playerStats[player.id];
  if (!stats) return;

  if (result === "Win") {
    stats.wins++;
    stats.currentStreak++;
    if (stats.currentStreak > stats.bestStreak) {
      stats.bestStreak = stats.currentStreak;
    }
  } else if (result === "Lose") {
    stats.losses++;
    stats.currentStreak = 0;
  }
  // No changes for a draw
}

const port = process.env.PORT || 3000;
server.listen(port, () => console.log(`Server running on port ${port}`));
