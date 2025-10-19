<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getNoticeById, deleteNotice } from '@/api/adminNotice.js';
import LoadingSpinner from '@/components/common/atoms/LoadingSpinner.vue';
import { useAlertDialog } from '@/composables/useAlertDialog';

const route = useRoute();
const router = useRouter();
const noticeId = Number(route.params.noticeId);

const notice = ref(null);
const loading = ref(true);
const error = ref(null);
const { showAlert: showAlertDialog } = useAlertDialog();

async function fetchNotice() {
  try {
    loading.value = true;
    const response = await getNoticeById(noticeId);
    notice.value = response;
  } catch (e) {
    console.error('공지사항 상세 정보 조회 실패:', e);
    error.value = '데이터를 불러오는 중 오류가 발생했습니다.';
  } finally {
    loading.value = false;
  }
}

async function handleDelete() {
  if (confirm('정말로 이 공지사항을 삭제하시겠습니까?')) {
    try {
      await deleteNotice(noticeId);
      showAlertDialog('성공', '공지사항이 삭제되었습니다.');
      router.push({ name: 'AdminNoticeList' });
    } catch (e) {
      console.error('공지사항 삭제 실패:', e);
      showAlertDialog('오류', '삭제 중 오류가 발생했습니다.');
    }
  }
}

function goToList() {
  router.push({ name: 'AdminNoticeList' });
}

function goToEdit() {
  router.push({ name: 'AdminNoticeEdit', params: { noticeId } });
}

function formatDate(dateValue) {
  if (!dateValue) return 'N/A';

  let dt;
  if (Array.isArray(dateValue)) {
    // Assuming format [year, month, day, hour, minute, second]
    // Month is 0-indexed in Date constructor
    dt = new Date(dateValue[0], dateValue[1] - 1, dateValue[2], dateValue[3], dateValue[4], dateValue[5] || 0);
  } else {
    // Assuming it's a date string
    dt = new Date(dateValue);
  }

  if (isNaN(dt.getTime())) {
    return 'Invalid Date'; // Handle invalid date values
  }

  const year = dt.getFullYear();
  const month = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  const hours = String(dt.getHours()).padStart(2, '0');
  const minutes = String(dt.getMinutes()).padStart(2, '0');
  const seconds = String(dt.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
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
        <h5 class="card-title mb-0">{{ notice.title }}</h5>
      </div>
      <div class="card-body">
        <div class="d-flex justify-content-between text-muted small mb-3">
          <span>작성자: {{ notice.createdBy || 'N/A' }}</span>
          <span>등록일: {{ formatDate(notice.createdAt) }}</span>
        </div>
        <hr>
        <div v-html="notice.content" class="mt-4"></div>
      </div>
      <div class="card-footer d-flex justify-content-between">
        <button class="btn btn-secondary" @click="goToList">목록</button>
        <div>
          <button class="btn btn-primary me-2" @click="goToEdit">수정</button>
          <button class="btn btn-danger" @click="handleDelete">삭제</button>
        </div>
      </div>
    </div>
  </div>
</template>