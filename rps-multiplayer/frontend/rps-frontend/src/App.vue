<template>
<InputForm
  v-if="!showLobbyScreen && !isInGame"
  v-model:playerName="playerName"
  v-model:lobbyName="lobbyName"
  v-model:lobbyPassword="lobbyPassword"
  @set-name="setName"
  @show-lobby-screen="showLobbyScreen = true"
/>
<LobbyScreen 
    v-if="showLobbyScreen" 
    :lobbies="lobbies" 
    @join-lobby="joinLobby" 
    @back="showLobbyScreen = false" 
  />
  <GameScreen
    v-if="isInGame"
    :message="message"
    :opponentName="opponentName"
    :choice="choice"
    :opponentChoice="opponentChoice"
    :result="result"
    :stats="stats"
    :timer="timer"
    @select-choice="selectChoice"
    @exit-game="exitGame"
  />
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { io } from "socket.io-client";
import InputForm from "./components/InputForm.vue";
import LobbyScreen from "./components/LobbyScreen.vue";
import GameScreen from "./components/GameScreen.vue";

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

const joinLobby = ({ lobby, password }) => {
  const payload = password ? { name: playerName.value, lobby: lobby.name, password } : { name: playerName.value, lobby: lobby.name };
  socket.emit("setName", payload);
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
  timer.value = 3; // Set countdown duration
  const countdown = setInterval(() => {
    timer.value--;
    if (timer.value <= 0) {
      clearInterval(countdown); // Stop the timer when it reaches 0
      // Reset choices after the countdown
      choice.value = null;
      opponentChoice.value = null;
      result.value = null;
      timer.value = null;
    }
  }, 1000); // Update every second
});
  socket.on("opponentLeft", (msg, updatedStats) => {
    message.value = msg;
    resetGameState();
    if (updatedStats) stats.value = updatedStats;
  });
});
</script>