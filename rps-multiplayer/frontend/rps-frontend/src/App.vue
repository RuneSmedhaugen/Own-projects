<template>
  <div class="game" v-if="!showLobbyScreen && !isInGame">
    <h1>RPS Online</h1>
    <div class="input-container">
      <input type="text" v-model="playerName" placeholder="Enter your name" required />
    </div>
    <div class="input-container">
      <input type="text" v-model="lobbyName" placeholder="Enter lobby name (optional)" />
    </div>
    <div class="input-container">
      <input type="password" v-model="lobbyPassword" placeholder="Set password (optional)" />
    </div>
    <button @click="setName">Join Queue</button>
    <button @click="showLobbyScreen = true">Find Lobbies</button>
  </div>

  <div class="lobby-screen" v-if="showLobbyScreen">
    <button @click="showLobbyScreen = false" class="back-button">⬅ Back</button>
    <h2>Available Lobbies</h2>
    <input type="text" v-model="searchQuery" placeholder="Search for lobbies..." class="search-bar" />
    <label>
      <input type="checkbox" v-model="showOnlyUnlocked" /> Show only unlocked lobbies
    </label>
    <div v-for="lobby in filteredLobbies" :key="lobby.name" class="lobby-item" @click="joinLobby(lobby)">
      {{ lobby.name }} ({{ lobby.creator }}) <span v-if="lobby.locked" class="lobby-lock">🔒</span>
    </div>
  </div>

  <div v-if="isInGame">
    <p>{{ message }}</p>
    <div v-if="opponentName">
      <h3 v-if="choice">You: {{ choice }}</h3>
      <h3 v-if="opponentChoice">{{ opponentName }}: {{ opponentChoice }}</h3>
      <h2 v-if="result">{{ result }}</h2>
      <div class="choices">
  <!-- Show only the selected choice if one is made -->
  <button v-if="choice" disabled>
    {{ choice === 'rock' ? '🗿' : choice === 'paper' ? '📄' : '✂️' }}
  </button>

  <!-- Show all choices if no choice is made -->
  <template v-else>
    <button @click="selectChoice('rock')">🗿</button>
    <button @click="selectChoice('paper')">📄</button>
    <button @click="selectChoice('scissors')">✂️</button>
  </template>
</div>

<!-- Timer display -->
<div v-if="timer !== null" class="timer">
  <p>Next round starts in: {{ timer }} seconds</p>
</div>
      <div class="stats">
        <h3>Scoreboard</h3>
        <p>Wins: {{ stats.wins }}</p>
        <p>Losses: {{ stats.losses }}</p>
        <p>Current Win Streak: {{ stats.currentStreak }}</p>
        <p>Best Win Streak: {{ stats.bestStreak }}</p>
      </div>
    </div>
    <button class="exit-btn" @click="exitGame">Exit</button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { io } from "socket.io-client";

const socket = io("https://own-projects.onrender.com");
const playerName = ref("");
const lobbyName = ref("");
const lobbyPassword = ref("");
const isInGame = ref(false);
const message = ref("Enter your name and lobby to start");
const opponentName = ref("");
const choice = ref(null);
const opponentChoice = ref(null);
const result = ref(null);
const stats = ref({ wins: 0, losses: 0, currentStreak: 0, bestStreak: 0 });
const lobbies = ref([]);
const showLobbyScreen = ref(false);
const searchQuery = ref("");
const showOnlyUnlocked = ref(false);
const timer = ref(null);

const filteredLobbies = computed(() => {
  return lobbies.value.filter(lobby => 
    lobby.name.toLowerCase().includes(searchQuery.value.toLowerCase()) &&
    (!showOnlyUnlocked.value || !lobby.locked)
  );
});

const setName = () => {
  if (!playerName.value.trim()) return;
  socket.emit("setName", {
    name: playerName.value.trim(),
    lobby: lobbyName.value.trim() || "default",
    password: lobbyPassword.value.trim() || null,
  });
  isInGame.value = true;
  message.value = "Looking for an opponent...";
};

const joinLobby = (lobby) => {
  if (lobby.locked) {
    const enteredPassword = prompt("Enter the lobby password:");
    socket.emit("setName", { name: playerName.value.trim(), lobby: lobby.name, password: enteredPassword });
  } else {
    socket.emit("setName", { name: playerName.value.trim(), lobby: lobby.name });
  }
  isInGame.value = true;
  showLobbyScreen.value = false;
};

const selectChoice = (userChoice) => {
  choice.value = userChoice;
  socket.emit("play", userChoice);
};

const exitGame = () => {
  socket.emit("leaveQueue");
  resetGameState();
};

const resetGameState = () => {
  isInGame.value = false;
  message.value = "Enter your name and lobby to start";
  opponentName.value = "";
  choice.value = null;
  opponentChoice.value = null;
  result.value = null;
};

onMounted(() => {
  socket.emit("getLobbies");
  socket.on("lobbyList", (data) => {
    lobbies.value = data;
  });
  socket.on("gameStart", (data) => {
    message.value = `Playing against ${data.opponentName}!`;
    opponentName.value = data.opponentName;
    if (data.stats) stats.value = data.stats;
  });
  socket.on("result", (data) => {
  opponentChoice.value = data.opponentChoice;
  result.value = data.result;
  if (data.stats) stats.value = data.stats;

  // Start countdown timer
  timer.value = 3; // Set countdown duration (e.g., 3 seconds)
  const countdown = setInterval(() => {
    timer.value--;
    if (timer.value <= 0) {
      clearInterval(countdown); // Stop the timer when it reaches 0
      // Reset choices after the countdown
      choice.value = null;
      opponentChoice.value = null;
      result.value = null;
      timer.value = null; // Clear the timer
    }
  }, 1000); // Decrease timer every second
});
  socket.on("opponentLeft", (msg, updatedStats) => {
    message.value = msg;
    resetGameState();
    if (updatedStats) stats.value = updatedStats;
  });
});
</script>

<style>
.toggle-lobby {
  margin-top: 10px;
  background: #007bff;
  color: white;
  font-size: 1rem;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  border: none;
}
.toggle-lobby:hover {
  background: #0056b3;
}

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
