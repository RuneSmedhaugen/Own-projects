<template>
  <div class="game">
    <div v-if="isWaiting">
      <h1>RPS Online</h1>
      <div class="input-container">
        <input type="text" v-model="playerName" id="playerName" placeholder=" " required />
        <label for="playerName">Enter your name</label>
      </div>
      <div class="input-container">
        <input type="text" v-model="lobbyName" id="lobbyName" placeholder=" " />
        <label for="lobbyName">Enter lobby name (optional)</label>
      </div>
      <button @click="setName">Join Queue</button>
      <p>{{ message }}</p>
    </div>

    <div v-else>
      <p>{{ message }}</p>

      <div v-if="opponentName">
        <h3 v-if="choice">You: {{ choice }}</h3>
        <h3 v-if="opponentChoice">{{ opponentName }}: {{ opponentChoice }}</h3>
        <h2 v-if="result">{{ result }}</h2>

        <div class="choices">
          <button @click="selectChoice('rock')">🗿</button>
          <button @click="selectChoice('paper')">📄</button>
          <button @click="selectChoice('scissors')">✂️</button>
        </div>

        <div class="stats">
          <h3>Scoreboard</h3>
          <p>Wins: {{ stats.wins }}</p>
          <p>Losses: {{ stats.losses }}</p>
          <p>Current Win Streak: {{ stats.currentStreak }}</p>
          <p>Best Win Streak: {{ stats.bestStreak }}</p>
        </div>
      </div>

      <!-- Exit button to leave queue or game -->
      <button class="exit-btn" @click="exitGame">Exit</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { io } from "socket.io-client";

const socket = io("https://own-projects.onrender.com");

const playerName = ref("");
const lobbyName = ref("");
const isWaiting = ref(true);
const message = ref("Enter your name and lobby to start");
const opponentName = ref("");
const choice = ref(null);
const opponentChoice = ref(null);
const result = ref(null);
const stats = ref({ wins: 0, losses: 0, currentStreak: 0, bestStreak: 0 });

const setName = () => {
  if (!playerName.value.trim()) return;
  const chosenLobby = lobbyName.value.trim() || "default";
  socket.emit("setName", { name: playerName.value.trim(), lobby: chosenLobby });
  isWaiting.value = false;
  message.value = "Looking for an opponent...";
};

const selectChoice = (userChoice) => {
  choice.value = userChoice;
  socket.emit("play", userChoice);
};

const exitGame = () => {
  socket.emit("leaveQueue"); // Notify the server
  resetGameState();
};

const resetGameState = () => {
  isWaiting.value = true;
  message.value = "Enter your name and lobby to start";
  opponentName.value = "";
  choice.value = null;
  opponentChoice.value = null;
  result.value = null;
};

socket.on("waiting", (msg) => message.value = msg);

socket.on("gameStart", (data) => {
  message.value = `Playing against ${data.opponentName}!`;
  opponentName.value = data.opponentName;
  if (data.stats) stats.value = data.stats;
});

socket.on("result", (data) => {
  opponentChoice.value = data.opponentChoice;
  result.value = data.result;
  if (data.stats) stats.value = data.stats;
});

socket.on("opponentLeft", (msg, updatedStats) => {
  message.value = msg;
  resetGameState();
  if (updatedStats) stats.value = updatedStats;
});
</script>

<style>
.exit-btn {
  background: red;
  color: white;
  font-size: 1.2rem;
  padding: 10px 15px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  margin-top: 20px;
}

.exit-btn:hover {
  background: darkred;
}
</style>
