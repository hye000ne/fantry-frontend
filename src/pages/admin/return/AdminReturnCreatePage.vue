<template>
  <div class="admin-return-create-page">
    <h1 class="h3 mb-4 text-gray-800">환불/반품 요청 생성 (관리자)</h1>

    <div class="card shadow mb-4">
      <div class="card-header py-3">
        <h6 class="m-0 font-weight-bold text-primary">새로운 환불/반품 요청 등록</h6>
      </div>
      <div class="card-body">
        <form @submit.prevent="createReturnRequest">
          <div class="form-group">
            <label for="orderId">주문 ID <span class="text-danger">*</span></label>
            <input type="text" class="form-control" id="orderId" v-model="form.orderId" required>
          </div>

          <div class="form-group">
            <label for="memberId">회원 ID <span class="text-danger">*</span></label>
            <input type="number" class="form-control" id="memberId" v-model.number="form.memberId" required>
          </div>

          <div class="form-group">
            <label for="reason">환불/반품 사유 <span class="text-danger">*</span></label>
            <select class="form-control" id="reason" v-model="form.reason" required>
              <option value="">선택하세요</option>
              <option value="SIMPLE_CHANGE_OF_MIND">단순 변심</option>
              <option value="PRODUCT_DEFECT">상품 하자</option>
              <option value="SHIPPING_ERROR">배송 오류</option>
              <option value="ETC">기타</option>
            </select>
          </div>

          <div class="form-group">
            <label for="detailReason">상세 사유</label>
            <textarea class="form-control" id="detailReason" v-model="form.detailReason" rows="3" maxlength="2000"></textarea>
            <small class="form-text text-muted">최대 2000자</small>
          </div>

          <button type="submit" class="btn btn-primary" :disabled="isCreating">
            <span v-if="isCreating" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            {{ isCreating ? '생성 중...' : '요청 생성' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { createAdminReturnRequest } from '@/api/adminReturn';
import { useAlert } from '@/composables/useAlert';
import { useRouter } from 'vue-router';

const { showAlert } = useAlert();
const router = useRouter();

const isCreating = ref(false);

const form = ref({
  orderId: '',
  memberId: null,
  reason: '',
  detailReason: '',
});

const createReturnRequest = async () => {
  isCreating.value = true;
  try {
    await createAdminReturnRequest(form.value);
    showAlert('환불/반품 요청이 성공적으로 생성되었습니다.', 'success');
    router.push({ name: 'AdminReturnList' }); // 목록 페이지로 이동
  } catch (err) {
    console.error('Failed to create return request:', err);
    showAlert('환불/반품 요청 생성에 실패했습니다.', 'danger');
  } finally {
    isCreating.value = false;
  }
};

// Added a comment to trigger re-compilation
</script>

<style scoped lang="scss">
.admin-return-create-page {
  .form-group {
    margin-bottom: 1.5rem;
  }
}
</style>