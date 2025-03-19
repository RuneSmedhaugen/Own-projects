const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
      origin: ["https://superb-jalebi-b0d721.netlify.app", "http://localhost:5173"], // ✅ Add correct Netlify format & localhost for testing
      methods: ["GET", "POST"],
      credentials: true
    },
  });  

// Store player stats
const playerStats = {};

// Store lobbies with passwords & player details
const lobbies = {}; // { lobbyName: { password, players: [], creator: "name" } }

io.on("connection", (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // Send the lobby list on request
  socket.on("getLobbies", () => {
    const lobbyList = Object.keys(lobbies).map((name) => ({
      name,
      creator: lobbies[name].creator,
      locked: lobbies[name].password ? true : false,
    }));
    socket.emit("lobbyList", lobbyList);
  });

  // Create or Join Lobby (with optional password)
  socket.on("setName", ({ name, lobby, password }) => {
    if (!name || !name.trim()) return;
    socket.playerName = name.trim();
    lobby = lobby.trim() || "default";

    // If lobby exists, check password
    if (lobbies[lobby]) {
      if (lobbies[lobby].password && lobbies[lobby].password !== password) {
        socket.emit("error", "Incorrect lobby password!");
        return;
      }
    } else {
      // Create new lobby if it doesn't exist
      lobbies[lobby] = { password, players: [], creator: name };
    }

    socket.lobby = lobby;
    lobbies[lobby].players.push(socket);

    console.log(`${name} joined lobby: ${lobby}`);

    // Notify lobby update
    io.emit("lobbyList", Object.keys(lobbies).map((name) => ({
      name,
      creator: lobbies[name].creator,
      locked: lobbies[name].password ? true : false,
    })));

    attemptMatch(lobby);
  });

  // Handle leaving queue or disconnect
  socket.on("leaveQueue", () => {
    if (socket.lobby && lobbies[socket.lobby]) {
      lobbies[socket.lobby].players = lobbies[socket.lobby].players.filter(p => p !== socket);
      
      // Remove lobby if empty
      if (lobbies[socket.lobby].players.length === 0) {
        delete lobbies[socket.lobby];
      }
    }
    socket.emit("leftQueue", "You have left the queue.");
    io.emit("lobbyList", Object.keys(lobbies).map((name) => ({
      name,
      creator: lobbies[name].creator,
      locked: lobbies[name].password ? true : false,
    })));
  });

  socket.on("disconnect", () => {
    console.log(`Player disconnected: ${socket.id}`);

    // Remove from lobby
    if (socket.lobby && lobbies[socket.lobby]) {
      lobbies[socket.lobby].players = lobbies[socket.lobby].players.filter(p => p !== socket);

      // Remove lobby if empty
      if (lobbies[socket.lobby].players.length === 0) {
        delete lobbies[socket.lobby];
      }
    }

    io.emit("lobbyList", Object.keys(lobbies).map((name) => ({
      name,
      creator: lobbies[name].creator,
      locked: lobbies[name].password ? true : false,
    })));
  });
});

// Try to match two players in a lobby
function attemptMatch(lobby) {
  const queue = lobbies[lobby].players;
  if (queue.length >= 2) {
    const player1 = queue.shift();
    const player2 = queue.shift();

    if (!player1 || !player2) return;

    player1.opponent = player2;
    player2.opponent = player1;

    console.log(`Match found: ${player1.playerName} vs ${player2.playerName}`);

    player1.emit("gameStart", { opponentName: player2.playerName, stats: playerStats[player1.id] });
    player2.emit("gameStart", { opponentName: player1.playerName, stats: playerStats[player2.id] });
  }
}

const port = process.env.PORT || 3000;
server.listen(port, () => console.log(`Server running on port ${port}`));
