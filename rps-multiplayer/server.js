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
  
    if (lobbies[lobby]) {
      if (lobbies[lobby].password && lobbies[lobby].password !== password) {
        socket.emit("error", "Incorrect lobby password!");
        return;
      }
    } else {
      lobbies[lobby] = { password, players: [], creator: name };
    }
  
    socket.lobby = lobby;
    lobbies[lobby].players.push(socket);
  
    console.log(`${name} joined lobby: ${lobby}`);
  
    // ✅ Ensure every client gets the updated lobby list
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

// Handle player choices and determine the winner
socket.on("play", (choice) => {
    if (!socket.opponent) return; // Ensure the player has an opponent
  
    socket.choice = choice;
    console.log(`${socket.playerName} chose ${choice}`);
  
    // Check if both players have made their choices
    if (socket.choice && socket.opponent.choice) {
      console.log("Both players have chosen. Processing result...");
      processGameResult(socket, socket.opponent);
    }
  });
  
  // Process the game result
  function processGameResult(player1, player2) {
    const result = determineWinner(player1.choice, player2.choice);
  
    // Send results to both players
    player1.emit("result", {
      yourChoice: player1.choice,
      opponentChoice: player2.choice,
      result,
    });
  
    player2.emit("result", {
      yourChoice: player2.choice,
      opponentChoice: player1.choice,
      result: result === "Win" ? "Lose" : result === "Lose" ? "Win" : "Draw",
    });
  
    // Reset choices for next round
    player1.choice = null;
    player2.choice = null;
  }
  
  // Determine the winner based on RPS rules
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
});

const port = process.env.PORT || 3000;
server.listen(port, () => console.log(`Server running on port ${port}`));
