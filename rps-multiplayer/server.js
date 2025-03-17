const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

let queue = []; // Players waiting for a match

io.on("connection", (socket) => {
  console.log(`Player connected: ${socket.id}`);

  socket.on("setName", (name) => {
    if (!name.trim()) return;
    socket.playerName = name;
    
    console.log(`Player ${name} added to queue`);
    queue.push(socket); // Add to matchmaking queue
    attemptMatch(); // Try to find an opponent
  });

  socket.on("play", (choice) => {
    console.log(`${socket.playerName} chose ${choice}`);
    
    if (!socket.opponent) {
      console.log("No opponent found for this player");
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
    
    queue = queue.filter((p) => p !== socket); // Remove from queue

    if (socket.opponent) {
      console.log(`${socket.playerName}'s opponent left`);
      socket.opponent.emit("opponentLeft", "Your opponent left. Waiting for a new player...");
      socket.opponent.opponent = null;
    }
  });
});

function attemptMatch() {
  console.log(`Attempting match. Players in queue: ${queue.length}`);
  if (queue.length >= 2) {
    const player1 = queue.shift();
    const player2 = queue.shift();

    if (!player1 || !player2) {
      console.log("Match failed. Players missing.");
      return;
    }

    player1.opponent = player2;
    player2.opponent = player1;

    console.log(`Match found: ${player1.playerName} vs ${player2.playerName}`);

    player1.emit("gameStart", { opponentName: player2.playerName });
    player2.emit("gameStart", { opponentName: player1.playerName });
  }
}

function processGameResult(player1, player2) {
  console.log(`Processing game result: ${player1.playerName} vs ${player2.playerName}`);
  
  const result = determineWinner(player1.choice, player2.choice);

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

  delete player1.choice;
  delete player2.choice;

  console.log(`Result: ${player1.playerName} (${player1.choice}) vs ${player2.playerName} (${player2.choice}) => ${result}`);

  queue.push(player1);
  queue.push(player2);
  attemptMatch();
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

const port = process.env.PORT || 3000;
server.listen(port, () => console.log(`Server running on port ${port}`));

