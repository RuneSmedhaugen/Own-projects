<template>
    <div>
      <p>{{ message }}</p>
      <div v-if="opponentName">
        <h3 v-if="choice">You: {{ choice }}</h3>
        <h3 v-if="opponentChoice">{{ opponentName }}: {{ opponentChoice }}</h3>
        <h2 v-if="result">{{ result }}</h2>
        <div class="choices">
          <button v-if="choice" disabled>
            {{ choice === 'rock' ? '🗿' : choice === 'paper' ? '📄' : '✂️' }}
          </button>
          <template v-else>
            <button @click="selectChoice('rock')">🗿</button>
            <button @click="selectChoice('paper')">📄</button>
            <button @click="selectChoice('scissors')">✂️</button>
          </template>
        </div>
        <Timer v-if="timer !== null" :timer="timer" />
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
  import Timer from "./Timer.vue";
  
  // Define props
  const props = defineProps(["message", "opponentName", "choice", "opponentChoice", "result", "stats", "timer"]);
  
  // Define emits
  const emit = defineEmits(["select-choice", "exit-game"]);
  
  // Emit the select-choice event
  const selectChoice = (choice) => {
    emit("select-choice", choice);
  };
  
  // Emit the exit-game event
  const exitGame = () => {
    emit("exit-game");
  };
  </script>
  
  <style>
  /* Add styles for the game screen here */
  </style>