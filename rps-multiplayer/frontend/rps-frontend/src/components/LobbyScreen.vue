<!-- filepath: c:\Users\Rune S\source\repos\Own-projects\rps-multiplayer\frontend\rps-frontend\src\components\LobbyScreen.vue -->
<template>
  <div class="lobby-screen">
    <button @click="onBack" class="back-button">⬅ Back</button>
    <h2>Available Lobbies</h2>
    <input type="text" v-model="searchQuery" placeholder="Search for lobbies..." class="search-bar" />
    <label>
      <input type="checkbox" v-model="showOnlyUnlocked" /> Show only unlocked lobbies
    </label>
    <div v-for="lobby in filteredLobbies" :key="lobby.name" class="lobby-item" @click="joinLobby(lobby)">
      {{ lobby.name }} ({{ lobby.creator }}) <span v-if="lobby.locked" class="lobby-lock">🔒</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";

// Props from parent
const props = defineProps(["lobbies"]);
const emit = defineEmits(["join-lobby", "back"]);

const searchQuery = ref("");
const showOnlyUnlocked = ref(false);

// Ensure computed lobbies update when new data arrives
const filteredLobbies = computed(() => {
  return props.lobbies.filter(lobby => 
    lobby.name.toLowerCase().includes(searchQuery.value.toLowerCase()) &&
    (!showOnlyUnlocked.value || !lobby.locked)
  );
});

const joinLobby = (lobby) => {
  if (lobby.locked) {
    const enteredPassword = prompt("Enter the lobby password:");
    emit("join-lobby", { lobby, password: enteredPassword });
  } else {
    emit("join-lobby", { lobby });
  }
};

const onBack = () => {
  emit("back");
};
</script>


<style>
/* Add styles for the lobby screen here */
</style>