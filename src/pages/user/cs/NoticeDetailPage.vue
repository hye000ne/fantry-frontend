<template>
  <div v-if="loading" class="text-center py-5">
    <div class="spinner-border" role="status">
      <span class="sr-only">Loading...</span>
    </div>
  </div>
  <div v-else-if="notice" class="notice-detail-container">
    <div class="notice-header">
      <p class="notice-type mb-2">{{ notice.noticeType }}</p>
      <h2 class="notice-title">{{ notice.noticeType ? `(${notice.noticeType}) ` : '' }}{{ notice.title }}</h2>
      <div class="notice-meta">
        <span>{{ notice.createdBy }}</span>
        <span>{{ formatDate(notice.createdAt) }}</span>
      </div>
    </div>
    <div class="notice-content" v-html="notice.content"></div>
    <div class="notice-footer">
        <button @click="goBack" class="btn btn-outline-secondary">목록으로</button>
    </div>
  </div>
  <div v-else class="text-center py-5">
    <p>공지사항을 찾을 수 없습니다.</p>
    <button @click="goBack" class="btn btn-primary">목록으로</button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getNoticeDetail } from '@/api/notice';

const route = useRoute();
const router = useRouter();

const notice = ref(null);
const loading = ref(false);

const fetchNoticeDetail = async () => {
  loading.value = true;
  try {
    const noticeId = route.params.id;
    notice.value = await getNoticeDetail(noticeId);
    console.log('Notice Detail noticeType:', notice.value.noticeType);
  } catch (error) {
    console.error('공지사항 상세 정보를 불러오는 중 오류가 발생했습니다:', error);
    notice.value = null;
  } finally {
    loading.value = false;
  }
};

const formatDate = (dateArray) => {
  if (!dateArray || !Array.isArray(dateArray)) return '';
  const [year, month, day, hour, minute] = dateArray;
  const pad = (n) => String(n).padStart(2, '0');
  return `${year}.${pad(month)}.${pad(day)} ${pad(hour)}:${pad(minute)}`;
};

const goBack = () => {
    router.push('/cs/notice');
}

onMounted(() => {
  fetchNoticeDetail();
});
</script>

<style scoped>
.notice-detail-container {
  width: 100%;
}

.notice-header {
  padding-bottom: 1.5rem;
  border-bottom: 2px solid #212529;
}

.notice-type {
    font-size: 1rem;
    font-weight: 600;
    color: #007bff;
}

.notice-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.notice-meta {
  font-size: 0.9rem;
  color: #6c757d;
  display: flex;
  justify-content: space-between;
}

.notice-content {
  padding: 3rem 1rem;
  min-height: 300px;
  line-height: 1.8;
  border-bottom: 1px solid #dee2e6;
}

/* Styling for content from v-html */
.notice-content :deep(p) {
  margin-bottom: 1.5rem;
}

.notice-content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 0.25rem;
  margin: 1rem 0;
}

.notice-footer {
    padding-top: 2rem;
    text-align: center;
}
</style>
