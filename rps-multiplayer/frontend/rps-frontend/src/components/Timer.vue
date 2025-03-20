<template>
    <div class="timer">
      <p>Next round starts in: {{ timer }} seconds</p>
    </div>
  </template>
  
  <script setup>
  const props = defineProps(["timer"]);
  </script>