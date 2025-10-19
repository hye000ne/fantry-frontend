<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { createNotice, addNoticeAttachments } from '@/api/adminNotice.js';
import CommonEditor from '@/components/common/organisms/CommonEditor.vue';
import { useAlertDialog } from '@/composables/useAlertDialog';

const router = useRouter();
const { showAlert: showAlertDialog } = useAlertDialog();

const newNotice = ref({
  title: '',
  content: '',
  status: 'DRAFT', // 기본값을 'DRAFT'로 변경
  noticeTypeId: 1, // 기본값 '공지'
});

const selectedFiles = ref([]);
const previewFiles = ref([]);
const error = ref(null);

const typeOptions = [
  { id: 1, name: '공지' },
  { id: 2, name: '이벤트' },
];

const statusOptions = ref([
  { value: 'ACTIVE', text: '활성' },
  { value: 'INACTIVE', text: '비활성' },
  { value: 'PINNED', text: '고정' },
  { value: 'DRAFT', text: '초안' },
]);

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
  if (!newNotice.value.title || !newNotice.value.content || !newNotice.value.status) {
    showAlertDialog('알림', '제목, 내용, 상태를 모두 입력해주세요.');
    return;
  }

  try {
    const noticeResponse = await createNotice(newNotice.value);
    const noticeId = noticeResponse.noticeId;

    if (selectedFiles.value.length > 0) {
      await addNoticeAttachments(noticeId, selectedFiles.value);
    }

    showAlertDialog('성공', '새 공지사항이 성공적으로 등록되었습니다.');
    router.push({ name: 'AdminNoticeList' });
  } catch (e) {
    console.error('공지사항 등록 실패:', e);
    error.value = '등록 중 오류가 발생했습니다.';
    showAlertDialog('오류', error.value);
  }
}

function goToList() {
  router.push({ name: 'AdminNoticeList' });
}
</script>

<template>
  <div class="container-fluid p-4">
    <div class="card shadow-sm">
      <div class="card-header">
        <h5 class="card-title mb-0">새 공지사항 등록</h5>
      </div>
      <div class="card-body">
        <form @submit.prevent="handleSubmit">
          <div class="mb-3">
            <label for="notice-title" class="form-label">제목</label>
            <input type="text" id="notice-title" class="form-control" v-model="newNotice.title" required>
          </div>

          <div class="row">
            <div class="col-md-6 mb-3">
              <label for="notice-type" class="form-label">유형</label>
              <select id="notice-type" class="form-select" v-model="newNotice.noticeTypeId" required>
                <option v-for="type in typeOptions" :key="type.id" :value="type.id">{{ type.name }}</option>
              </select>
            </div>
            <div class="col-md-6 mb-3">
              <label for="notice-status" class="form-label">상태</label>
              <select id="notice-status" class="form-select" v-model="newNotice.status" required>
                <option v-for="option in statusOptions" :key="option.value" :value="option.value">{{ option.text }}</option>
              </select>
            </div>
          </div>

          <div class="mb-3">
            <label class="form-label">내용</label>
            <CommonEditor v-model="newNotice.content" />
          </div>

          <div class="mb-3">
            <label for="notice-attachments" class="form-label">첨부 파일</label>
            <input type="file" id="notice-attachments" class="form-control" multiple @change="handleFileChange">
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