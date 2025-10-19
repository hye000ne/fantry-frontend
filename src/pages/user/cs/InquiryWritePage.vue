<template>
  <div>
    <h2 class="mb-4">1:1 문의하기</h2>

    <!-- 문의 등록 폼 -->
    <div class="card shadow-sm mb-5">
      <div class="card-body p-4">
        <h4 class="card-title mb-4 font-weight-bold">새 문의 작성</h4>
        <form @submit.prevent="submitInquiry">
          <div class="form-group mb-3">
            <label for="inquiryTitle">제목</label>
            <input type="text" class="form-control" :class="{'is-invalid': errors.title}" id="inquiryTitle" v-model="newInquiry.title" placeholder="제목을 입력하세요">
            <div class="invalid-feedback" v-if="errors.title">{{ errors.title }}</div>
          </div>
          <div class="form-row">
            <div class="form-group col-md-4">
              <label for="inquiryType">문의 유형</label>
              <select class="form-control custom-select" :class="{'is-invalid': errors.csTypeId}" id="inquiryType" v-model="newInquiry.csTypeId">
                <option value="" disabled>유형을 선택하세요</option>
                <option value="1">배송</option>
                <option value="2">결제</option>
                <option value="3">기타</option>
                <option value="4">상품</option>
                <option value="5">환불/반품</option>
                <option value="6">판매</option>
              </select>
              <div class="invalid-feedback" v-if="errors.csTypeId">{{ errors.csTypeId }}</div>
            </div>
          </div>
          <div class="form-group">
            <label for="inquiryContent">내용</label>
            <textarea class="form-control" :class="{'is-invalid': errors.content}" id="inquiryContent" rows="10" v-model="newInquiry.content" placeholder="문의하실 내용을 자세하게 입력해주세요."></textarea>
            <div class="invalid-feedback" v-if="errors.content">{{ errors.content }}</div>
          </div>
          <div class="form-group">
            <label for="inquiryAttachments">파일 첨부 (최대 20MB)</label>
            <input type="file" class="form-control-file" :class="{'is-invalid': errors.files}" id="inquiryAttachments" multiple @change="handleFileChange" accept="image/*,application/pdf">
            <div class="invalid-feedback" v-if="errors.files">{{ errors.files }}</div>
            <div class="mt-2 d-flex flex-wrap">
              <div v-for="(file, index) in filePreviews" :key="index" class="file-preview-item mr-2 mb-2">
                <img v-if="file.type.startsWith('image/')" :src="file.url" class="img-thumbnail" alt="File preview" style="width: 100px; height: 100px; object-fit: cover;">
                <div v-else class="file-icon d-flex align-items-center justify-content-center" style="width: 100px; height: 100px; background-color: #e9ecef; border-radius: 0.25rem;">
                  <i class="fas fa-file-alt fa-2x text-secondary"></i>
                </div>
                <p class="file-name text-truncate mt-1 mb-0" style="width: 100px; font-size: 0.8rem;">{{ file.name }}</p>
                <button type="button" class="btn btn-sm btn-danger remove-file-btn" @click="removeFile(index)">X</button>
              </div>
            </div>
            <small class="form-text text-muted" v-if="totalFileSize > 0">총 파일 크기: {{ (totalFileSize / (1024 * 1024)).toFixed(2) }} MB</small>
          </div>
          <button type="submit" class="btn btn-primary btn-lg btn-block" :disabled="uiStore.isLoading || totalFileSize > MAX_FILE_SIZE">
            문의 등록
          </button>
        </form>
      </div>
    </div>

    <LoadingSpinner :show="uiStore.isLoading" message="문의를 등록하고 있습니다..." />

    <!-- 내 문의 목록 -->
    <!-- <h4 class="mb-4 font-weight-bold">내 문의 내역</h4>
    <table class="table table-hover inquiry-table">
       <tbody>
        <tr v-if="loading">
          <td colspan="3" class="text-center py-5">
            <div class="spinner-border" role="status">
              <span class="sr-only">Loading...</span>
            </div>
          </td>
        </tr>
        <tr v-else-if="inquiries.length === 0">
          <td colspan="3" class="text-center py-5">문의 내역이 없습니다.</td>
        </tr>
        <tr v-for="inquiry in inquiries" :key="inquiry.id" @click="goToInquiryDetail(inquiry.id)">
          <td>
            <span class="inquiry-type">{{ inquiry.csType }}</span>
            <p class="inquiry-title mb-0">{{ inquiry.title }}</p>
          </td>
          <td class="text-center">
            <span class="badge badge-pill" :class="getStatusClass(inquiry.status)">{{ inquiry.status }}</span>
          </td>
          <td class="text-right inquiry-date">{{ formatDate(inquiry.inquiredAt) }}</td>
        </tr>
      </tbody>
    </table> -->
     <!-- 페이지네이션 추후 구현 -->
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { createInquiry, getMyInquiryList, addInquiryAttachments } from '@/api/inquiry';
import { useUiStore } from '@/stores/uiStore'; // Import useUiStore
import { useAlertDialog } from '@/composables/useAlertDialog';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';

const router = useRouter();
const uiStore = useUiStore(); // Initialize uiStore
const { showAlert: showAlertDialog } = useAlertDialog();

const newInquiry = ref({
  csTypeId: '',
  title: '',
  content: ''
});

// 유효성 검사 오류 메시지
const errors = ref({
  csTypeId: '',
  title: '',
  content: '',
  files: '',
});

// 파일 첨부 관련
const selectedFiles = ref([]);
const filePreviews = ref([]);
const totalFileSize = ref(0);
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

const handleFileChange = (event) => {
  // 기존 파일 오류 초기화
  errors.value.files = '';

  const files = Array.from(event.target.files);
  let currentTotalSize = totalFileSize.value;

  files.forEach(file => {
    if (currentTotalSize + file.size > MAX_FILE_SIZE) {
      errors.value.files = `총 파일 크기는 20MB를 초과할 수 없습니다. (현재: ${(currentTotalSize / (1024 * 1024)).toFixed(2)}MB, 추가하려는 파일: ${(file.size / (1024 * 1024)).toFixed(2)}MB)`;
      return;
    }

    selectedFiles.value.push(file);
    currentTotalSize += file.size;

    const reader = new FileReader();
    reader.onload = (e) => {
      filePreviews.value.push({
        name: file.name,
        size: file.size,
        type: file.type,
        url: e.target.result,
      });
    };
    reader.readAsDataURL(file);
  });
  totalFileSize.value = currentTotalSize;
};

const removeFile = (index) => {
  const removedFile = selectedFiles.value[index];
  totalFileSize.value -= removedFile.size;
  selectedFiles.value.splice(index, 1);
  filePreviews.value.splice(index, 1);
  // 파일 제거 후 다시 유효성 검사
  if (totalFileSize.value > MAX_FILE_SIZE) {
    errors.value.files = `총 파일 크기는 20MB를 초과할 수 없습니다. (현재: ${(totalFileSize.value / (1024 * 1024)).toFixed(2)}MB)`;
  } else {
    errors.value.files = '';
  }
};

const validateForm = () => {
  let isValid = true;
  errors.value = { csTypeId: '', title: '', content: '', files: '' }; // 오류 초기화

  if (!newInquiry.value.csTypeId) {
    errors.value.csTypeId = '문의 유형을 선택해주세요.';
    isValid = false;
  }
  if (!newInquiry.value.title) {
    errors.value.title = '제목을 입력해주세요.';
    isValid = false;
  }
  if (!newInquiry.value.content) {
    errors.value.content = '문의 내용을 입력해주세요.';
    isValid = false;
  }
  if (totalFileSize.value > MAX_FILE_SIZE) {
    errors.value.files = `총 파일 크기는 20MB를 초과할 수 없습니다. (현재: ${(totalFileSize.value / (1024 * 1024)).toFixed(2)}MB)`;
    isValid = false;
  }
  return isValid;
};

const submitInquiry = async () => {
  if (!validateForm()) {
    return;
  }

  uiStore.startLoading();
  try {
    // 1단계: 문의 텍스트 내용 등록
    const createdInquiry = await createInquiry(newInquiry.value);

    // 2단계: 파일 첨부 (파일이 있는 경우에만)
    if (selectedFiles.value.length > 0) {
      const formData = new FormData();
      selectedFiles.value.forEach(file => {
        formData.append('files', file);
      });
      await addInquiryAttachments(createdInquiry.inquiryId, formData);
    }

    showAlertDialog('성공', '문의가 성공적으로 등록되었습니다.');
    // 폼 초기화 및 리디렉션
    newInquiry.value = { csTypeId: '', title: '', content: '' };
    selectedFiles.value = [];
    filePreviews.value = [];
    totalFileSize.value = 0;
    errors.value = { csTypeId: '', title: '', content: '', files: '' }; // 오류 초기화
    const fileInput = document.getElementById('inquiryAttachments');
    if (fileInput) {
      fileInput.value = '';
    }
    router.push('/cs/inquiry-list'); // 문의 목록 페이지로 이동

  } catch (error) {
    console.error('문의 등록 또는 파일 첨부 중 오류가 발생했습니다:', error);
    showAlertDialog('오류', '문의 등록 또는 파일 첨부에 실패했습니다.');
  } finally {
    uiStore.stopLoading();
  }
};

</script>

<style scoped>
.form-control:not(textarea),
.custom-select {
    height: calc(1.5em + 1rem + 2px);
    padding: 0.5rem 1rem;
    font-size: 1rem;
}

.inquiry-table {
  border-top: 2px solid #212529;
}

.inquiry-table tr {
  border-bottom: 1px solid #dee2e6;
}

.inquiry-table td {
  padding: 1.25rem 0.75rem;
  vertical-align: middle;
}

.inquiry-table tr:hover {
  background-color: #f8f9fa;
  cursor: pointer;
}

.inquiry-type {
  font-size: 0.8rem;
  font-weight: 600;
  color: #6c757d;
  display: block;
  margin-bottom: 0.25rem;
}

.inquiry-title {
  font-weight: 600;
  color: #212529;
  font-size: 1.1rem;
}

.inquiry-date {
  color: #6c757d;
  font-size: 0.9rem;
  white-space: nowrap;
}

.badge {
    font-size: 0.8rem;
    padding: 0.5em 0.75em;
}

.file-preview-item {
  position: relative;
  display: inline-block;
}

.remove-file-btn {
  position: absolute;
  top: -5px;
  right: -5px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  padding: 0;
  font-size: 0.7rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
