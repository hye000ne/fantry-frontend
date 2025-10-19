<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getFaqById, deleteFaq } from '@/api/adminFaq.js';
import LoadingSpinner from '@/components/common/atoms/LoadingSpinner.vue';
import { useAlertDialog } from '@/composables/useAlertDialog';

const route = useRoute();
const router = useRouter();
const faqId = Number(route.params.faqId);

const faq = ref(null);
const loading = ref(true);
const error = ref(null);
const { showAlert: showAlertDialog } = useAlertDialog();

// URL이 이미지 파일인지 확인하는 헬퍼 함수
function isImage(url) {
  return /\.(jpeg|jpg|gif|png|webp|bmp)$/i.test(url);
}

async function fetchFaq() {
  try {
    loading.value = true;
    const response = await getFaqById(faqId);
    faq.value = response;
  } catch (e) {
    console.error('FAQ 상세 정보 조회 실패:', e);
    error.value = '데이터를 불러오는 중 오류가 발생했습니다.';
  } finally {
    loading.value = false;
  }
}

async function handleDelete() {
  if (confirm('정말로 이 FAQ를 삭제하시겠습니까?')) {
    try {
      await deleteFaq(faqId);
      showAlertDialog('성공', 'FAQ가 삭제되었습니다.');
      router.push({ name: 'AdminFaqList' });
    } catch (e) {
      console.error('FAQ 삭제 실패:', e);
      showAlertDialog('오류', '삭제 중 오류가 발생했습니다.');
    }
  }
}

function goToList() {
  router.push({ name: 'AdminFaqList' });
}

function goToEdit() {
  console.log('Navigating to AdminFaqEdit with faqId:', faqId);
  router.push({ name: 'AdminFaqEdit', params: { faqId } });
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

onMounted(fetchFaq);
</script>

<template>
  <div class="container-fluid p-4">
    <div v-if="loading" class="text-center">
      <LoadingSpinner />
      <p>데이터를 불러오는 중입니다...</p>
    </div>
    <div v-if="error" class="alert alert-danger">{{ error }}</div>

    <div v-if="faq" class="card shadow-sm">
      <div class="card-header">
        <h5 class="card-title mb-0">FAQ 상세 정보</h5>
      </div>
      <div class="card-body">
        <div class="row">
          <div class="col-md-6">
            <p><strong>#ID:</strong> {{ faq.faqId }}</p>
            <p><strong>제목:</strong> {{ faq.title }}</p>
            <p><strong>작성자:</strong> {{ faq.createdBy || 'N/A' }}</p>
          </div>
          <div class="col-md-6">
            <p><strong>문의 유형:</strong> {{ faq.csType || 'N/A' }}</p>
            <p><strong>상태:</strong> 
              <span class="badge"
                :class="{
                  'bg-success': faq.status === 'ACTIVE',
                  'bg-info': faq.status === 'PINNED',
                  'bg-secondary': faq.status === 'DRAFT',
                  'bg-danger': faq.status === 'INACTIVE',
                }"
              >
                {{ 
                  faq.status === 'ACTIVE' ? '활성' :
                  faq.status === 'PINNED' ? '고정' :
                  faq.status === 'DRAFT' ? '초안' :
                  faq.status === 'INACTIVE' ? '비활성' :
                  faq.status
                }}
              </span>
            </p>
            <p><strong>등록일:</strong> {{ formatDate(faq.createdAt) }}</p>
          </div>
        </div>
        <hr>
        <h6>내용</h6>
        <div class="p-3 bg-light rounded" v-html="faq.content"></div>

        <!-- 첨부 파일 섹션 -->
        <div v-if="faq.attachmentUrls && faq.attachmentUrls.length > 0" class="mt-4">
          <h6>첨부 파일</h6>
          <div class="d-flex flex-wrap gap-2">
            <div v-for="(url, index) in faq.attachmentUrls" :key="index">
              <a :href="url" target="_blank" class="btn btn-sm btn-outline-info" v-if="!isImage(url)">
                <i class="fas fa-paperclip me-1"></i> 파일 {{ index + 1 }}
              </a>
              <a :href="url" target="_blank" v-else>
                <img :src="url" alt="Attachment Preview" class="img-thumbnail" style="max-width: 150px; max-height: 150px; object-fit: cover;">
              </a>
            </div>
          </div>
        </div>
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