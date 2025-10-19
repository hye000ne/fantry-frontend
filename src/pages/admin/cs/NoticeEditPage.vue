<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getNoticeById, updateNotice, addNoticeAttachments } from '@/api/adminNotice.js'; // addNoticeAttachments 임포트
import CommonEditor from '@/components/common/organisms/CommonEditor.vue';
import LoadingSpinner from '@/components/common/atoms/LoadingSpinner.vue';
import { useAlertDialog } from '@/composables/useAlertDialog';

const route = useRoute();
const router = useRouter();
const noticeId = Number(route.params.noticeId);

const notice = ref(null);
const loading = ref(true);
const error = ref(null);
const selectedFiles = ref([]); // 새 파일 저장을 위한 ref
const { showAlert: showAlertDialog } = useAlertDialog();

const statusOptions = ref([
  { value: 'ACTIVE', text: '활성' },
  { value: 'INACTIVE', text: '비활성' },
  { value: 'PINNED', text: '고정' },
  { value: 'DRAFT', text: '초안' },
]);

const typeOptions = [
  { id: 1, name: '배송문의' },
  { id: 2, name: '결제문의' },
  { id: 3, name: '기타문의' },
  { id: 4, name: '상품문의' },
  { id: 5, name: '환불/반품 문의' },
  { id: 6, name: '판매 문의' },
];

// 파일 변경 핸들러
function handleFileChange(event) {
  selectedFiles.value = Array.from(event.target.files);
}

async function fetchNotice() {
  try {
    loading.value = true;
    const response = await getNoticeById(noticeId);
    notice.value = response;
    
    const foundType = typeOptions.find(t => t.name === notice.value.csType);
    if (foundType) {
      notice.value.csTypeId = foundType.id;
    }

  } catch (e) {
    console.error('공지사항 정보 로드 실패:', e);
    error.value = '데이터를 불러오는 중 오류가 발생했습니다.';
  } finally {
    loading.value = false;
  }
}

async function handleSubmit() {
  if (!notice.value) return;

  const payload = {
    title: notice.value.title,
    content: notice.value.content,
    status: notice.value.status,
    csTypeId: notice.value.csTypeId,
  };

  try {
    await updateNotice(noticeId, payload);

    if (selectedFiles.value.length > 0) {
      await addNoticeAttachments(noticeId, selectedFiles.value);
    }

    alert('공지사항이 성공적으로 수정되었습니다.');
    router.push({ name: 'AdminNoticeDetail', params: { noticeId } });
  } catch (e) {
    console.error('공지사항 수정 실패:', e);
    showAlertDialog('오류', '수정 중 오류가 발생했습니다.');
  }
}

function goToDetail() {
  router.push({ name: 'AdminNoticeDetail', params: { noticeId } });
}

onMounted(fetchNotice);
</script>

<template>
  <div class="container-fluid p-4">
    <div v-if="loading" class="text-center">
      <LoadingSpinner />
    </div>
    <div v-if="error" class="alert alert-danger">{{ error }}</div>

    <div v-if="notice" class="card shadow-sm">
      <div class="card-header">
        <h5 class="card-title mb-0">공지사항 수정</h5>
      </div>
      <div class="card-body">
        <form @submit.prevent="handleSubmit">
          <div class="mb-3">
            <label for="notice-title" class="form-label">제목</label>
            <input type="text" id="notice-title" class="form-control" v-model="notice.title" required>
          </div>

          <div class="row">
            <div class="col-md-6 mb-3">
              <label for="notice-type" class="form-label">유형</label>
              <select id="notice-type" class="form-select" v-model="notice.csTypeId" required>
                <option v-for="type in typeOptions" :key="type.id" :value="type.id">{{ type.name }}</option>
              </select>
            </div>
            <div class="col-md-6 mb-3">
              <label for="notice-status" class="form-label">상태</label>
              <select id="notice-status" class="form-select" v-model="notice.status" required>
                <option v-for="option in statusOptions" :key="option.value" :value="option.value">{{ option.text }}</option>
              </select>
            </div>
          </div>

          <div class="mb-3">
            <label class="form-label">내용</label>
            <CommonEditor v-model="notice.content" />
          </div>

          <div class="mb-3" v-if="notice.attachmentUrls && notice.attachmentUrls.length > 0">
            <label class="form-label">기존 첨부 파일</label>
            <div class="d-flex flex-wrap gap-2">
              <a v-for="(url, index) in notice.attachmentUrls" :key="index" :href="url" target="_blank" class="btn btn-sm btn-outline-info">
                <i class="fas fa-paperclip me-1"></i> 파일 {{ index + 1 }}
              </a>
            </div>
          </div>

          <div class="mb-3">
            <label for="notice-attachments" class="form-label">새 첨부 파일</label>
            <input type="file" id="notice-attachments" class="form-control" multiple @change="handleFileChange">
            <small class="form-text text-muted">새로운 파일을 추가합니다. 기존 파일은 유지됩니다.</small>
          </div>

          <div class="d-flex justify-content-between">
            <button type="button" class="btn btn-secondary" @click="goToDetail">취소</button>
            <button type="submit" class="btn btn-primary">저장</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>