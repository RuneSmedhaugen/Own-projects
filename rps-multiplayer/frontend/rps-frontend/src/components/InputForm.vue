<template>
    <div>
      <h1>RPS Online</h1>
      <div class="input-container">
        <input
          type="text"
          :value="playerName"
          @input="$emit('update:playerName', $event.target.value)"
          placeholder="Enter your name"
          required
        />
      </div>
      <div class="input-container">
        <input
          type="text"
          :value="lobbyName"
          @input="$emit('update:lobbyName', $event.target.value)"
          placeholder="Enter lobby name (optional)"
        />
      </div>
      <div class="input-container">
        <input
          type="password"
          :value="lobbyPassword"
          @input="$emit('update:lobbyPassword', $event.target.value)"
          placeholder="Set password (optional)"
        />
      </div>
      <button @click="setName">Join Queue</button>
      <button @click="$emit('show-lobby-screen')">Find Lobbies</button>
    </div>
  </template>
  
  <script setup>
  const props = defineProps(["playerName", "lobbyName", "lobbyPassword"]);
  
  // Declare all emitted events, including `update` events
  const emit = defineEmits([
    "set-name",
    "show-lobby-screen",
    "update:playerName",
    "update:lobbyName",
    "update:lobbyPassword",
  ]);
  
  const setName = () => {
    emit("set-name", {
      playerName: props.playerName,
      lobbyName: props.lobbyName,
      lobbyPassword: props.lobbyPassword,
    });
  };
  </script>