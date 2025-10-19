<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getFaqById, updateFaq, addFaqAttachments } from '@/api/adminFaq.js';
import CommonEditor from '@/components/common/organisms/CommonEditor.vue';
import LoadingSpinner from '@/components/common/atoms/LoadingSpinner.vue';
import { useAlertDialog } from '@/composables/useAlertDialog';

const route = useRoute();
const router = useRouter();
const faqId = Number(route.params.faqId);

const faq = ref(null);
const loading = ref(true);
const error = ref(null);
const selectedFiles = ref([]);
const { showAlert: showAlertDialog } = useAlertDialog();

const csTypes = ref([
  { id: 1, name: '배송문의' },
  { id: 2, name: '결제문의' },
  { id: 3, name: '기타문의' },
  { id: 4, name: '상품문의' },
  { id: 5, name: '환불/반품 문의' },
  { id: 6, name: '판매 문의' },
]);

const statusOptions = ref([
  { value: 'ACTIVE', text: '활성' },
  { value: 'INACTIVE', text: '비활성' },
  { value: 'DRAFT', text: '초안' },
  { value: 'PINNED', text: '고정' },
]);

function handleFileChange(event) {
  selectedFiles.value = Array.from(event.target.files);
}

async function fetchFaq() {
  try {
    loading.value = true;
    const response = await getFaqById(faqId);
    faq.value = response;
    
    // csType이 문자열로 올 경우, csTypes에서 해당 id를 찾아 설정
    const foundType = csTypes.value.find(t => t.name === faq.value.csType);
    if (foundType) {
      faq.value.csTypeId = foundType.id;
    }

  } catch (e) {
    console.error('FAQ 정보 로드 실패:', e);
    error.value = '데이터를 불러오는 중 오류가 발생했습니다.';
  } finally {
    loading.value = false;
  }
}

async function handleSubmit() {
  if (!faq.value) return;

  const payload = {
    title: faq.value.title,
    content: faq.value.content,
    csTypeId: faq.value.csTypeId,
    status: faq.value.status,
  };

  try {
    await updateFaq(faqId, payload);

    if (selectedFiles.value.length > 0) {
      await addFaqAttachments(faqId, selectedFiles.value);
    }

    showAlertDialog('성공', 'FAQ가 성공적으로 수정되었습니다.');
    router.push({ name: 'AdminFaqDetail', params: { faqId } });
  } catch (e) {
    console.error('FAQ 수정 실패:', e);
    showAlertDialog('오류', '수정 중 오류가 발생했습니다.');
  }
}

function goToDetail() {
  router.push({ name: 'AdminFaqDetail', params: { faqId } });
}

onMounted(fetchFaq);
</script>

<template>
  <div class="container-fluid p-4">
    <div v-if="loading" class="text-center">
      <LoadingSpinner />
    </div>
    <div v-if="error" class="alert alert-danger">{{ error }}</div>

    <div v-if="faq" class="card shadow-sm">
      <div class="card-header">
        <h5 class="card-title mb-0">FAQ 수정</h5>
      </div>
      <div class="card-body">
        <form @submit.prevent="handleSubmit">
          <div class="mb-3">
            <label for="faq-title" class="form-label">제목</label>
            <input type="text" id="faq-title" class="form-control" v-model="faq.title" required>
          </div>

          <div class="row">
            <div class="col-md-6 mb-3">
              <label for="faq-cs-type" class="form-label">문의 유형</label>
              <select id="faq-cs-type" class="form-select" v-model="faq.csTypeId" required>
                <option v-for="type in csTypes" :key="type.id" :value="type.id">{{ type.name }}</option>
              </select>
            </div>
            <div class="col-md-6 mb-3">
              <label for="faq-status" class="form-label">상태</label>
              <select id="faq-status" class="form-select" v-model="faq.status" required>
                <option v-for="option in statusOptions" :key="option.value" :value="option.value">{{ option.text }}</option>
              </select>
            </div>
          </div>

          <div class="mb-3">
            <label class="form-label">내용</label>
            <CommonEditor v-model="faq.content" />
          </div>

          <div class="mb-3">
            <label for="faq-attachments" class="form-label">첨부 파일</label>
            <input type="file" id="faq-attachments" class="form-control" multiple @change="handleFileChange">
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