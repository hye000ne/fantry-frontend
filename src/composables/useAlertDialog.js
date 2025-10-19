import { ref } from 'vue';

// 애플리케이션 전체에서 공유될 상태
const isVisible = ref(false);
const title = ref('');
const message = ref('');
const isConfirm = ref(false); // New ref to indicate if it's a confirmation dialog
let resolvePromise; // To store the resolve function of the promise

const showAlert = (newTitle, newMessage, confirm = false) => {
  title.value = newTitle;
  message.value = newMessage;
  isConfirm.value = confirm;
  isVisible.value = true;

  if (confirm) {
    return new Promise((resolve) => {
      resolvePromise = resolve;
    });
  }
};

const confirmDialog = (result) => {
  isVisible.value = false;
  if (resolvePromise) {
    resolvePromise(result);
    resolvePromise = null; // Clear the promise resolver
  }
};

export function useAlertDialog() {
  return {
    isVisible,
    title,
    message,
    isConfirm, // Expose isConfirm
    showAlert,
    confirmDialog, // Expose confirmDialog
  };
}