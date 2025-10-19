<template>
  <div class="container-fluid">
    <h1 class="h3 mb-4 text-gray-800">환불/반품 요청 상세</h1>

    <div v-if="loading" class="text-center py-5">
      <LoadingSpinner />
    </div>

    <div v-else-if="error" class="alert alert-danger" role="alert">
      {{ error }}
    </div>

    <div v-else-if="returnRequest">
      <div class="card shadow mb-4">
        <div class="card-header py-3">
          <h6 class="m-0 font-weight-bold text-primary">요청 정보</h6>
        </div>
        <div class="card-body">
          <div class="row mb-3">
            <div class="col-md-6">
              <strong>요청 ID:</strong> {{ returnRequest.returnRequestId }}
            </div>
            <div class="col-md-6">
              <strong>주문 ID:</strong> {{ returnRequest.orderId }}
            </div>
          </div>
          <div class="row mb-3">
            <div class="col-md-6">
              <strong>구매자 이름:</strong> {{ returnRequest.buyerName }}
            </div>
            <div class="col-md-6">
              <strong>연락처:</strong> 010-1234-5678
            </div>
          </div>
          <div class="row mb-3">
            <div class="col-md-6">
              <strong>이메일 주소:</strong> fantryuser@naver.com
            </div>
            <div class="col-md-6">
              <strong>요청 일시:</strong> {{ formatDate(returnRequest.requestedAt) }}
            </div>
          </div>
          <div class="row mb-3">
            <div class="col-md-6">
              <strong>생성 관리자:</strong> {{ returnRequest.createdBy || 'N/A' }}
            </div>
            <div class="col-md-6">
              <strong>최종 처리 관리자:</strong> {{ returnRequest.updatedBy || 'N/A' }}
            </div>
          </div>
          <div class="row mb-3">
            <div class="col-md-12">
              <strong>환불/반품 사유:</strong> {{ formatReturnReason(returnRequest.reason) }}
            </div>
          </div>
          <div class="row mb-3">
            <div class="col-md-12">
              <strong>상세 사유:</strong> {{ returnRequest.detailReason || '없음' }}
            </div>
          </div>
          <div class="row mb-3">
            <div class="col-md-12">
              <strong>현재 상태:</strong> <span :class="getStatusClass(returnRequest.status)">{{ formatReturnStatus(returnRequest.status) }}</span>
            </div>
          </div>
          <div class="row mb-3" v-if="returnRequest.attachmentUrls && returnRequest.attachmentUrls.length > 0">
            <div class="col-md-12">
              <strong>첨부 파일:</strong>
              <div class="d-flex flex-wrap mt-2">
                <div v-for="(url, index) in returnRequest.attachmentUrls" :key="index" class="p-1" style="max-width: 150px;">
                  <a :href="url" target="_blank" class="d-block text-center text-decoration-none">
                    <img v-if="isImage(url)" :src="url" class="img-thumbnail w-100 mb-1" alt="첨부 이미지">
                    <i v-else class="fas fa-file fa-3x text-secondary mb-1"></i>
                    <small class="d-block text-truncate" style="max-width: 100px;">{{ url.substring(url.lastIndexOf('/') + 1) }}</small>
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div class="row mb-3" v-else>
            <div class="col-md-12">
              <strong>첨부 파일:</strong> 첨부 파일 없음
            </div>
          </div>
        </div>
      </div>

      <div class="card shadow mb-4">
        <div class="card-header py-3">
          <h6 class="m-0 font-weight-bold text-primary">결제 및 환불 금액</h6>
        </div>
        <div class="card-body">
          <div class="row mb-3">
            <div class="col-md-4">
              <strong>원 결제 금액:</strong> {{ formatCurrency(returnRequest.originalPaymentAmount) }}
            </div>
            <div class="col-md-4">
              <strong>차감된 배송비:</strong> {{ formatCurrency(returnRequest.deductedShippingFee) }}
            </div>
            <div class="col-md-4">
              <strong>최종 환불 금액:</strong> {{ formatCurrency(returnRequest.finalRefundAmount) }}
            </div>
          </div>
        </div>
      </div>

      <div class="card shadow mb-4">
        <a href="#collapseStatusHistory" class="d-block card-header py-3" data-toggle="collapse" role="button" aria-expanded="true" aria-controls="collapseStatusHistory">
          <h6 class="m-0 font-weight-bold text-primary">상태 변경 이력</h6>
        </a>
        <div class="collapse show" id="collapseStatusHistory">
          <div class="card-body">
            <div v-if="returnRequest.statusHistories && returnRequest.statusHistories.length > 0">
              <div v-for="(history, index) in returnRequest.statusHistories" :key="index" class="mb-2 pb-2 border-bottom">
                <p class="mb-1">
                  <strong>변경 일시:</strong> {{ formatDate(history.updatedAt) }}<br>
                  <strong>변경자:</strong> {{ history.updatedBy || 'System' }}<br>
                  <strong>이전 상태:</strong> {{ formatReturnStatus(history.previousStatus) }}<br>
                  <strong>새로운 상태:</strong> <span :class="getStatusClass(history.newStatus)">{{ formatReturnStatus(history.newStatus) }}</span><br>
                  <strong>메모:</strong> {{ history.memo || '없음' }}
                </p>
              </div>
            </div>
            <div v-else>
              상태 변경 이력 없음
            </div>
          </div>
        </div>
      </div>

      <div class="card shadow mb-4">
        <div class="card-header py-3">
          <h6 class="m-0 font-weight-bold text-primary">환불/반품 요청 처리</h6>
        </div>
        <div class="card-body">
          <form @submit.prevent="updateReturnRequest">
            <div class="form-group">
              <label for="statusSelect">상태 변경</label>
              <select id="statusSelect" class="form-control" v-model="updateForm.status">
                <option v-for="status in availableStatuses" :key="status.value" :value="status.value">
                  {{ status.label }}
                </option>
              </select>
            </div>

            <div class="form-group" v-if="updateForm.status === 'REJECTED'">
              <label for="rejectReason">거절 사유 <span class="text-danger">*</span></label>
              <textarea id="rejectReason" class="form-control" v-model="updateForm.rejectReason" rows="3" required></textarea>
            </div>

            <div class="form-group">
              <label for="deductedShippingFee">차감 배송비</label>
              <input type="number" id="deductedShippingFee" class="form-control" v-model.number="updateForm.deductedShippingFee" step="0.01" min="0">
            </div>

            <div class="form-group">
              <label for="adminMemo">관리자 메모</label>
              <textarea id="adminMemo" class="form-control" v-model="updateForm.memo" rows="3"></textarea>
            </div>

            <button type="submit" class="btn btn-primary" :disabled="isUpdating">
              <span v-if="isUpdating" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              {{ isUpdating ? '처리 중...' : '상태 업데이트' }}
            </button>
          </form>
        </div>
      </div>
    </div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import { getAdminReturnRequestDetail, updateAdminReturnRequestStatus } from '@/api/adminReturn'; // Assuming this API file exists
import { useAlertDialog } from '@/composables/useAlertDialog'; // Assuming this composable exists

const route = useRoute();
const { showAlert } = useAlertDialog();

const returnRequest = ref(null);
const loading = ref(true);
const error = ref(null);
const isUpdating = ref(false);

const updateForm = ref({
  status: '',
  deductedShippingFee: 0,
  rejectReason: '',
  memo: '',
});

const availableStatuses = [
  { value: 'REQUESTED', label: '요청됨' },
  { value: 'IN_TRANSIT', label: '수거 중' },
  { value: 'INSPECTING', label: '검수 중' },
  { value: 'APPROVED', label: '승인됨' },
  { value: 'REJECTED', label: '거절됨' },
  { value: 'COMPLETED', label: '처리 완료' },
  { value: 'USER_CANCELLED', label: '사용자 철회' },
];

const fetchReturnRequestDetail = async () => {
  loading.value = true;
        error.value = null;
        try {
          const returnRequestId = route.params.returnRequestId;    console.log(`GET 요청: /api/admin/returns/${returnRequestId}`);
    const response = await getAdminReturnRequestDetail(returnRequestId);
    console.log('GET 응답:', response);
    returnRequest.value = response;
    updateForm.value.status = returnRequest.value.status;
    updateForm.value.deductedShippingFee = returnRequest.value.deductedShippingFee || 0;
    updateForm.value.rejectReason = returnRequest.value.rejectReason || '';
    updateForm.value.memo = returnRequest.value.comment || '';
  } catch (err) {
    console.error('환불/반품 요청 상세 조회 실패:', err);
    error.value = '환불/반품 요청 상세 정보를 불러오는데 실패했습니다.';
    showAlert('오류', error.value);
  } finally {
    loading.value = false;
  }
};

const updateReturnRequest = async () => {
  if (updateForm.value.status === 'REJECTED' && !updateForm.value.rejectReason) {
    showAlert('경고', '거절 사유를 입력해주세요.');
    return;
  }

  isUpdating.value = true;
  try {
    const returnRequestId = route.params.returnRequestId;
    const payload = {
      status: updateForm.value.status,
      deductedShippingFee: updateForm.value.deductedShippingFee,
      rejectReason: updateForm.value.status === 'REJECTED' ? updateForm.value.rejectReason : null,
      memo: updateForm.value.memo,
    };
    console.log(`PATCH 요청: /api/admin/returns/${returnRequestId}`);
    console.log('PATCH 요청 본문:', payload);
    const response = await updateAdminReturnRequestStatus(returnRequestId, payload);
    console.log('PATCH 응답:', response);
    showAlert('성공', '환불/반품 요청 상태가 업데이트되었습니다.');
    await fetchReturnRequestDetail(); // Refresh data
  } catch (err) {
    console.error('환불/반품 요청 상태 업데이트 실패:', err);
    showAlert('오류', '환불/반품 요청 상태 업데이트에 실패했습니다.');
  } finally {
    isUpdating.value = false;
  }
};

const formatDate = (datetime) => {
  if (!datetime) return 'N/A';

  let date;
  if (Array.isArray(datetime)) {
    // Assuming datetime is [year, month, day, hour, minute, second, millisecond]
    // Month is 0-indexed in JavaScript Date, so subtract 1 from the month value
    date = new Date(datetime[0], datetime[1] - 1, datetime[2], datetime[3], datetime[4], datetime[5] || 0, datetime[6] || 0);
  } else {
    // Assume it's a string that Date constructor can parse
    date = new Date(datetime);
  }

  // Check if the date is valid before formatting
  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }

  return date.toLocaleString('ko-KR');
};

const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return 'N/A';
  return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(amount);
};

const formatReturnReason = (reason) => {
  const reasons = {
    SIMPLE_CHANGE_OF_MIND: '단순 변심',
    PRODUCT_DEFECT: '상품 불량',
    SHIPPING_ERROR: '배송 오류',
    ETC: '기타',
  };
  return reasons[reason] || reason;
};

const formatReturnStatus = (status) => {
  const statuses = {
    REQUESTED: '요청됨',
    IN_TRANSIT: '수거 중',
    INSPECTING: '검수 중',
    APPROVED: '승인됨',
    REJECTED: '거절됨',
    COMPLETED: '처리 완료',
    USER_CANCELLED: '사용자 철회',
    DELETED: '삭제됨',
  };
  return statuses[status] || status;
};

const getStatusClass = (status) => {
  switch (status) {
    case 'REQUESTED':
      return 'badge badge-info';
    case 'IN_TRANSIT':
      return 'badge badge-warning';
    case 'INSPECTING':
      return 'badge badge-primary';
    case 'APPROVED':
      return 'badge badge-success';
    case 'REJECTED':
      return 'badge badge-danger';
    case 'COMPLETED':
      return 'badge badge-secondary';
    case 'USER_CANCELLED':
      return 'badge badge-dark';
    default:
      return 'badge badge-light';
  }
};

const isImage = (url) => {
  return /\.(jpeg|jpg|png|gif|webp|svg)$/i.test(url);
};

onMounted(() => {
  fetchReturnRequestDetail();
});
</script>

<style scoped>
/* 필요한 스타일 추가 */
</style>
