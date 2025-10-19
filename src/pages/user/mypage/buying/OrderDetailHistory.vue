<script setup>
import { ref, onMounted, defineProps, defineEmits } from 'vue';
import { useRouter } from 'vue-router';
import { getOrderById } from '@/api/order';
import { usePaymentStore } from '@/stores/paymentStore';

const paymentStore = usePaymentStore();

const props = defineProps({
  ordersId: [String, Number]
});
const emit = defineEmits(['close']);

const router = useRouter();
const orderData = ref(null);
const loading = ref(true);
const error = ref(null);

// 상태 라벨
const statusLabel = (status) => {
  if (!status) return '기타';
  const s = String(status).toUpperCase();
  switch (s) {
    case 'PENDING_PAYMENT': return '결제 대기중';
    case 'PAID': return '결제 완료';
    case 'PREPARING_SHIPMENT': return '배송 대기중';
    case 'SHIPPED': return '배송 중';
    case 'DELIVERED': return '배송 완료';
    case 'CONFIRMED': return '구매 확정';
    case 'CANCEL_REQUESTED': return '취소 요청';
    case 'CANCELLED': return '취소 완료';
    case 'REFUND_REQUESTED': return '환불 요청';
    case 'REFUNDED': return '환불 완료';
    default: return status;
  }
};

// 상태 클래스
const statusClass = (status) => {
  const s = (status || '').toString().toUpperCase();
  return {
    'badge-pending': s === 'PENDING_PAYMENT',
    'badge-paid': s === 'PAID',
    'badge-preparing': s === 'PREPARING_SHIPMENT',
    'badge-shipped': s === 'SHIPPED',
    'badge-delivered': s === 'DELIVERED',
    'badge-confirmed': s === 'CONFIRMED',
    'badge-cancel-requested': s === 'CANCEL_REQUESTED',
    'badge-cancelled': s === 'CANCELLED',
    'badge-refund-requested': s === 'REFUND_REQUESTED',
    'badge-refunded': s === 'REFUNDED'
  };
}

// 판매 유형 라벨
const saleTypeLabel = (type) => {
  if(!type) return '기타';
  const s = String(type).toUpperCase();
  switch(s) {
    case 'AUCTION': return '경매';
    case 'INSTANT_BUY': return '즉시 구매';
    default: return type;
  }
}

// 날짜 포맷
const formatDate = (dateArray) => {
    if(!dateArray || !Array.isArray(dateArray) || dateArray.length < 5) return '정보 없음';
    const [year, month, day, hour, minute] = dateArray;
    const pad = (num) => String(num).padStart(2, '0');
    return `${year}.${pad(month)}.${pad(day)} ${pad(hour)}:${pad(minute)}`;
}

const formatPrice = (price) => {
  return new Intl.NumberFormat('ko-KR').format(price) + '원';
};

const goToProductDetail = () => {
  if (orderData.value?.auctionId) {
    paymentStore.setAuctionContext(orderData.value.auctionId);
    router.push('/product/order/info');
  }
};

const close = () => {
  emit('close');
}

onMounted(async () => {
    if(!props.ordersId) return;
    try {
    loading.value = true;
    const response = await getOrderById(props.ordersId);
    orderData.value = response.data;

  } catch (err) {
    error.value = '주문 정보를 불러오는데 실패했습니다.';
    console.error(err);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="order-detail-view">
    <div class="detail-header">
        <h3 class="detail-title">주문 상세 내역</h3>
        <button class="close-button" @click="close">
            <i class="fas fa-times"></i>
        </button>
    </div>

    <!-- 로딩 상태 -->
    <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>주문 정보를 불러오는 중입니다...</p>
    </div>

    <!-- 상세 정보 표시 -->
    <div v-else-if="orderData" class="detail-content-wrapper">
        <!-- 주문 기본 정보 카드 -->
        <div class="info-card order-info-card">
            <div class="card-header">
                <div class="header-left">
                    <span class="order-number">주문 #{{ orderData.ordersId }}</span>
                    <span class="badge" :class="statusClass(orderData.orderStatus)">{{ statusLabel(orderData.orderStatus) }}</span>
                </div>
                <div class="order-date">{{ formatDate(orderData.orderedAt) }}</div>
            </div>
            
            <h4 class="order-title">{{ orderData.itemName }}</h4>
            
            <div class="meta-info">
                <div class="meta-item">
                    <i class="fas fa-tag"></i>
                    <span>{{ saleTypeLabel(orderData.saleType) }}</span>
                </div>
                <div class="meta-item">
                    <i class="fas fa-user"></i>
                    <span>{{ orderData.buyerName }}</span>
                </div>
                <div class="meta-item price">
                    <i class="fas fa-won-sign"></i>
                    <span>{{ formatPrice(orderData.price) }}</span>
                </div>
            </div>
        </div>

        <!-- 배송 정보 카드 -->
        <div class="info-card shipping-info-card">
            <div class="card-subheader">
                <i class="fas fa-truck"></i>
                <h4>배송 정보</h4>
            </div>
            <div class="content-box">
                <div class="info-grid">
                    <div class="info-item"><span class="label">수령인</span><span class="value">{{ orderData.buyerName }}</span></div>
                    <div class="info-item"><span class="label">연락처</span><span class="value">{{ orderData.tel }}</span></div>
                    <div class="info-item full-width"><span class="label">배송지</span><span class="value">{{ orderData.shippingAddress }}</span></div>
                </div>
            </div>
        </div>

        <!-- 주문 일정 카드 -->
        <div class="info-card timeline-card">
            <div class="card-subheader">
                <i class="fas fa-calendar-alt"></i>
                <h4>주문 주요 일정</h4>
            </div>
            <div class="content-box">
                <div class="info-grid">
                    <div class="info-item"><span class="label">결제</span><span class="value">{{ orderData.orderStatus !== 'PENDING_PAYMENT' ? '결제 완료' : '결제 대기중'}}</span></div>
                    <div class="info-item"><span class="label">배송 완료</span>
                      <span class="value">
                        {{ (orderData.orderStatus == 'SHIPPED' || orderData.orderStatus == 'DELIVERED') ? statusLabel(orderData.orderStatus) : '배송 준비 중' }}
                      </span>
                    </div>
                    <div class="info-item">
                      <span class="label">주문 취소</span>
                      <span class="value">
                        {{ (orderData.orderStatus == 'CANCEL_REQUESTED'
                          || orderData.orderStatus == 'CANCELLED'
                          || orderData.orderStatus == 'REFUND_REQUESTED'
                          || orderData.orderStatus == 'REFUNDED'
                        ) 
                        ? statusLabel(orderData.orderStatus) : '정보 없음'
                        }}
                      </span>
                    </div>
                </div>
            </div>
        </div>

        <!-- 영수증 섹션 -->
        <div v-if="orderData.receiptUrl" class="info-card receipt-card">
            <div class="card-subheader">
                <i class="fas fa-receipt"></i>
                <h4>결제 영수증</h4>
            </div>
            <div class="receipt-container">
                <a :href="orderData.receiptUrl" target="_blank">
                    <img :src="orderData.receiptUrl" alt="영수증 이미지" class="receipt-image" />
                </a>
            </div>
        </div>

        <!-- 결제 버튼 -->
        <div v-if="orderData.orderStatus === 'PENDING_PAYMENT' && orderData.saleType === 'AUCTION'" class="action-section">
            <button @click="goToProductDetail" class="payment-button">
                <i class="fas fa-credit-card"></i> 상품 결제하기
            </button>
        </div>
    </div>
    
    <!-- 에러 메시지 -->
    <div v-else-if="error || !orderData" class="not-found-message">
        <i class="fas fa-exclamation-circle"></i>
        <p>{{ error || '주문 정보를 찾을 수 없습니다.' }}</p>
    </div>
  </div>
</template>

<style scoped>
.order-detail-view { 
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif; 
    max-width: 900px; 
    margin: 0 auto; 
    padding: 24px; 
}

.detail-header { 
    display: flex; 
    justify-content: space-between; 
    align-items: center; 
    margin-bottom: 28px; 
}

.detail-title { 
    font-size: 1.75rem; 
    font-weight: 700; 
    color: #1e293b; 
    margin: 0; 
}

.close-button { 
    display: flex; 
    align-items: center; 
    justify-content: center; 
    width: 36px; 
    height: 36px; 
    border: none; 
    border-radius: 8px; 
    cursor: pointer; 
    background: #f1f5f9; 
    color: #64748b; 
    transition: all 0.2s ease; 
}

.close-button:hover { 
    background: #e2e8f0; 
    color: #334155; 
}

.detail-content-wrapper { 
    display: flex; 
    flex-direction: column; 
    gap: 20px; 
}

.info-card { 
    padding: 24px; 
    border-radius: 16px; 
    border: 1px solid #e2e8f0; 
    background: #ffffff; 
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1); 
}

.order-info-card { 
    border-left: 4px solid #3b82f6; 
}

.shipping-info-card { 
    border-left: 4px solid #f97316; 
}

.timeline-card { 
    border-left: 4px solid #8b5cf6; 
}

.receipt-card { 
    border-left: 4px solid #10b981; 
}

.card-header { 
    display: flex; 
    justify-content: space-between; 
    align-items: center; 
    margin-bottom: 16px; 
    flex-wrap: wrap; 
    gap: 12px; 
}

.header-left { 
    display: flex; 
    align-items: center; 
    gap: 12px; 
}

.order-number { 
    font-size: 0.875rem; 
    font-weight: 600; 
    color: #3b82f6; 
}

.order-date { 
    font-size: 0.875rem; 
    color: #64748b; 
}

.order-title { 
    font-size: 1.5rem; 
    font-weight: 700; 
    color: #0f172a; 
    margin: 0 0 16px 0; 
    line-height: 1.4; 
}

.meta-info { 
    display: flex; 
    flex-wrap: wrap; 
    gap: 24px; 
    margin-bottom: 4px; 
}

.meta-item { 
    display: flex; 
    align-items: center; 
    gap: 8px; 
    font-size: 0.9375rem; 
    color: #475569; 
}

.meta-item svg { 
    color: #94a3b8; 
    font-size: 14px; 
}

.meta-item.price { 
    font-weight: 600; 
    color: #1e293b; 
}

.meta-item.price svg { 
    color: #3b82f6; 
}

.card-subheader { 
    display: flex; 
    align-items: center; 
    gap: 10px; 
    margin-bottom: 16px; 
}

.card-subheader h4 { 
    font-size: 1.125rem; 
    font-weight: 600; 
    color: #334155; 
    margin: 0; 
}

.card-subheader svg { 
    font-size: 18px; 
    color: #64748b; 
}

.shipping-info-card .card-subheader svg { 
    color: #f97316; 
}

.timeline-card .card-subheader svg { 
    color: #8b5cf6; 
}

.receipt-card .card-subheader svg { 
    color: #10b981; 
}

.content-box { 
    padding: 20px; 
    background: #f8fafc; 
    border-radius: 12px; 
    border: 1px solid #e2e8f0; 
}

.info-grid { 
    display: grid; 
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
    gap: 16px; 
}

.info-item { 
    display: flex; 
    flex-direction: column; 
    gap: 4px; 
}

.info-item.full-width { 
    grid-column: 1 / -1; 
}

.label { 
    font-size: 0.8125rem; 
    color: #64748b; 
    font-weight: 500; 
}

.value { 
    font-size: 0.9375rem; 
    color: #1e293b; 
}

.badge { 
    display: inline-flex; 
    align-items: center; 
    padding: 6px 12px; 
    border-radius: 20px; 
    font-size: 0.75rem; 
    font-weight: 600; 
}
.badge-pending { background-color: #ffc107; }            /* 결제 대기중 - 노란색 */
.badge-paid { background-color: #17a2b8; }               /* 결제 완료 - 청록색 */
.badge-preparing { background-color: #007bff; }          /* 배송 대기중 - 파랑 */
.badge-shipped { background-color: #20c997; }            /* 배송 중 - 연녹색 */
.badge-delivered { background-color: #28a745; }          /* 배송 완료 - 녹색 */
.badge-confirmed { background-color: #6f42c1; }          /* 구매 확정 - 보라색 */
.badge-cancel-requested { background-color: #fd7e14; }   /* 취소 요청 - 주황 */
.badge-cancelled { background-color: #dc3545; }          /* 취소 완료 - 빨강 */
.badge-refund-requested { background-color: #e83e8c; }   /* 환불 요청 - 핑크 */
.badge-refunded { background-color: #343a40; }           /* 환불 완료 - 다크 그레이 */
.badge-auction { background-color: #007bff; }
.badge-instant-buy { background: #28a745; }

.badge-progress { 
    background: #dbeafe; 
    color: #1e40af; 
}

.badge-hold { 
    background: #fed7aa; 
    color: #9a3412; 
}

.badge-rejected { 
    background: #fee2e2; 
    color: #991b1b; 
}

.badge-answered { 
    background: #d1fae5; 
    color: #065f46; 
}

.receipt-container { 
    text-align: center; 
    padding: 10px; 
    background: #fff; 
    border-radius: 8px; 
}

.receipt-image { 
    max-width: 100%; 
    max-height: 400px; 
    height: auto; 
    border-radius: 4px; 
    box-shadow: 0 4px 12px rgba(0,0,0,0.1); 
    cursor: pointer; 
    transition: transform 0.2s; 
}

.receipt-image:hover { 
    transform: scale(1.02); 
}

.action-section { 
    margin-top: 10px; 
}

.payment-button { 
    width: 100%; 
    display: flex; 
    align-items: center; 
    justify-content: center; 
    gap: 10px; 
    padding: 16px; 
    font-size: 1.1rem; 
    font-weight: 600; 
    color: white; 
    background: linear-gradient(135deg, #4f46e5, #7c3aed); 
    border: none; 
    border-radius: 12px; 
    cursor: pointer; 
    transition: all 0.3s ease; 
    box-shadow: 0 4px 15px rgba(79, 70, 229, 0.4); 
}

.payment-button:hover { 
    transform: translateY(-2px); 
    box-shadow: 0 7px 20px rgba(79, 70, 229, 0.5); 
}

.loading-state, .not-found-message { 
    text-align: center; 
    padding: 60px 24px; 
}

.loading-state p, .not-found-message p { 
    margin-top: 16px; 
    font-size: 1rem; 
    color: #64748b; 
}

.not-found-message { 
    color: #ef4444; 
}

.not-found-message i { 
    font-size: 48px; 
    margin-bottom: 16px; 
    display: block; 
}

.spinner { 
    display: inline-block; 
    width: 40px; 
    height: 40px; 
    border: 4px solid #e2e8f0; 
    border-top-color: #3b82f6; 
    border-radius: 50%; 
    animation: spin 0.8s linear infinite; 
}

@keyframes spin { 
    to { 
        transform: rotate(360deg); 
    } 
}

@media (max-width: 768px) { 
    .order-detail-view { 
        padding: 16px; 
    } 

    .detail-title { 
        font-size: 1.375rem; 
    } 

    .order-title { 
        font-size: 1.25rem; 
    } 

    .info-card { 
        padding: 20px; 
    } 

    .card-header { 
        flex-direction: column; 
        align-items: flex-start; 
    } 
}

</style>