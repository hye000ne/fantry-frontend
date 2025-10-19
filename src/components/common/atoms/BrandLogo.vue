<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router'

const props = defineProps({
  type: {
    type: String,
    default: 'default', // 'default' or 'text'
  },
});

const router = useRouter();

const logoSrc = computed(() => {
  if (props.type === 'text') {
    return '/images/fatnry_text_logo.png';
  }
  return '/images/fantry_logo.png';
});

const logoClass = computed(() => {
  return props.type === 'text' ? 'logo-text' : 'logo-default';
});
</script> 
<template>
  <div class="logo">
    <img @click="router.push('/')" :src="logoSrc" :class="logoClass" style="cursor: pointer;" />
  </div>
</template>
<style scoped>
img {
  display: block;
  margin: 0 auto;
}

.logo-text {
  height: 40px;
}

.logo-default {
  /* 기본 로고 스타일 */
}
</style>