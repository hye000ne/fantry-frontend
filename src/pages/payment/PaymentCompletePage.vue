<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import CardHeader from './components/atoms/CardHeader.vue'
import { usePaymentStore } from '@/stores/paymentStore'

const router = useRouter()
const route = useRoute()
const paymentStore = usePaymentStore()

// 결제 정보
const paymentInfo = ref({
  orderId: '',
  productName: '',
  totalAmount: 0,
  paymentMethod: '',
  paymentDate: '',
  // 주문자 정보
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  // 받는 사람 정보
  recipientName: '',
  recipientPhone: '',
  // 배송지 정보
  deliveryAddress: '',
  deliveryDetailAddress: '',
  deliveryRequest: '',
})

// 페이지 로딩 상태
const isLoading = ref(true)

// 결제 완료 데이터 초기화
const initializePaymentData = () => {
  // sessionStorage에서 결제 정보 가져오기
  const storedPaymentResult = sessionStorage.getItem('paymentResult')
  const storedDeliveryInfo = sessionStorage.getItem('deliveryInfo')

  if (storedPaymentResult) {
    const result = JSON.parse(storedPaymentResult)
    console.log('결제 결과 데이터:', result)

    // 결제 날짜 변환 (Unix timestamp -> 한국 날짜)
    result.purchasedAt[3] += 9
    const paymentDate =
      result.purchasedAt[0] +
      '-' +
      result.purchasedAt
        .slice(1, 3)
        .map((num) => ('0' + num).slice(-2))
        .join('-') +
      ' ' +
      result.purchasedAt
        .slice(-3)
        .map((num) => ('0' + num).slice(-2))
        .join(':')

    // 결제 방법 매핑
    const paymentMethod =
      result.method === '카드'
        ? `${result.paymentInfo?.cardCompany || '신용카드'} (${result.paymentInfo?.cardQuota === '00' ? '일시불' : result.paymentInfo?.cardQuota + '개월'})`
        : result.method

    // 배송지 주소 조합
    const fullAddress = result.deliveryDetailAddress
      ? `${result.deliveryAddress} ${result.deliveryDetailAddress}`.trim()
      : result.deliveryAddress

    paymentInfo.value = {
      orderId: result.orderId || generateOrderId(),
      productName: result.orderName || '상품명',
      totalAmount: result.price || 0,
      paymentMethod: paymentMethod,
      paymentDate: paymentDate,
      // 주문자 정보
      customerName: result.customerName || '고객명',
      customerPhone: result.customerPhone || '010-0000-0000',
      customerEmail: result.customerEmail || '',
      // 받는 사람 정보
      recipientName: result.recipientName || result.customerName || '수령인',
      recipientPhone: result.recipientPhone || result.customerPhone || '010-0000-0000',
      // 배송지 정보
      deliveryAddress: result.deliveryAddress || '배송지 주소',
      deliveryDetailAddress: result.deliveryDetailAddress || '',
      deliveryRequest: result.deliveryRequest || '',
    }

    // 로딩 완료
    setTimeout(() => {
      isLoading.value = false
    }, 1000)
  } else {
    // 결제 정보가 없으면 홈으로 리다이렉트
    alert('잘못된 접근입니다.')
    router.replace('/')
  }
}

// 결제 데이터 정리 (Pinia 스토어 + sessionStorage)
const cleanupPaymentData = () => {
  console.log('결제 데이터 정리 시작')

  // Pinia 스토어 초기화
  paymentStore.reset()

  // sessionStorage 정리
  sessionStorage.removeItem('paymentResult')
  sessionStorage.removeItem('deliveryInfo')

  console.log('결제 데이터 정리 완료')
}

// 브라우저 뒤로가기 방지
const preventBackNavigation = () => {
  // 현재 페이지를 히스토리에 추가
  history.pushState(null, '', location.href)

  // popstate 이벤트 리스너 추가
  window.addEventListener('popstate', handlePopState)
}

const handlePopState = (event) => {
  // 뒤로가기 시도 시 다시 현재 페이지로 이동
  history.pushState(null, '', location.href)

  // 사용자에게 알림 (선택사항)
  alert('결제가 완료되었습니다. 주문 내역은 마이페이지에서 확인하실 수 있습니다.')
}

// 주문번호 생성
const generateOrderId = () => {
  const now = new Date()
  const year = now.getFullYear().toString().slice(-2)
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const day = now.getDate().toString().padStart(2, '0')
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0')
  return `F${year}${month}${day}${random}`
}

// 페이지 이동 함수들 - 결제 프로세스 히스토리 제거
const clearPaymentHistoryAndNavigate = (path) => {
  // 결제 프로세스 페이지 수 (Info -> Checkout -> Complete = 3페이지)
  const paymentPagesCount = 3

  // 현재 히스토리 길이 확인
  const currentHistoryLength = window.history.length

  // 결제 프로세스 이전 페이지로 돌아가기 (3페이지 뒤로)
  if (currentHistoryLength >= paymentPagesCount) {
    // history.go()로 3페이지 뒤로 이동한 후, replace로 목적지 경로 설정
    window.history.go(-paymentPagesCount)

    // popstate 이벤트 리스너를 일시적으로 제거하여 뒤로가기 방지 해제
    window.removeEventListener('popstate', handlePopState)

    // 뒤로가기 완료 후 목적지로 replace
    setTimeout(() => {
      router.replace(path)
    }, 100)
  } else {
    // 히스토리가 부족한 경우 그냥 replace로 이동
    router.replace(path)
  }
}

const goToHome = () => {
  clearPaymentHistoryAndNavigate('/')
}

const goToMyPage = () => {
  clearPaymentHistoryAndNavigate('/mypage')
}

const goToOrderHistory = () => {
  clearPaymentHistoryAndNavigate('/mypage/orders')
}

onMounted(() => {
  initializePaymentData()

  // 결제 데이터 정리 (페이지 로드 직후)
  cleanupPaymentData()

  // 브라우저 뒤로가기 방지
  preventBackNavigation()
})

onBeforeUnmount(() => {
  // 컴포넌트 언마운트 시 이벤트 리스너 제거
  window.removeEventListener('popstate', handlePopState)
})
</script>

<template>
  <!-- 로딩 상태 -->
  <div v-if="isLoading" class="loading-container">
    <div class="container-fluid">
      <div
        class="d-flex flex-column align-items-center justify-content-center"
        style="min-height: 400px"
      >
        <div class="spinner-border text-primary mb-3" role="status">
          <span class="sr-only">로딩 중...</span>
        </div>
        <p class="text-muted">결제 정보를 확인하고 있습니다...</p>
      </div>
    </div>
  </div>

  <!-- 결제 완료 화면 -->
  <div v-else>
    <!-- Hero Section -->
    <div class="hero-section mb-5">
      <div class="container-fluid">
        <div
          class="d-flex flex-column align-items-center justify-content-center"
          style="min-height: 300px"
        >
          <div class="success-icon mb-4">
            <svg
              width="80"
              height="80"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="12" cy="12" r="12" fill="#28a745" />
              <path
                d="M9 12l2 2 4-4"
                stroke="white"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>
          <h1 class="hero-title mb-3">결제가 완료되었습니다</h1>
          <p class="hero-subtitle">주문해 주셔서 감사합니다. 빠른 시일 내에 배송해드리겠습니다.</p>
        </div>
      </div>
    </div>

    <div class="container-fluid">
      <div class="row justify-content-center">
        <div class="col-lg-8">
          <!-- 주문 정보 카드 -->
          <section class="mb-5">
            <div class="card border-secondary">
              <CardHeader>주문 정보</CardHeader>
              <div class="card-body">
                <div class="row mb-4">
                  <div class="col-sm-3 font-weight-medium text-muted">주문번호</div>
                  <div class="col-sm-9">
                    <span class="font-weight-bold order-number">{{ paymentInfo.orderId }}</span>
                  </div>
                </div>
                <div class="row mb-4">
                  <div class="col-sm-3 font-weight-medium text-muted">상품명</div>
                  <div class="col-sm-9">{{ paymentInfo.productName }}</div>
                </div>
                <div class="row mb-4">
                  <div class="col-sm-3 font-weight-medium text-muted">결제금액</div>
                  <div class="col-sm-9">
                    <span class="font-weight-bold text-primary h5">
                      {{ paymentInfo.totalAmount.toLocaleString() }}원
                    </span>
                  </div>
                </div>
                <div class="row mb-4">
                  <div class="col-sm-3 font-weight-medium text-muted">결제방법</div>
                  <div class="col-sm-9">{{ paymentInfo.paymentMethod }}</div>
                </div>
                <div class="row">
                  <div class="col-sm-3 font-weight-medium text-muted">결제일시</div>
                  <div class="col-sm-9">{{ paymentInfo.paymentDate }}</div>
                </div>
              </div>
            </div>
          </section>

          <!-- 주문자 정보 카드 -->
          <section class="mb-5">
            <div class="card border-secondary">
              <CardHeader>주문자 정보</CardHeader>
              <div class="card-body">
                <div class="row mb-3">
                  <div class="col-sm-3 font-weight-medium text-muted">이름</div>
                  <div class="col-sm-9">{{ paymentInfo.customerName }}</div>
                </div>
                <div class="row mb-3">
                  <div class="col-sm-3 font-weight-medium text-muted">연락처</div>
                  <div class="col-sm-9">{{ paymentInfo.customerPhone }}</div>
                </div>
                <div class="row" v-if="paymentInfo.customerEmail">
                  <div class="col-sm-3 font-weight-medium text-muted">이메일</div>
                  <div class="col-sm-9">{{ paymentInfo.customerEmail }}</div>
                </div>
              </div>
            </div>
          </section>

          <!-- 배송 정보 카드 -->
          <section class="mb-5">
            <div class="card border-secondary">
              <CardHeader>배송 정보</CardHeader>
              <div class="card-body">
                <!-- 받는 사람 정보 섹션 -->
                <div class="recipient-info mb-4 pb-4 border-bottom">
                  <h6 class="text-primary mb-3 font-weight-bold">받는 사람</h6>
                  <div class="row mb-3">
                    <div class="col-sm-3 font-weight-medium text-muted">이름</div>
                    <div class="col-sm-9 font-weight-bold">{{ paymentInfo.recipientName }}</div>
                  </div>
                  <div class="row">
                    <div class="col-sm-3 font-weight-medium text-muted">연락처</div>
                    <div class="col-sm-9 font-weight-bold">{{ paymentInfo.recipientPhone }}</div>
                  </div>
                </div>

                <!-- 배송 주소 섹션 -->
                <div class="delivery-address mb-4">
                  <h6 class="text-secondary mb-3 font-weight-bold">배송 주소</h6>
                  <div class="row mb-3">
                    <div class="col-sm-3 font-weight-medium text-muted">주소</div>
                    <div class="col-sm-9">{{ paymentInfo.deliveryAddress }}</div>
                  </div>
                  <div class="row mb-3" v-if="paymentInfo.deliveryDetailAddress">
                    <div class="col-sm-3 font-weight-medium text-muted">상세주소</div>
                    <div class="col-sm-9">{{ paymentInfo.deliveryDetailAddress }}</div>
                  </div>
                  <div class="row" v-if="paymentInfo.deliveryRequest">
                    <div class="col-sm-3 font-weight-medium text-muted">배송 요청사항</div>
                    <div class="col-sm-9">
                      <span class="badge badge-info">{{ paymentInfo.deliveryRequest }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- 액션 버튼 그룹 -->
          <div class="action-buttons text-center mb-5">
            <button class="btn btn-primary btn-lg mr-3 px-4 py-3" @click="goToOrderHistory">
              주문 내역 확인
            </button>
            <button class="btn btn-outline-primary btn-lg mr-3 px-4 py-3" @click="goToMyPage">
              마이페이지
            </button>
            <button class="btn btn-outline-secondary btn-lg px-4 py-3" @click="goToHome">
              홈으로 가기
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.loading-container {
  min-height: 60vh;
}

/* 공통 결제 페이지 스타일 */
.hero-section {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-bottom: 1px solid #e9ecef;
}

.hero-title {
  font-weight: 600;
  font-size: 2.2rem;
  color: #333;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.hero-subtitle {
  font-size: 1.1rem;
  color: #6c757d;
  font-weight: 400;
}

.card {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin-bottom: 1.5rem;
}

.font-weight-medium {
  font-weight: 500;
}

/* 페이지 특화 스타일 */
.success-icon {
  animation: bounce 0.6s ease-in-out;
}

@keyframes bounce {
  0%,
  20%,
  60%,
  100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  80% {
    transform: translateY(-5px);
  }
}

.action-buttons .btn {
  transition: all 0.3s ease;
  border-radius: 8px;
  font-weight: 500;
}

.action-buttons .btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.badge {
  font-size: 0.85rem;
  padding: 0.5rem 0.75rem;
}

.spinner-border {
  width: 3rem;
  height: 3rem;
}

/* 주문번호 강조 스타일 */
.order-number {
  color: #2f4dca;
  font-size: 1.1rem;
  letter-spacing: 0.5px;
}

/* 받는 사람 정보 강조 */
.recipient-info h6 {
  font-size: 0.95rem;
}

.recipient-info .font-weight-bold {
  color: #333;
  font-size: 1.05rem;
}

.delivery-address h6 {
  font-size: 0.9rem;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .hero-title {
    font-size: 1.8rem;
  }

  .action-buttons .btn {
    margin-bottom: 0.5rem;
    width: 100%;
  }
}

@media (max-width: 576px) {
  .hero-title {
    font-size: 1.5rem;
  }

  .hero-subtitle {
    font-size: 1rem;
  }
}
</style>
