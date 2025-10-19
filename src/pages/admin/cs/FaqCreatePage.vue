<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { createFaq, addFaqAttachments } from '@/api/adminFaq.js';
import CommonEditor from '@/components/common/organisms/CommonEditor.vue';
import { useAlertDialog } from '@/composables/useAlertDialog';

const router = useRouter();
const { showAlert: showAlertDialog } = useAlertDialog();

const newFaq = ref({
  csTypeId: null,
  title: '',
  content: '',
});

const selectedFiles = ref([]);
const previewFiles = ref([]); // 미리보기 URL을 저장할 ref

const error = ref(null);

const csTypes = ref([
  { id: 1, name: '배송문의' },
  { id: 2, name: '결제문의' },
  { id: 3, name: '기타문의' },
  { id: 4, name: '상품문의' },
  { id: 5, name: '환불/반품 문의' },
  { id: 6, name: '판매 문의' },
]);

// URL이 이미지 파일인지 확인하는 헬퍼 함수
function isImage(url) {
  return /\.(jpeg|jpg|gif|png|webp|bmp)$/i.test(url);
}

function handleFileChange(event) {
  selectedFiles.value = Array.from(event.target.files);
  previewFiles.value = selectedFiles.value.map(file => ({
    name: file.name,
    url: URL.createObjectURL(file)
  }));
}

async function handleSubmit() {
  if (!newFaq.value.csTypeId || !newFaq.value.title || !newFaq.value.content) {
    showAlertDialog('알림', '모든 필드를 입력해주세요.');
    return;
  }

  try {
    const faqResponse = await createFaq(newFaq.value);
    const faqId = faqResponse.faqId;

    if (selectedFiles.value.length > 0) {
      await addFaqAttachments(faqId, selectedFiles.value);
    }

    showAlertDialog('성공', '새 FAQ가 성공적으로 등록되었습니다.');
    router.push({ name: 'AdminFaqList' });
  } catch (e) {
    console.error('FAQ 등록 실패:', e);
    error.value = '등록 중 오류가 발생했습니다.';
    showAlertDialog('오류', error.value);
  }
}

function goToList() {
  router.push({ name: 'AdminFaqList' });
}
</script>

<template>
  <div class="container-fluid p-4">
    <div class="card shadow-sm">
      <div class="card-header">
        <h5 class="card-title mb-0">새 FAQ 등록</h5>
      </div>
      <div class="card-body">
        <form @submit.prevent="handleSubmit">
          <div class="mb-3">
            <label for="faq-title" class="form-label">제목</label>
            <input type="text" id="faq-title" class="form-control" v-model="newFaq.title" required>
          </div>

          <div class="mb-3">
            <label for="faq-cs-type" class="form-label">문의 유형</label>
            <select id="faq-cs-type" class="form-select" v-model="newFaq.csTypeId" required>
              <option :value="null" disabled>유형을 선택하세요</option>
              <option v-for="type in csTypes" :key="type.id" :value="type.id">{{ type.name }}</option>
            </select>
          </div>

          <div class="mb-3">
            <label class="form-label">내용</label>
            <CommonEditor v-model="newFaq.content" />
          </div>

          <div class="mb-3">
            <label for="faq-attachments" class="form-label">첨부 파일</label>
            <input type="file" id="faq-attachments" class="form-control" multiple @change="handleFileChange">
          </div>

          <div v-if="previewFiles.length > 0" class="mb-3">
            <h6>선택된 파일 미리보기</h6>
            <div class="d-flex flex-wrap gap-2">
              <div v-for="(file, index) in previewFiles" :key="index">
                <img v-if="isImage(file.url)" :src="file.url" alt="Preview" class="img-thumbnail" style="max-width: 150px; max-height: 150px; object-fit: cover;">
                <a v-else :href="file.url" target="_blank" class="btn btn-sm btn-outline-info">
                  <i class="fas fa-paperclip me-1"></i> {{ file.name }}
                </a>
              </div>
            </div>
          </div>

          <div class="d-flex justify-content-between">
            <button type="button" class="btn btn-secondary" @click="goToList">취소</button>
            <button type="submit" class="btn btn-primary">등록</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.img-thumbnail {
  border: 1px solid #ddd;
  padding: 3px;
  border-radius: 5px;
}

.gap-2 {
  gap: 0.5rem;
}
</style>