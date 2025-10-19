<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getOrderById } from '@/api/order';
import { createReturnRequest, addReturnAttachments } from '@/api/return.js';
import { useAlertDialog } from '@/composables/useAlertDialog';
import LoadingSpinner from '@/components/common/atoms/LoadingSpinner.vue';

const route = useRoute();
const router = useRouter();
const { showAlert } = useAlertDialog();

const orderId = ref(route.params.orderId);
const order = ref(null);
const loading = ref(true);
const isSubmitting = ref(false);

// Form state
const reason = ref('');
const detailReason = ref('');
const files = ref([]);
const isUnopened = ref(false);

const reasonOptions = [
  { value: 'SIMPLE_CHANGE_OF_MIND', text: '단순 변심' },
  { value: 'PRODUCT_DEFECT', text: '상품 하자 (배송 중 파손 등)' },
  { value: 'SHIPPING_ERROR', text: '잘못된 배송 (오배송)' },
  { value: 'ETC', text: '기타' },
];

// Fetch order details
onMounted(async () => {
  try {
    const response = await getOrderById(orderId.value);
    order.value = response.data; // Assuming the API response is wrapped in `data`
  } catch (error) {
    console.error('주문 정보를 불러오는 데 실패했습니다:', error);
    showAlert('오류', '주문 정보를 불러오는 데 실패했습니다. 이전 페이지로 돌아갑니다.');
    router.back();
  } finally {
    loading.value = false;
  }
});

const isSimpleChangeOfMindDisabled = computed(() => {
  if (!order.value || order.value.orderStatus !== 'DELIVERED') {
    return true; // 배송 완료 상태가 아니면 비활성화
  }
  // deliveredAt이 있다는 가정 하에 로직 구현
  const deliveredAt = new Date(order.value.deliveredAt);
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  return deliveredAt < oneWeekAgo;
});

function handleFileChange(event) {
  files.value = Array.from(event.target.files);
}

async function handleSubmit() {
  // Validation
  if (!reason.value) {
    showAlert('알림', '환불 사유를 선택해주세요.');
    return;
  }
  if (!detailReason.value.trim()) {
    showAlert('알림', '상세 사유를 입력해주세요.');
    return;
  }
  if (!isUnopened.value) {
    showAlert('알림', '상품 미개봉 확인란에 동의해주셔야 합니다.');
    return;
  }
  if (reason.value === 'SIMPLE_CHANGE_OF_MIND' && isSimpleChangeOfMindDisabled.value) {
    showAlert('알림', '단순 변심은 배송 완료 후 7일 이내에만 가능합니다.');
    return;
  }

  isSubmitting.value = true;
  try {
    const returnData = {
      orderId: orderId.value,
      reason: reason.value,
      detailReason: detailReason.value,
    };

    // 1. Create return request
    const returnResponse = await createReturnRequest(returnData);
    const returnRequestId = returnResponse.returnRequestId;

    // 2. Upload attachments if any
    if (files.value.length > 0) {
      const formData = new FormData();
      files.value.forEach(file => {
        formData.append('files', file);
      });
      await addReturnAttachments(returnRequestId, formData);
    }

    showAlert('성공', '환불 신청이 성공적으로 접수되었습니다.');
    router.back();

  } catch (error) {
    console.error('환불 신청 실패:', error);
    showAlert('오류', error.message || '환불 신청 중 오류가 발생했습니다.');
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div class="content-page">
    <div v-if="loading" class="text-center py-5">
      <LoadingSpinner message="주문 정보를 불러오는 중..." />
    </div>
    <div v-else-if="order">
      <h1 class="page-title">
        <i class="fa-solid fa-box-open"></i> 환불 신청
      </h1>
      <p class="page-description">상품에 문제가 있거나, 단순 변심인 경우 환불을 신청할 수 있습니다.</p>

      <!-- Order Info -->
      <div class="card p-4 mb-4">
        <h5 class="card-title mb-3">환불 상품 정보</h5>
        <dl class="row">
          <dt class="col-sm-3">상품명</dt>
          <dd class="col-sm-9">{{ order.itemName }}</dd>
          <dt class="col-sm-3">주문번호</dt>
          <dd class="col-sm-9">{{ order.ordersId }}</dd>
          <dt class="col-sm-3">주문일</dt>
          <dd class="col-sm-9">{{ new Date(order.orderedAt).toLocaleString('ko-KR') }}</dd>
        </dl>
      </div>

      <!-- Refund Form -->
      <div class="card p-4">
        <form @submit.prevent="handleSubmit">
          <div class="mb-4">
            <label for="reason" class="form-label fw-bold">환불 사유</label>
            <select id="reason" class="form-select" v-model="reason" required>
              <option value="" disabled>사유를 선택하세요</option>
              <option v-for="opt in reasonOptions" :key="opt.value" :value="opt.value" :disabled="opt.value === 'SIMPLE_CHANGE_OF_MIND' && isSimpleChangeOfMindDisabled">
                {{ opt.text }}
                <span v-if="opt.value === 'SIMPLE_CHANGE_OF_MIND' && isSimpleChangeOfMindDisabled">(기간 만료)</span>
              </option>
            </select>
            <div v-if="reason === 'SIMPLE_CHANGE_OF_MIND'" class="form-text mt-2 p-2 bg-light rounded">
              단순 변심의 경우, 배송 완료일로부터 7일 이내에만 가능하며 왕복 배송비가 차감된 후 환불이 진행됩니다.
            </div>
          </div>

          <div class="mb-4">
            <label for="detailReason" class="form-label fw-bold">상세 사유</label>
            <textarea id="detailReason" class="form-control" v-model="detailReason" rows="6" placeholder="환불 사유를 구체적으로 작성해주세요." required></textarea>
          </div>

          <div class="mb-4">
            <label for="attachments" class="form-label fw-bold">증빙 파일 첨부</label>
            <input type="file" id="attachments" class="form-control" multiple @change="handleFileChange">
            <div class="form-text mt-1">상품 하자 또는 오배송의 경우, 사진이나 동영상을 첨부하시면 더 빠른 처리가 가능합니다.</div>
          </div>

          <div class="mb-4 form-check bg-light p-3 rounded">
            <input type="checkbox" class="form-check-input" id="isUnopened" v-model="isUnopened">
            <label class="form-check-label" for="isUnopened">
              상품의 포장을 뜯지 않았으며, 개봉하지 않았음을 확인합니다. (필수 동의)
            </label>
          </div>

          <!-- General Notes -->
          <div class="alert alert-secondary mt-4">
            <h6 class="alert-heading">환불 신청 유의사항</h6>
            <ul class="mb-0">
              <li>상품의 포장을 뜯거나 개봉한 경우, 환불이 불가합니다.</li>
              <li>'상품 하자' 또는 '오배송'의 경우, 증빙 자료(사진, 동영상)를 첨부하시면 더 빠른 처리가 가능합니다.</li>
              <li>신청이 접수되면 관리자가 내용을 확인하며, 상품 회수를 위해 별도로 연락드릴 수 있습니다.</li>
              <li>최종 환불은 회수된 상품의 상태를 확인한 후 처리되며, 영업일 기준 2~3일이 소요될 수 있습니다.</li>
            </ul>
          </div>

          <div class="d-flex justify-content-end gap-2 mt-4">
            <button type="button" class="btn btn-secondary" @click="router.back()" :disabled="isSubmitting">취소</button>
            <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
              <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              환불 신청하기
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.content-page {
  max-width: 900px;
  margin: 20px auto;
  padding: 24px;
}

.page-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: #333;
  border-bottom: 3px solid #f0f0f0;
  padding-bottom: 10px;
  margin-bottom: 10px;
}

.page-description {
  color: #666;
  margin-bottom: 30px;
  font-size: 0.95rem;
}

.card {
  border: none;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

.form-label {
  font-size: 1.05rem;
}
</style>
