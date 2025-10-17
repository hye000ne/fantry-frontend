<script setup>
import { watch, onMounted } from 'vue';
import { useModal } from '@/composables/useModal.js';
import { useAlertDialog } from '@/composables/useAlertDialog.js';

// 모달의 상태(제목, 내용, 노출 여부)
const { isVisible, title, message } = useAlertDialog();

// 부트스트랩 모달 제어
const { initModal, show: showModal, hide: hideModal } = useModal('#alert-dialog-global');

onMounted(() => {
    initModal();
    const modalEl = document.getElementById('alert-dialog-global');

    // 부트스트랩 모달이 닫힐 때 (배경 클릭, ESC 키 등) isVisible 상태를 동기화합니다.
    modalEl.addEventListener('hidden.bs.modal', () => {
        isVisible.value = false;
    });

    // isVisible 상태를 감시하여 부트스트랩 모달을 열거나 닫습니다.
    watch(isVisible, (newValue) => {
        if (newValue) {
            showModal();
        } else {
            hideModal();
        }
    });
});

</script>

<template>
  <div class="modal fade" id="alert-dialog-global" tabindex="-1" aria-labelledby="alertDialogLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="alertDialogLabel">{{ title }}</h5>
          <button type="button" class="close" data-dismiss="modal" aria-label="Close" @click="isVisible = false">
             <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div class="modal-body">
          <p v-html="message"></p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-primary" @click="isVisible = false">확인</button>
        </div>
      </div>
    </div>
  </div>
</template>