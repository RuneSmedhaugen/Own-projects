<script setup>
import { ref } from "vue";
import { io } from "socket.io-client";

const socket = io("https://rps-game.onrender.com");

const playerName = ref("");
const isWaiting = ref(true);
const message = ref("Enter your name to start");
const opponentName = ref("");
const choice = ref(null);
const opponentChoice = ref(null);
const result = ref(null);

const setName = () => {
  if (!playerName.value.trim()) return;
  console.log(`Sending name: ${playerName.value}`);
  socket.emit("setName", playerName.value.trim());
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
});

socket.on("result", (data) => {
  console.log(`Result received: You - ${data.yourChoice}, Opponent - ${data.opponentChoice}, Outcome - ${data.result}`);
  opponentChoice.value = data.opponentChoice;
  result.value = data.result;
});

socket.on("opponentLeft", () => {
  console.log("Opponent left the game");
  message.value = "Your opponent left. Waiting for a new player...";
  choice.value = null;
  opponentChoice.value = null;
  result.value = null;
  opponentName.value = "";
});
</script>

<template>
  <div class="game">
    <h1>Multiplayer Rock Paper Scissors</h1>

    <div v-if="isWaiting">
      <input v-model="playerName" placeholder="Enter your name" />
      <button @click="setName">Join Queue</button>
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
</style>
