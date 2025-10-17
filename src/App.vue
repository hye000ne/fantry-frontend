<script setup>
import { useUiStore } from '@/stores/uiStore';
import LoadingSpinner from '@/components/common/atoms/LoadingSpinner.vue';
import AlertDialog from '@/components/common/organisms/AlertDialog.vue';
import { onMounted, onUnmounted } from 'vue';
import { useUserStore } from '@/stores/userStore';
import { useIdleTimer } from './utils/timerComposable';
import { disconnectSse } from './api/notification';

const uiStore = useUiStore();
const userStore = useUserStore();

// 미활동 시 자동 로그아웃 로직 적용
const IDLE_TIMEOUT_MINUTES = 110;   //2시간 기준 10분 일찍 로그아웃
const { showLogoutMessage } = useIdleTimer(IDLE_TIMEOUT_MINUTES);
console.log("미활동 감지 메시지: ", showLogoutMessage);

onMounted(() => {
  if(userStore.isLoggedIn || userStore.currentUser == null) {
    userStore.fetchUser();  //토큰 기반 유저 상태복구
  }
})

onUnmounted(() => {
  console.log('App onUnmounted')

  if (userStore.currentUser) {
    disconnectSse(userStore.currentUser.id)
  }
})
</script>

<template>
  <!-- 로딩 스피너: uiStore의 isLoading 상태가 true일 때만 보입니다. -->
  <LoadingSpinner v-if="uiStore.isLoading" />
  <!-- alert 모달 -->
  <AlertDialog />
  <!-- 라우터 뷰: 현재 경로에 맞는 페이지 컴포넌트가 렌더링됩니다. -->
  <router-view />
</template>

<style scoped></style>
