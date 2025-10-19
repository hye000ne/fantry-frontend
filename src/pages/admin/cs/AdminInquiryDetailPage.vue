<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getInquiryById, answerInquiry } from '@/api/adminInquiry';
import CommonEditor from '@/components/common/organisms/CommonEditor.vue';
import LoadingSpinner from '@/components/common/atoms/LoadingSpinner.vue';
import { useAlertDialog } from '@/composables/useAlertDialog';

const route = useRoute();
const router = useRouter();
const inquiryId = Number(route.params.inquiryId);

const inquiry = ref(null);
const loading = ref(true);
const error = ref(null);
const { showAlert: showAlertDialog } = useAlertDialog();

// 상태 선택 옵션
const statusOptions = ref([
  { value: 'PENDING', text: '답변 대기' },
  { value: 'IN_PROGRESS', text: '처리 중' },
  { value: 'ON_HOLD', text: '보류' },
  { value: 'REJECTED', text: '거절 (스팸)' },
  { value: 'ANSWERED', text: '답변 완료' },
]);

// 상태를 한글로 변환하는 함수
function getStatusText(status) {
  const option = statusOptions.value.find(opt => opt.value === status);
  return option ? option.text : status;
}

// 상태에 따라 동적 클래스를 반환하는 함수
function getStatusClass(status) {
  switch (status) {
    case 'PENDING': return 'bg-primary';
    case 'IN_PROGRESS': return 'bg-info';
    case 'ON_HOLD': return 'bg-warning text-dark';
    case 'REJECTED': return 'bg-dark';
    case 'ANSWERED': return 'bg-success';
    default: return 'bg-secondary';
  }
}

// URL이 이미지 파일인지 확인하는 헬퍼 함수
function isImage(url) {
  return /\.(jpeg|jpg|gif|png|webp|bmp)$/i.test(url);
}

// 문의 상세 정보 로드
async function fetchInquiry() {
  try {
    loading.value = true;
    const response = await getInquiryById(inquiryId);
    inquiry.value = response; // unwrap 했으므로 .data 제거
    
    // 기존 답변이 없으면 빈 문자열로 초기화
    if (!inquiry.value.answerContent) {
      inquiry.value.answerContent = '';
    }
    if (!inquiry.value.comment) {
      inquiry.value.comment = '';
    }
    // 현재 상태를 기본 선택값으로 설정
    inquiry.value.reqStatus = inquiry.value.status;
  } catch (e) {
    console.error('문의 상세 정보 조회 실패:', e);
    error.value = '데이터를 불러오는 중 오류가 발생했습니다.';
  } finally {
    loading.value = false;
  }
}

// 답변 제출
async function handleSubmit() {
  if (!inquiry.value) return;

  if (!inquiry.value.answerContent || !inquiry.value.answerContent.trim()) {
    showAlertDialog('알림', '답변 내용을 입력해주세요.');
    return;
  }

  if (!inquiry.value.reqStatus) {
    showAlertDialog('알림', '처리 상태를 선택해주세요.');
    return;
  }

  const payload = {
    answerContent: inquiry.value.answerContent,
    reqStatus: inquiry.value.reqStatus,
    comment: inquiry.value.comment || ''
  };

  try {
    await answerInquiry(inquiryId, payload);
    showAlertDialog('성공', '답변이 성공적으로 등록되었습니다.');
    router.push({ name: 'AdminInquiryList' });
  } catch (e) {
    console.error('답변 저장 실패:', e);
    showAlertDialog('오류', '답변 저장 중 오류가 발생했습니다.');
  }
}

function goToList() {
  router.push({ name: 'AdminInquiryList' });
}

function formatDate(dateValue) {
  if (!dateValue) return 'N/A';
  
  let dt;
  if (Array.isArray(dateValue)) {
    // new Date()의 월은 0부터 시작하므로 배열의 월 값에서 -1을 해줍니다.
    dt = new Date(dateValue[0], dateValue[1] - 1, dateValue[2], dateValue[3], dateValue[4], dateValue[5] || 0);
  } else {
    // 문자열 형식의 날짜를 처리합니다.
    dt = new Date(dateValue);
  }

  // 유효하지 않은 날짜인 경우 오류 메시지를 반환합니다.
  if (isNaN(dt.getTime())) return 'Invalid Date';
  
  // 한국 시간 형식으로 변환하여 반환합니다.
  return dt.toLocaleString('ko-KR');
}

watch(() => inquiry.value?.answerContent, (newValue) => {
  console.log('inquiry.answerContent changed:', newValue);
});

onMounted(fetchInquiry);
</script>

<template>
  <div class="container-fluid p-4">
    <h1 class="h3 mb-2 text-gray-800">1:1 문의 상세 및 답변</h1>
    <p class="mb-4">사용자 문의에 답변하고 처리 상태를 관리합니다.</p>

    <div v-if="loading" class="text-center">
      <LoadingSpinner />
      <p>데이터를 불러오는 중입니다...</p>
    </div>

    <div v-if="error" class="alert alert-danger">{{ error }}</div>

    <div v-if="inquiry">
      <!-- 문의 정보 카드 -->
      <div class="card shadow-sm mb-4">
        <div class="card-header">
          <h5 class="card-title mb-0">문의 내용</h5>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col-md-6">
              <p><strong>문의번호:</strong> {{ inquiry.inquiryId }}</p>
              <p><strong>제목:</strong> {{ inquiry.title }}</p>
              <p><strong>작성자:</strong> {{ inquiry.inquiredByName || 'N/A' }}</p>
            </div>
            <div class="col-md-6">
              <p><strong>문의 유형:</strong> {{ inquiry.csType ? inquiry.csType.name : 'N/A' }}</p>
              <p><strong>상태:</strong> 
                <span class="badge" :class="getStatusClass(inquiry.status)">{{ getStatusText(inquiry.status) }}</span>
              </p>
              <p><strong>등록일:</strong> {{ formatDate(inquiry.inquiredAt) }}</p>
            </div>
          </div>
          <hr>
          <h6>문의 내용</h6>
          <div class="p-3 bg-light rounded" v-html="inquiry.content"></div>

          <!-- 첨부 파일 섹션 -->
          <div v-if="inquiry.attachmentUrls && inquiry.attachmentUrls.length > 0" class="mt-4">
            <h6>첨부 파일</h6>
            <div class="d-flex flex-wrap gap-2">
              <div v-for="(url, index) in inquiry.attachmentUrls" :key="index">
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
      </div>

      <!-- 답변 작성/수정 폼 -->
      <div class="card shadow-sm">
        <div class="card-header">
          <h5 class="card-title mb-0">답변 {{ inquiry.answeredAt ? '수정' : '작성' }}</h5>
        </div>
        <div class="card-body">
          <form @submit.prevent="handleSubmit">
            <div class="mb-3">
              <label class="form-label">답변 내용</label>
              <CommonEditor v-model="inquiry.answerContent" />
            </div>

            <div class="mb-3">
              <label for="inquiry-comment" class="form-label">관리자 메모 (선택사항)</label>
              <textarea 
                id="inquiry-comment" 
                class="form-control" 
                v-model="inquiry.comment" 
                rows="3"
                placeholder="관리자용 메모를 입력하세요..."
              ></textarea>
            </div>

            <div class="d-flex justify-content-between align-items-center">
              <button type="button" class="btn btn-secondary" @click="goToList">목록</button>
              <div class="d-flex align-items-center gap-2">
                <label for="inquiry-status" class="form-label mb-0 me-2">처리 상태:</label>
                <select id="inquiry-status" class="form-select" style="width: auto;" v-model="inquiry.reqStatus" required>
                  <option v-for="option in statusOptions" :key="option.value" :value="option.value">
                    {{ option.text }}
                  </option>
                </select>
                <button type="submit" class="btn btn-primary ms-2">답변 저장</button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.badge {
  padding: 0.35em 0.65em;
  font-size: 0.875em;
}
.gap-2 {
  gap: 0.5rem;
}
.me-2 { 
  margin-right: 0.5rem; 
}
.img-thumbnail {
  border: 1px solid #ddd;
  padding: 3px;
  border-radius: 5px;
}
</style>