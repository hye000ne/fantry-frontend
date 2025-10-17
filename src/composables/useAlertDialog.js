import { ref } from 'vue';

// 애플리케이션 전체에서 공유될 상태
const isVisible = ref(false);
const title = ref('');
const message = ref('');

export function useAlertDialog() {

  /**
   * 전역 알림 모달을 엽니다.
   * @param {string} newTitle - 모달에 표시될 제목
   * @param {string} newMessage - 모달에 표시될 메시지
   */
  const showAlert = (newTitle, newMessage) => {
    title.value = newTitle;
    message.value = newMessage;
    isVisible.value = true;
  };

  return {
    isVisible,
    title,
    message,
    showAlert
  };
}