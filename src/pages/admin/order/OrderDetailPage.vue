<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1 class="h3 mb-0 text-gray-800">주문 상세 정보</h1>
      <button class="btn btn-secondary" @click="router.back()">목록으로</button>
    </div>

    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <div v-else-if="order" class="card">
      <div class="card-header py-3">
        <h6 class="m-0 font-weight-bold text-primary">주문 #{{ order.ordersId }}</h6>
      </div>
      <div class="card-body">
        <div class="row">
          <div class="col-md-6">
            <h4>주문 정보</h4>
            <table class="table table-bordered">
              <tbody>
                <tr><th class="bg-light">주문번호</th><td>{{ order.ordersId }}</td></tr>
                <tr><th class="bg-light">상품명</th><td>{{ order.itemName }}</td></tr>
                <tr><th class="bg-light">주문금액</th><td>{{ (order.price || 0).toLocaleString() }}원</td></tr>
                <tr><th class="bg-light">주문상태</th><td><span :class="getStatusBadge(order.orderStatus)">{{ translateOrderStatus(order.orderStatus) }}</span></td></tr>
                <tr><th class="bg-light">주문일시</th><td>{{ (d => d ? d.toLocaleString('ko-KR') : '-')(parseJavaLocalDateTime(order.orderedAt)) }}</td></tr>
                <tr><th class="bg-light">결제일시</th><td>{{ (d => d ? d.toLocaleString('ko-KR') : '-')(parseJavaLocalDateTime(order.paidAt)) }}</td></tr>
                <tr><th class="bg-light">배송완료일시</th><td>{{ (d => d ? d.toLocaleString('ko-KR') : '-')(parseJavaLocalDateTime(order.deliveredAt)) }}</td></tr>
                <tr><th class="bg-light">취소일시</th><td>{{ (d => d ? d.toLocaleString('ko-KR') : '-')(parseJavaLocalDateTime(order.cancelledAt)) }}</td></tr>
              </tbody>
            </table>
          </div>
          <div class="col-md-6">
            <h4>구매자 정보</h4>
            <table class="table table-bordered">
              <tbody>
                <tr><th class="bg-light">구매자 ID</th><td>{{ order.buyerId }}</td></tr>
                <tr><th class="bg-light">구매자명</th><td>{{ order.buyerName }}</td></tr>
                <tr><th class="bg-light">연락처</th><td>{{ order.tel }}</td></tr>
                <tr><th class="bg-light">배송지</th><td>{{ order.shippingAddress }}</td></tr>
                <tr><th class="bg-light">영수증</th><td><a :href="order.receiptUrl" target="_blank" v-if="order.receiptUrl">보기</a><span v-else>-</span></td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="mt-4">
          <h4>주문 상태 변경</h4>
          <div class="d-flex flex-wrap gap-2">
            <button @click="updateStatus('prepare-shipment')" class="btn btn-sm btn-primary">배송 준비중</button>
            <button @click="updateStatus('ship')" class="btn btn-sm btn-info">배송중</button>
            <button @click="updateStatus('delivered')" class="btn btn-sm btn-success">배송 완료</button>
            <button @click="updateStatus('cancelled')" class="btn btn-sm btn-danger">취소 완료</button>
            <button @click="updateStatus('refunded')" class="btn btn-sm btn-outline-danger">환불 완료</button>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="alert alert-warning">
      주문 정보를 찾을 수 없습니다.
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  getOrderById,
  prepareShipment,
  shipOrder,
  markAsDelivered,
  confirmPurchase,
  requestCancel,
  cancelOrder,
  requestRefund,
  completeRefund
} from '@/api/order';
import { useAlertDialog } from '@/composables/useAlertDialog';

const props = defineProps({
  orderId: {
    type: String,
    required: true
  }
});

const router = useRouter();
const { showAlert: showAlertDialog } = useAlertDialog();

const order = ref(null);
const loading = ref(true);

async function fetchOrderDetails() {
  try {
    loading.value = true;
    const response = await getOrderById(props.orderId);
    const responseData = response.data;
    if (responseData && responseData.orderId && !responseData.ordersId) {
      responseData.ordersId = responseData.orderId;
    }
    order.value = responseData; // API 응답 구조에 따라 조정
  } catch (error) {
    console.error('주문 상세 정보 조회 실패:', error);
    order.value = null;
  } finally {
    loading.value = false;
  }
}

onMounted(fetchOrderDetails);

const statusUpdateActions = {
  'prepare-shipment': prepareShipment,
  'ship': shipOrder,
  'delivered': markAsDelivered,
  'cancelled': cancelOrder,
  'refunded': completeRefund
};

async function updateStatus(statusKey) {
  if (!confirm(`주문 상태를 '${statusKey}' (으)로 변경하시겠습니까?`)) return;

  const action = statusUpdateActions[statusKey];
  if (!action) {
    showAlertDialog('오류', '잘못된 상태 변경 요청입니다.');
    return;
  }

  try {
    const response = await action(props.orderId);
    showAlertDialog('성공', '주문 상태가 성공적으로 변경되었습니다.');
    await fetchOrderDetails(); // 상태 변경 후 데이터 다시 불러오기
  } catch (error) {
    console.error(`상태 변경 실패 (${statusKey}):`, error);
    showAlertDialog('오류', '상태 변경 중 오류가 발생했습니다.');
  }
}

const parseJavaLocalDateTime = (dt) => {
    if (!Array.isArray(dt) || dt.length < 5) {
        return null; 
    }
    const [year, month, day, hour, minute, second = 0] = dt;
    return new Date(year, month - 1, day, hour, minute, second);
};

const orderStatusMap = {
  'PAID': '결제완료',
  'SHIPPED': '배송중',
  'DELIVERED': '배송완료',
  'CONFIRMED': '구매확정',
  'CANCELLED': '취소완료',
  'REFUNDED': '환불완료',
  'PREPARE_SHIPMENT': '배송 준비중',
  'CANCEL_REQUESTED': '취소 요청',
  'REFUND_REQUESTED': '환불 요청'
};

function translateOrderStatus(status) {
    return orderStatusMap[status] || status;
}

function getStatusBadge(status) {
  const baseClass = 'badge';
  switch (status) {
    case 'PAID': return `${baseClass} badge-primary`;
    case 'SHIPPED': return `${baseClass} badge-info`;
    case 'DELIVERED': return `${baseClass} badge-success`;
    case 'CONFIRMED': return `${baseClass} badge-dark`;
    case 'CANCELLED':
    case 'REFUNDED':
      return `${baseClass} badge-danger`;
    default:
      return `${baseClass} badge-secondary`;
  }
}
</script>

<style scoped>
.table th { width: 150px; }
.gap-2 { gap: 0.5rem; }
</style>
