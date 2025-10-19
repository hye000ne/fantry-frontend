import { defineStore } from 'pinia';
import { ref, readonly } from 'vue';

export const useUiStore = defineStore('ui', () => {
  const isLoading = ref(false);
  const delayTimeout = ref(null); // 로딩 표시 지연을 위한 setTimeout ID
  const DELAY_TIME = 200; // 200ms 이후에 로딩 표시

  function startLoading() {
    // 이전 지연 타임아웃이 있다면 취소
    if (delayTimeout.value) {
      clearTimeout(delayTimeout.value);
      delayTimeout.value = null;
    }

    // DELAY_TIME 이후에 로딩 상태를 true로 설정
    delayTimeout.value = setTimeout(() => {
      isLoading.value = true;
    }, DELAY_TIME);
  }

  function stopLoading() {
    // 로딩 표시가 지연 중이었다면 취소하고 즉시 숨김
    if (delayTimeout.value) {
      clearTimeout(delayTimeout.value);
      delayTimeout.value = null;
    }
    isLoading.value = false;
  }

  return {
    isLoading: readonly(isLoading),
    startLoading,
    stopLoading,
  };
});
