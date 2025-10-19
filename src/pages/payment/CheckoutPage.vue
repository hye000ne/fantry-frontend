<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter, onBeforeRouteLeave } from 'vue-router'
import CardHeader from './components/atoms/CardHeader.vue'
import { Payment } from '@/module/paymentModule'
import { usePaymentStore } from '@/stores/paymentStore'
import { showAlert, useAlertDialog } from '@/composables/useAlertDialog'

const router = useRouter()
const paymentStore = usePaymentStore()

// 이전 페이지에서 전달된 정보
const userInfo = ref(null)
const deliveryInfo = ref(null)
const auctionDetails = ref(null)

// 수수료 설정
const fees = {
  delivery: 3000, // 배송비
}

const totalPrice = computed(() => {
  if (!auctionDetails.value || !auctionDetails.value.currentPrice) return 0
  return auctionDetails.value.currentPrice + fees.delivery
})

const goBackToUserInfo = () => {
  router.push({ name: 'Info' })
}

const requestPayment = () => {
  if (!userInfo.value || !deliveryInfo.value || !auctionDetails.value) {
    showAlert('알림','주문자 정보가 없습니다. 다시 시도해주세요.')
    goBackToUserInfo()
    return
  }

  // Payment 모듈의 purchase 함수에 맞는 파라미터 구성
  const member = {
    id: userInfo.value.memberId || 'user-' + Date.now(),
    name: userInfo.value.name,
    phone: userInfo.value.phone,
    email: userInfo.value.email,
  }

  const item = {
    id: auctionDetails.value.auctionId,
    name: auctionDetails.value.itemName,
    price: totalPrice.value, // 총 결제금액 (상품가격 + 수수료)
    qty: 1,
  }

  const onResponse = (response) => {
    console.log('결제 응답:', response)
    if (response.success == true) {
      // 결제 성공 시 결제 완료 페이지로 이동
      sessionStorage.setItem(
        'paymentResult',
        JSON.stringify({
          ...response.data,
          // 주문자 정보
          customerName: userInfo.value.name,
          customerPhone: userInfo.value.phone,
          customerEmail: userInfo.value.email,
          // 받는 사람 정보
          recipientName: deliveryInfo.value.recipientName,
          recipientPhone: deliveryInfo.value.recipientPhone,
          // 배송지 정보
          deliveryAddress: deliveryInfo.value.address,
          deliveryDetailAddress: deliveryInfo.value.detailAddress,
          deliveryRequest: deliveryInfo.value.deliveryRequest,
          // 상품 정보
          auctionId: auctionDetails.value.auctionId,
          productName: auctionDetails.value.itemName,
          productPrice: auctionDetails.value.currentPrice,
          totalPrice: totalPrice.value,
        }),
      )

      // 결제 완료 페이지로 이동 (히스토리 스택 정리 위해 replace 사용)
      router.replace({ name: 'Complete' })
    } else {
      showAlert('결제 실패',response.data?.errorMessage || '결제에 실패했습니다.')
    }
  }

  const onError = (error) => {
    console.error('결제 에러:', error)

    // 에러 객체 파싱
    const errorData = typeof error === 'string'
      ? { message: error }
      : error?.data || error

    const errorCode = errorData?.code
    const errorMessage = errorData?.message || '결제 처리 중 오류가 발생했습니다.'

    // 에러 코드별 분기 처리
    switch(errorCode) {
      // 인증 에러 - 페이지 새로고침
      case 'PAY001':
      case 'PAY022':
        showAlert('결제 실패', errorMessage + '\n페이지를 새로고침합니다.')
        setTimeout(() => window.location.reload(), 2000)
        break

      // 시스템 설정 오류 - 고객센터 안내
      case 'PAY002':
      case 'PAY003':
      case 'PAY004':
        showAlert('시스템 오류', '시스템 오류가 발생했습니다.\n고객센터로 문의해주세요.')
        break

      // 결제 금액 불일치 - 경매 상세로 이동
      case 'PAY014':
        showAlert('결제 실패', errorMessage + '\n상품 페이지로 이동합니다.')
        setTimeout(() => {
          if (auctionDetails.value?.auctionId) {
            router.push({ name: 'AuctionDetail', params: { id: auctionDetails.value.auctionId } })
          } else {
            router.push({ name: 'Home' })
          }
        }, 2000)
        break

      // 상품 판매 불가 - 홈으로 이동
      case 'PAY021':
        showAlert('결제 불가', errorMessage)
        setTimeout(() => router.push({ name: 'Home' }), 2000)
        break

      // 결제 정보 없음 - 홈으로 이동
      case 'PAY013':
        showAlert('결제 실패', errorMessage)
        setTimeout(() => router.push({ name: 'Home' }), 2000)
        break

      // 동시 결제 진행 중
      case 'PAY020':
        showAlert(
          '결제 진행 중',
          '이미 진행 중인 결제가 있습니다.\n결제를 완료하거나 취소 후 다시 시도해주세요.'
        )
        break

      // 이미 취소된 결제
      case 'PAY023':
        showAlert('결제 실패', errorMessage)
        setTimeout(() => router.push({ name: 'Home' }), 2000)
        break

      // 네트워크/타임아웃 에러 - 재시도 유도
      case 'PAY010':
      case 'PAY011':
      case 'PAY012':
        showAlert('일시적 오류', errorMessage + '\n잠시 후 다시 시도해주세요.')
        break

      // 결제 승인 실패 - 재시도 유도
      case 'PAY008':
      case 'PAY017':
        showAlert('결제 실패', errorMessage + '\n다시 시도하거나 다른 결제수단을 이용해주세요.')
        break

      // 치명적 에러 - 고객센터 긴급 문의
      case 'PAY007':
      case 'PAY009':
        showAlert(
          '결제 오류',
          errorMessage + '\n고객센터로 긴급 문의해주세요.'
        )
        break

      // 기타 에러 - 일반 처리
      default:
        showAlert('결제 실패', errorMessage)
        break
    }
  }

  const metadata = {
    userInfo: userInfo.value,
    deliveryInfo: deliveryInfo.value,
    auctionInfo: {
      auctionId: auctionDetails.value.auctionId,
      itemName: auctionDetails.value.itemName,
      itemPrice: auctionDetails.value.currentPrice,
    },
  }
  
  // 결제 요청 실행
  Payment.purchase(member, item, totalPrice.value, metadata, onResponse, onError)
}

onMounted(() => {
  console.log('CheckoutPage 마운트됨')

  // Pinia 스토어에서 복원 시도
  paymentStore.restoreFromSession()

  // 스토어에서 데이터 가져오기
  if (paymentStore.isFlowValid()) {
    userInfo.value = { ...paymentStore.userInfo }
    deliveryInfo.value = { ...paymentStore.deliveryInfo }
    auctionDetails.value = paymentStore.auctionDetails
  } else {
    // 유효성 검사 실패 시 조용히 홈으로 리다이렉트 (결제 완료 후 뒤로가기 시나리오)
    console.warn('결제 플로우가 유효하지 않습니다. 홈으로 이동합니다.')
    router.replace({ name: 'Home' })
    return
  }

  console.log('최종 주문자 정보:', userInfo.value)
  console.log('최종 배송 정보:', deliveryInfo.value)
  console.log('최종 경매 정보:', auctionDetails.value)
})

// 페이지 이탈 시 처리 (Info/Complete가 아닌 다른 페이지로 이동 시)
onBeforeRouteLeave((to, _from, next) => {
  // UserInfo 페이지(뒤로가기)나 Complete 페이지(결제 성공)로 이동하는 경우는 제외
  if (to.name !== 'Info' && to.name !== 'Complete') {
    console.log('결제 프로세스 이탈 감지 (CheckoutPage) - paymentStore 초기화')
    paymentStore.reset()
  }
  next()
})
</script>

<template>
  <div class="hero-section mb-5">
    <div class="container-fluid">
      <div
        class="d-flex flex-column align-items-center justify-content-center"
        style="min-height: 100px"
      >
        <h1 class="hero-title mb-3">주문 최종 확인</h1>
        <p class="hero-subtitle">결제 전 주문 내용을 확인해주세요</p>
      </div>
    </div>
  </div>
  <div class="d-flex flex-row">
    <main class="col-lg-8">
      <!-- 구매 상품 정보 -->
      <section class="mb-5" v-if="auctionDetails">
        <h4 class="mb-3">구매 상품</h4>
        <div class="border p-4">
          <div class="d-flex align-items-start">
            <img
              class="product-img mr-4"
              :src="auctionDetails.imageUrl || '/images/fantry_logo.png'"
              :alt="auctionDetails.itemName"
            />
            <div class="flex-grow-1">
              <h5 class="mb-2 font-weight-bold">{{ auctionDetails.itemName }}</h5>
              <div class="mb-2">
                <span class="badge badge-success mr-2">{{ auctionDetails.productGrade }}</span>
              </div>
            </div>
            <div class="text-right">
              <h5 class="text-primary font-weight-bold mb-0">
                {{ auctionDetails.currentPrice?.toLocaleString() }}원
              </h5>
            </div>
          </div>
        </div>
      </section>

      <!-- 주문자 정보 확인 -->
      <section class="mb-5" v-if="userInfo">
        <h4 class="mb-3">주문자 정보</h4>
        <div class="border p-4">
          <div class="row mb-3">
            <div class="col-sm-3 font-weight-medium text-muted">이름</div>
            <div class="col-sm-9">{{ userInfo.name }}</div>
          </div>
          <div class="row mb-3">
            <div class="col-sm-3 font-weight-medium text-muted">휴대폰</div>
            <div class="col-sm-9">{{ userInfo.phone }}</div>
          </div>
          <div class="row">
            <div class="col-sm-3 font-weight-medium text-muted">이메일</div>
            <div class="col-sm-9">{{ userInfo.email }}</div>
          </div>
        </div>
      </section>

      <!-- 배송지 정보 확인 -->
      <section class="mb-5" v-if="deliveryInfo">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h4 class="mb-0">배송지 정보</h4>
          <button class="btn btn-outline-primary btn-sm" @click="goBackToUserInfo">
            정보 수정
          </button>
        </div>
        <div class="border p-4">
          <!-- 받는 사람 정보 -->
          <div class="recipient-section mb-4 pb-4 border-bottom">
            <h6 class="text-primary mb-3">받는 사람</h6>
            <div class="row mb-3">
              <div class="col-sm-3 font-weight-medium text-muted">이름</div>
              <div class="col-sm-9 font-weight-bold">{{ deliveryInfo.recipientName }}</div>
            </div>
            <div class="row">
              <div class="col-sm-3 font-weight-medium text-muted">연락처</div>
              <div class="col-sm-9 font-weight-bold">{{ deliveryInfo.recipientPhone }}</div>
            </div>
          </div>

          <!-- 배송 주소 -->
          <div class="address-section">
            <h6 class="text-secondary mb-3">배송 주소</h6>
            <div class="row mb-3">
              <div class="col-sm-3 font-weight-medium text-muted">주소</div>
              <div class="col-sm-9">{{ deliveryInfo.address }}</div>
            </div>
            <div class="row mb-3" v-if="deliveryInfo.detailAddress">
              <div class="col-sm-3 font-weight-medium text-muted">상세주소</div>
              <div class="col-sm-9">{{ deliveryInfo.detailAddress }}</div>
            </div>
            <div class="row" v-if="deliveryInfo.deliveryRequest">
              <div class="col-sm-3 font-weight-medium text-muted">배송 요청사항</div>
              <div class="col-sm-9">
                <span class="badge badge-info">{{ deliveryInfo.deliveryRequest }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
    <aside class="col-lg-4">
      <div class="card border-secondary mb-5" v-if="auctionDetails">
        <CardHeader>결제 정보</CardHeader>
        <div class="card-body">
          <div class="d-flex justify-content-between mb-3 pt-1">
            <h6 class="font-weight-medium">상품가격</h6>
            <h6 class="font-weight-medium">
              {{ auctionDetails.currentPrice?.toLocaleString() }}원
            </h6>
          </div>

          <div class="d-flex justify-content-between mb-3">
            <span class="text-muted small">배송비</span>
            <span class="text-muted small">{{ fees.delivery.toLocaleString() }}원</span>
          </div>
          <hr class="mt-0" />
          <div class="d-flex justify-content-between mb-3">
            <h6 class="font-weight-bold">총 결제금액</h6>
            <h6 class="font-weight-bold text-primary">{{ totalPrice.toLocaleString() }}원</h6>
          </div>
        </div>
        <div class="card-footer border-secondary bg-transparent">
          <button
            class="btn btn-lg btn-block btn-primary font-weight-bold my-3 py-3"
            @click="requestPayment"
          >
            {{ totalPrice.toLocaleString() }}원 결제하기
          </button>
        </div>
      </div>
    </aside>
  </div>
</template>
<style scoped>
/* 공통 결제 페이지 스타일 */
.hero-section {
  background-color: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.hero-title {
  font-weight: 600;
  font-size: 2rem;
  color: #333;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.hero-subtitle {
  font-size: 1rem;
  color: #6c757d;
  font-weight: 400;
}

.product-img {
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

/* 받는 사람/배송지 정보 공통 스타일 */
.recipient-section h6,
.address-section h6 {
  font-weight: 600;
  font-size: 0.95rem;
}

.recipient-section .font-weight-bold {
  color: #333;
  font-size: 1.05rem;
}

.address-section h6 {
  font-size: 0.9rem;
}

.badge {
  font-size: 12px;
  padding: 4px 8px;
}

/* 반응형 */
@media (max-width: 768px) {
  .hero-title {
    font-size: 1.5rem;
  }

  .product-img {
    width: 80px;
    height: 80px;
  }

  .recipient-section,
  .address-section {
    margin-bottom: 1rem;
  }

  .recipient-section h6,
  .address-section h6 {
    font-size: 0.85rem;
  }
}
</style>
