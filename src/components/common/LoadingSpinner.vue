<template>
  <div v-if="show" class="loading-overlay">
    <div class="loading-content">
      <img :src="imageSrc" alt="Loading" class="loading-image" />
      <p class="loading-message">{{ message }}</p>
    </div>
  </div>
</template>

<script setup>
import { defineProps, computed } from 'vue';

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  message: {
    type: String,
    default: '로딩 중...',
  },
  imagePath: {
    type: String,
    default: '/images/fantry_loading.png', // Default path to the user's image
  },
});

const imageSrc = computed(() => props.imagePath);
</script>

<style scoped>
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.8); /* Semi-transparent white background */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999; /* Ensure it's on top of other content */
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.loading-image {
  width: 80px; /* Adjust size as needed */
  height: 80px; /* Adjust size as needed */
  animation: bounce 0.8s infinite alternate; /* Bouncing animation */
}

.loading-message {
  margin-top: 15px;
  font-size: 1.2em;
  color: #333;
  font-weight: bold;
}

@keyframes bounce {
  0% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(-15px); /* Bounce up 15px */
  }
}
</style>
