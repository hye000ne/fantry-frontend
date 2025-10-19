<template>
  <div v-if="loading" class="text-center py-5">
    <div class="spinner-border" role="status">
      <span class="sr-only">Loading...</span>
    </div>
  </div>
  <div v-else-if="inquiry" class="notice-detail-container">
    <div class="notice-header">
      <p class="notice-type mb-2">{{ inquiry.csType ? inquiry.csType.name : 'N/A' }}</p>
      <h2 class="notice-title">{{ inquiry.title }}</h2>
      <div class="notice-meta">
        <span>{{ inquiry.inquiredByName }}</span>
        <span>{{ formatDateTime(inquiry.inquiredAt) }}</span>
      </div>
    </div>
    <div class="notice-content" v-html="inquiry.content"></div>

    <div class="notice-attachments" v-if="inquiry.attachmentUrls && inquiry.attachmentUrls.length > 0">
      <h4>첨부파일</h4>
      <ul>
        <li v-for="(url, index) in inquiry.attachmentUrls" :key="index">
          <a :href="url" target="_blank">{{ getFileNameFromUrl(url) }}</a>
        </li>
      </ul>
    </div>

    <hr> <!-- Always show separator for consistency -->

    <div class="answer-section">
      <h3 class="answer-title">답변</h3>
      <div v-if="inquiry.answerContent">
        <div class="answer-meta">
          <span>{{ inquiry.answeredByName }}</span>
          <span>{{ formatDateTime(inquiry.answeredAt) }}</span>
        </div>
        <div class="answer-content" v-html="inquiry.answerContent"></div>
      </div>
      <div v-else class="no-answer-message">
        <p>아직 관리자의 답변이 등록되지 않았습니다. 최대한 빠르게 답변해 드리겠습니다. 잠시만 기다려 주세요.</p>
      </div>
    </div>

    <div class="notice-footer">
      <button @click="goBack" class="btn btn-outline-secondary">목록으로</button>
    </div>
  </div>
  <div v-else class="text-center py-5">
    <p>문의를 찾을 수 없습니다.</p>
    <button @click="goBack" class="btn btn-primary">목록으로</button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getMyInquiryDetail } from '@/api/inquiry';

const route = useRoute();
const router = useRouter();

const inquiry = ref(null);
const loading = ref(false);

const fetchInquiryDetail = async () => {
  loading.value = true;
  try {
    const inquiryId = route.params.id;
    console.log('Fetching inquiry detail for ID:', inquiryId);
    const response = await getMyInquiryDetail(inquiryId);
    console.log('Inquiry API response:', response);
    inquiry.value = response;
  } catch (error) {
    console.error('문의 상세 정보를 불러오는 데 실패했습니다:', error);
    inquiry.value = null;
  } finally {
    loading.value = false;
  }
};

const formatDateTime = (dateTimeStr) => {
  if (!dateTimeStr) return '';
  const date = new Date(dateTimeStr);
  // Check if the date is valid before formatting
  if (isNaN(date.getTime())) {
    console.error("Invalid date string:", dateTimeStr);
    return ''; // Return empty string for invalid dates
  }
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

const getFileNameFromUrl = (url) => {
  try {
    const urlObj = new URL(url);
    const pathSegments = urlObj.pathname.split('/');
    return pathSegments[pathSegments.length - 1];
  } catch (e) {
    console.error("Invalid URL for file name extraction:", url, e);
    return url; // Fallback to full URL if parsing fails
  }
};

const goBack = () => {
  router.back();
};

onMounted(() => {
  fetchInquiryDetail();
});
</script>

<style scoped>
.notice-detail-container {
  width: 100%;
  max-width: 960px; /* Added max-width for better readability */
  margin: 0 auto; /* Center the container */
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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

.notice-attachments {
  padding: 1rem;
  border-bottom: 1px solid #dee2e6;
}

.notice-attachments h4 {
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
}

.notice-attachments ul {
  list-style: none;
  padding: 0;
}

.notice-attachments li {
  margin-bottom: 0.5rem;
}

.answer-section {
  padding: 2rem 1rem;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin-top: 2rem;
  border: 1px solid #e9ecef;
}

.answer-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #28a745; /* Green for answer */
  margin-bottom: 1rem;
}

.answer-meta {
  font-size: 0.85rem;
  color: #6c757d;
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
}

.answer-content {
  line-height: 1.8;
}

.notice-footer {
  padding-top: 2rem;
  text-align: center;
}

.no-answer-message {
  padding: 1.5rem;
  background-color: #e9f7ef; /* Light green background */
  border: 1px solid #d4edda; /* Green border */
  border-radius: 5px;
  color: #155724; /* Dark green text */
  text-align: center;
  margin-top: 1rem;
}

.no-answer-message p {
  margin-bottom: 0;
  font-size: 1.1rem;
}
</style>