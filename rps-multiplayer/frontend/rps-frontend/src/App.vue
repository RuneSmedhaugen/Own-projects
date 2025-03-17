<script setup>
import { ref } from "vue";
import { io } from "socket.io-client";

// Point to your deployed server URL
const socket = io("https://own-projects.onrender.com");

const playerName = ref("");
const lobbyName = ref(""); // New input for lobby name
const isWaiting = ref(true);
const message = ref("Enter your name and lobby to start");
const opponentName = ref("");
const choice = ref(null);
const opponentChoice = ref(null);
const result = ref(null);
const stats = ref({ wins: 0, losses: 0, currentStreak: 0, bestStreak: 0 });

const setName = () => {
  if (!playerName.value.trim()) return;
  // Use "default" lobby if none provided
  const chosenLobby = lobbyName.value.trim() || "default";
  console.log(`Sending name: ${playerName.value}, Lobby: ${chosenLobby}`);
  socket.emit("setName", { name: playerName.value.trim(), lobby: chosenLobby });
  isWaiting.value = false;
  message.value = "Looking for an opponent...";
};

const selectChoice = (userChoice) => {
  console.log(`Player chose: ${userChoice}`);
  choice.value = userChoice;
  socket.emit("play", userChoice);
};

socket.on("waiting", (msg) => {
  console.log("Waiting event received:", msg);
  message.value = msg;
});

socket.on("gameStart", (data) => {
  console.log(`Game started against ${data.opponentName}`);
  message.value = `Playing against ${data.opponentName}!`;
  opponentName.value = data.opponentName;
  if (data.stats) {
    stats.value = data.stats;
  }
});

socket.on("result", (data) => {
  console.log(`Result received: You - ${data.yourChoice}, Opponent - ${data.opponentChoice}, Outcome - ${data.result}`);
  opponentChoice.value = data.opponentChoice;
  result.value = data.result;
  if (data.stats) {
    stats.value = data.stats;
  }
});

socket.on("opponentLeft", (msg, updatedStats) => {
  console.log("Opponent left the game");
  message.value = msg;
  choice.value = null;
  opponentChoice.value = null;
  result.value = null;
  opponentName.value = "";
  if (updatedStats) {
    stats.value = updatedStats;
  }
});
</script>

<template>
  <div class="game">
    <h1>Rock Paper Scissors</h1>

    <div v-if="isWaiting">
      <input v-model="playerName" placeholder="Enter your name" />
      <input v-model="lobbyName" placeholder="Enter lobby (or leave blank for default)" />
      <button @click="setName">Join Queue</button>
      <p>{{ message }}</p>
    </div>

    <div v-else>
      <p>{{ message }}</p>

      <div v-if="opponentName">
        <h3>You: {{ playerName }}</h3>
        <h3>Opponent: {{ opponentName }}</h3>

        <div class="choices">
          <button @click="selectChoice('rock')">🪨 Rock</button>
          <button @click="selectChoice('paper')">📄 Paper</button>
          <button @click="selectChoice('scissors')">✂️ Scissors</button>
        </div>

        <p v-if="choice">You chose: {{ choice }}</p>
        <p v-if="opponentChoice">Opponent chose: {{ opponentChoice }}</p>
        <h2 v-if="result">Result: {{ result }}</h2>

        <div class="stats">
          <h3>Scoreboard</h3>
          <p>Wins: {{ stats.wins }}</p>
          <p>Losses: {{ stats.losses }}</p>
          <p>Current Win Streak: {{ stats.currentStreak }}</p>
          <p>Best Win Streak: {{ stats.bestStreak }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.game {
  text-align: center;
  font-family: Arial, sans-serif;
}

input {
  padding: 10px;
  font-size: 16px;
  margin: 5px;
}

button {
  margin: 10px;
  padding: 10px 20px;
  font-size: 20px;
  cursor: pointer;
}

.choices button {
  margin: 10px;
}

.stats {
  margin-top: 20px;
  background: #f3f3f3;
  padding: 10px;
  display: inline-block;
  border-radius: 5px;
}
</style>
