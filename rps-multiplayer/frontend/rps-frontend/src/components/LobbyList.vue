<template>
    <div class="lobby-screen">
      <button @click="$emit('goBack')" class="back-button">⬅ Back</button>
      <h2>Available Lobbies</h2>
      <input type="text" v-model="searchQuery" placeholder="Search for lobbies..." class="search-bar" />
      <label class="checkbox-label">
        <input type="checkbox" v-model="showOnlyUnlocked" /> Show only unlocked lobbies
      </label>
      <div class="lobby-list">
        <div v-for="lobby in filteredLobbies" :key="lobby.name" class="lobby-item" @click="joinLobby(lobby)">
          <div class="lobby-name">{{ lobby.name }}</div>
          <div class="lobby-info">Created by: {{ lobby.creator }} <span v-if="lobby.locked" class="lobby-lock">🔒</span></div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted } from "vue";
  import { io } from "socket.io-client";
  
  const socket = io("https://own-projects.onrender.com");
  const playerName = ref("");
  const lobbies = ref([]);
  const searchQuery = ref("");
  const showOnlyUnlocked = ref(false);
  
  const filteredLobbies = computed(() => {
    return lobbies.value.filter(lobby => 
      lobby.name.toLowerCase().includes(searchQuery.value.toLowerCase()) &&
      (!showOnlyUnlocked.value || !lobby.locked)
    );
  });
  
  const joinLobby = (lobby) => {
    if (lobby.locked) {
      const enteredPassword = prompt("Enter the lobby password:");
      socket.emit("setName", { name: playerName.value.trim(), lobby: lobby.name, password: enteredPassword });
    } else {
      socket.emit("setName", { name: playerName.value.trim(), lobby: lobby.name });
    }
  };
  
  onMounted(() => {
    socket.emit("getLobbies");
    socket.on("lobbyList", (data) => {
      lobbies.value = data;
    });
  });
  </script>