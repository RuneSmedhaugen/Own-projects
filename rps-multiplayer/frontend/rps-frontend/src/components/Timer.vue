<!-- filepath: c:\Users\Rune S\source\repos\Own-projects\rps-multiplayer\frontend\rps-frontend\src\components\Timer.vue -->
<template>
    <div class="timer">
      <p>Next round starts in: {{ timer }} seconds</p>
    </div>
  </template>
  
  <script setup>
  const props = defineProps(["timer"]);
  </script>
  
  <style>
  .timer {
    margin-top: 10px;
    font-size: 1.2rem;
    color: #ff5722;
    font-weight: bold;
  }
  </style>