<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter, useRoute, onBeforeRouteLeave } from 'vue-router'
import openAddressSearch from '@/module/kakaoAddressSearch'
import { useUserStore } from '@/stores/userStore'
import { usePaymentStore } from '@/stores/paymentStore'
import { getAllAddressMember, addAddress } from '@/api/address'
import { getAuctionDetails } from '@/api/auction'
import { useAlertDialog } from '@/composables/useAlertDialog'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const paymentStore = usePaymentStore()
const { showAlert } = useAlertDialog()

// Auction context from query parameter
const auctionId = ref(null)
const auctionDetails = ref(null)

// 주문자 정보 (읽기 전용 - 로그인된 사용자 정보)
const userInfo = reactive({
  memberId: null,
  name: '',
  phone: '',
  email: '',
})

// 배송지 목록
const savedAddresses = ref([])
const selectedAddressId = ref(null)

// 받는 사람 정보
const recipientInfo = reactive({
  recipientName: '',
  recipientPhone: '',
})

// 배송지 정보 (선택된 주소로 자동 채워짐)
const deliveryAddress = reactive({
  address: '',
  detailAddress: '',
  deliveryRequest: '',
})

// 배송 요청사항 직접 입력
const customDeliveryRequest = ref('')
const showCustomRequestInput = ref(false)

// 새 배송지 추가 모달
const showAddAddressModal = ref(false)
const newAddress = reactive({
  alias: '',
  recipientName: '',
  recipientTel: '',
  roadAddress: '',
  detailAddress: '',
  isDefault: false,
})

const isFormValid = computed(() => {
  return (
    userInfo.name &&
    userInfo.phone &&
    userInfo.email &&
    recipientInfo.recipientName &&
    recipientInfo.recipientPhone &&
    deliveryAddress.address
  )
})

// 로그인된 사용자 정보 로드
const loadUserInfo = () => {
  if (userStore.currentUser) {
    userInfo.memberId = userStore.currentUser.memberId || null
    userInfo.name = userStore.currentUser.name || ''
    userInfo.phone = userStore.currentUser.tel || ''
    userInfo.email = userStore.currentUser.email || ''
  }
}

// 배송지 목록 로드
const loadAddresses = async () => {
  if (!userStore.currentUser || !userStore.currentUser.memberId) {
    console.warn('사용자 정보가 없습니다.')
    return
  }

  try {
    const response = await getAllAddressMember(userStore.currentUser.memberId)
    savedAddresses.value = response.data.addressList || []

    // 기본 배송지 자동 선택
    const defaultAddress = savedAddresses.value.find((addr) => addr.isDefault === '1')
    if (defaultAddress) {
      selectAddress(defaultAddress.addressId)
    }
  } catch (error) {
    console.error('배송지 목록 로드 실패:', error)
    savedAddresses.value = []
  }
}

// 배송지 선택
const selectAddress = (addressId) => {
  const selected = savedAddresses.value.find((addr) => addr.addressId === addressId)
  if (selected) {
    selectedAddressId.value = addressId
    recipientInfo.recipientName = selected.recipientName || ''
    recipientInfo.recipientPhone = selected.recipientTel || ''
    deliveryAddress.address = selected.roadAddress || ''
    deliveryAddress.detailAddress = selected.detailAddress || ''
  }
}

// 배송 요청사항 변경 처리
const onDeliveryRequestChange = () => {
  if (deliveryAddress.deliveryRequest === 'custom') {
    showCustomRequestInput.value = true
    customDeliveryRequest.value = ''
  } else {
    showCustomRequestInput.value = false
    customDeliveryRequest.value = ''
  }
}

// 새 배송지 추가 - 주소 검색
const searchNewAddress = () => {
  openAddressSearch((data) => {
    newAddress.roadAddress = data.address
    newAddress.detailAddress = ''
  })
}

// 전화번호 포맷팅
const formatPhoneNumber = (value) => {
  const numbers = value.replace(/[^\d]/g, '')
  if (numbers.length <= 3) return numbers
  if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
  return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
}

const onRecipientPhoneInput = (event) => {
  const formatted = formatPhoneNumber(event.target.value)
  recipientInfo.recipientPhone = formatted
  event.target.value = formatted
}

const onNewAddressPhoneInput = (event) => {
  const formatted = formatPhoneNumber(event.target.value)
  newAddress.recipientTel = formatted
  event.target.value = formatted
}

// 새 배송지 저장
const saveNewAddress = async () => {
  if (
    !newAddress.alias ||
    !newAddress.recipientName ||
    !newAddress.recipientTel ||
    !newAddress.roadAddress
  ) {
    showAlert('입력 오류', '모든 필수 항목을 입력해주세요.')
    return
  }

  try {
    const payload = {
      memberId: userStore.currentUser.memberId,
      alias: newAddress.alias,
      recipientName: newAddress.recipientName,
      recipientTel: newAddress.recipientTel,
      roadAddress: newAddress.roadAddress,
      detailAddress: newAddress.detailAddress || '',
      isDefault: newAddress.isDefault ? '1' : '0',
    }

    await addAddress(payload)
    showAlert('성공', '배송지가 추가되었습니다.')

    // 배송지 목록 새로고침
    await loadAddresses()

    // 모달 닫기 및 초기화
    showAddAddressModal.value = false
    resetNewAddressForm()

    // 방금 추가한 배송지 자동 선택 (목록의 마지막 항목)
    if (savedAddresses.value.length > 0) {
      const lastAddress = savedAddresses.value[savedAddresses.value.length - 1]
      selectAddress(lastAddress.addressId)
    }
  } catch (error) {
    console.error('배송지 추가 실패:', error)
    showAlert('실패', '배송지 추가에 실패했습니다. 다시 시도해주세요.')
  }
}

// 새 배송지 폼 초기화
const resetNewAddressForm = () => {
  newAddress.alias = ''
  newAddress.recipientName = ''
  newAddress.recipientTel = ''
  newAddress.roadAddress = ''
  newAddress.detailAddress = ''
  newAddress.isDefault = false
}

// 모달 닫기 헬퍼 함수
const closeAddressModal = () => {
  showAddAddressModal.value = false
  resetNewAddressForm()
}

// 결제 정보 확인 페이지로 이동
const proceedToCheckout = () => {
  if (!isFormValid.value) {
    showAlert('입력 오류', '필수 항목을 모두 입력해주세요.')
    return
  }

  // Pinia 스토어에 정보 저장
  paymentStore.setUserInfo({
    memberId: userInfo.memberId,
    name: userInfo.name,
    phone: userInfo.phone,
    email: userInfo.email,
  })

  // 배송 요청사항 처리: 직접 입력인 경우 customDeliveryRequest 사용
  const finalDeliveryRequest =
    deliveryAddress.deliveryRequest === 'custom'
      ? customDeliveryRequest.value
      : deliveryAddress.deliveryRequest

  paymentStore.setDeliveryInfo({
    recipientName: recipientInfo.recipientName,
    recipientPhone: recipientInfo.recipientPhone,
    addressId: selectedAddressId.value,
    address: deliveryAddress.address,
    detailAddress: deliveryAddress.detailAddress,
    deliveryRequest: finalDeliveryRequest,
  })

  // Checkout 페이지로 이동
  router.push({ name: 'Checkout' })
}

// 경매 정보 로드
const loadAuctionDetails = async (id) => {
  try {
    const response = await getAuctionDetails(id)
    console.log('📦 API 응답:', response.data)
    console.log('🖼️ fileInfos:', response.data.fileInfos)

    // 이미지 URL 처리: 첫 번째 이미지만 추출
    let imageUrl = '/images/fantry_logo.png' // 기본 이미지
    if (response.data.fileInfos && response.data.fileInfos.length > 0) {
      const baseUrl = import.meta.env.VITE_FILE_BASE_URL || ''
      imageUrl = `${baseUrl}/${response.data.fileInfos[0].fileUrl}`
      console.log('✅ 이미지 URL 생성:', imageUrl)
    } else {
      console.log('⚠️ fileInfos 없음 - 기본 이미지 사용')
    }

    // 경매 정보에 imageUrl 추가
    auctionDetails.value = {
      ...response.data,
      imageUrl: imageUrl
    }
    console.log('💾 auctionDetails.value:', auctionDetails.value)

    // Pinia 스토어에 경매 컨텍스트 저장 (imageUrl 포함)
    paymentStore.setAuctionContext(id, auctionDetails.value)
  } catch (error) {
    console.error('경매 정보 로드 실패:', error)
    showAlert('오류', '경매 정보를 불러올 수 없습니다.')
    router.push({ name: 'Home' })
  }
}

// 초기화
onMounted(async () => {
  // 1. Query parameter에서 auctionId 확인
  const queryAuctionId = route.query.auctionId

  if (queryAuctionId) {
    auctionId.value = queryAuctionId
    await loadAuctionDetails(queryAuctionId)
  } else {
    // 2. Pinia 스토어에서 복원 시도
    paymentStore.restoreFromSession()
    if (paymentStore.auctionId) {
      auctionId.value = paymentStore.auctionId
      // API로 경매 상세 정보 다시 로드
      await loadAuctionDetails(paymentStore.auctionId)
    } else {
      // 경매 ID가 없으면 조용히 홈으로 리다이렉트 (결제 완료 후 뒤로가기 시나리오)
      // 경고 메시지 없이 리다이렉트하여 UX 개선
      router.replace({ name: 'Home' })
      return
    }
  }

  // 3. 사용자 정보 로드
  loadUserInfo()

  // 4. 배송지 목록 로드
  await loadAddresses()

  // 5. CheckoutPage에서 돌아온 경우 배송 정보 복원
  if (paymentStore.deliveryInfo && paymentStore.deliveryInfo.recipientName) {
    // 받는 사람 정보 복원
    recipientInfo.recipientName = paymentStore.deliveryInfo.recipientName
    recipientInfo.recipientPhone = paymentStore.deliveryInfo.recipientPhone

    // 배송지 정보 복원
    deliveryAddress.address = paymentStore.deliveryInfo.address
    deliveryAddress.detailAddress = paymentStore.deliveryInfo.detailAddress || ''
    deliveryAddress.deliveryRequest = paymentStore.deliveryInfo.deliveryRequest || ''

    // 배송지 ID로 선택 상태 복원
    if (paymentStore.deliveryInfo.addressId) {
      selectedAddressId.value = paymentStore.deliveryInfo.addressId
    }

    // "직접 입력" 상태 복원
    const standardRequests = [
      '문앞에 놓아주세요',
      '경비실에 맡겨주세요',
      '택배함에 넣어주세요',
      '직접 받겠습니다',
      '부재 시 연락주세요',
    ]

    if (
      deliveryAddress.deliveryRequest &&
      !standardRequests.includes(deliveryAddress.deliveryRequest)
    ) {
      // 직접 입력된 배송 요청사항인 경우
      customDeliveryRequest.value = deliveryAddress.deliveryRequest
      deliveryAddress.deliveryRequest = 'custom'
      showCustomRequestInput.value = true
    }
  }
})

// 사용자 정보 변경 감지
watch(
  () => userStore.currentUser,
  (newUser) => {
    if (newUser) {
      loadUserInfo()
      loadAddresses()
    }
  },
)

// 페이지 이탈 시 처리 (CheckoutPage가 아닌 다른 페이지로 이동 시)
onBeforeRouteLeave((to, _from, next) => {
  // Checkout 페이지로 이동하는 경우는 제외 (정상적인 결제 프로세스)
  if (to.name !== 'Checkout') {
    console.log('결제 프로세스 이탈 감지 (UserInfoPage) - paymentStore 초기화')
    paymentStore.reset()
  }
  next()
})

// 브라우저 종료/새로고침 시 처리
onBeforeUnmount(() => {
  // CheckoutPage로 이동하지 않는 경우를 대비한 추가 정리
  // (실제로는 onBeforeRouteLeave에서 처리되지만, 안전장치로 추가)
})
</script>

<template>
  <div class="hero-section mb-5">
    <div class="container-fluid">
      <div
        class="d-flex flex-column align-items-center justify-content-center"
        style="min-height: 100px"
      >
        <h1 class="hero-title mb-3">주문 정보 입력</h1>
        <p class="hero-subtitle">배송을 위한 정보를 입력해주세요</p>
      </div>
    </div>
  </div>

  <div class="container-fluid">
    <div class="row justify-content-center">
      <div class="col-lg-8">
        <!-- 구매 상품 정보 -->
        <section class="mb-5" v-if="auctionDetails">
          <h4 class="mb-4">구매 상품</h4>
          <div class="border p-4 bg-light">
            <div class="d-flex align-items-start">
              <img
                class="product-img mr-4"
                :src="auctionDetails.imageUrl || '/images/fantry_logo.png'"
                :alt="auctionDetails.itemName"
              />
              <div class="flex-grow-1">
                <h5 class="mb-2 font-weight-bold">{{ auctionDetails.itemName }}</h5>
                <div class="mb-3">
                  <div class="d-flex align-items-center mb-1">
                    <span class="badge badge-success mr-2">{{ auctionDetails.productGrade }}</span>
                  </div>
                </div>
                <div class="price-info">
                  <h4 class="text-primary font-weight-bold mb-0">
                    {{ auctionDetails.currentPrice?.toLocaleString() }}원
                  </h4>
                </div>
              </div>
            </div>
          </div>
        </section>

        <form @submit.prevent="proceedToCheckout">
          <!-- 주문자 정보 (읽기 전용) -->
          <section class="mb-5">
            <h4 class="mb-4">주문자 정보</h4>
            <div class="border p-4 bg-light">
              <p class="text-muted small mb-3">
                <i class="bi bi-info-circle"></i> 주문자 정보는 로그인된 계정 정보로 자동
                입력됩니다.
              </p>
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label for="name" class="form-label"
                    >이름 <span class="text-danger">*</span></label
                  >
                  <input
                    id="name"
                    v-model="userInfo.name"
                    type="text"
                    class="form-control bg-light"
                    disabled
                    readonly
                  />
                </div>
                <div class="col-md-6 mb-3">
                  <label for="phone" class="form-label"
                    >휴대폰 번호 <span class="text-danger">*</span></label
                  >
                  <input
                    id="phone"
                    v-model="userInfo.phone"
                    type="tel"
                    class="form-control bg-light"
                    disabled
                    readonly
                  />
                </div>
              </div>
              <div class="mb-0">
                <label for="email" class="form-label"
                  >이메일 <span class="text-danger">*</span></label
                >
                <input
                  id="email"
                  v-model="userInfo.email"
                  type="email"
                  class="form-control bg-light"
                  disabled
                  readonly
                />
              </div>
            </div>
          </section>

          <!-- 배송지 정보 -->
          <section class="mb-5">
            <div class="d-flex justify-content-between align-items-center mb-4">
              <h4 class="mb-0">배송지 정보</h4>
              <button
                type="button"
                class="btn btn-outline-primary btn-sm"
                @click="showAddAddressModal = true"
              >
                <i class="bi bi-plus-circle"></i> 새 배송지 추가
              </button>
            </div>
            <div class="border p-4">
              <!-- 저장된 배송지 목록 -->
              <div class="mb-4">
                <label class="form-label font-weight-bold">배송지 선택</label>
                <div
                  v-if="savedAddresses && savedAddresses.length > 0"
                  class="address-list"
                  style="gap: 12px"
                >
                  <div
                    v-for="address in savedAddresses"
                    :key="address.addressId"
                    class="border p-3 address-item"
                    :class="{
                      'border-primary bg-light': selectedAddressId === address.addressId,
                    }"
                    style="cursor: pointer; transition: all 0.2s; border-radius: 8px"
                    @click="selectAddress(address.addressId)"
                  >
                    <div class="d-flex align-items-center mb-2" style="gap: 10px">
                      <input
                        type="radio"
                        :id="`addr-${address.addressId}`"
                        :value="address.addressId"
                        v-model="selectedAddressId"
                        style="cursor: pointer"
                        @change="selectAddress(address.addressId)"
                      />
                      <label :for="`addr-${address.addressId}`" class="font-weight-bold mb-0">{{
                        address.alias
                      }}</label>
                      <span v-if="address.isDefault === '1'" class="badge badge-primary"
                        >기본배송지</span
                      >
                    </div>
                    <div class="ml-4">
                      <p class="mb-1">
                        <strong>{{ address.recipientName }}</strong> /
                        {{ address.recipientTel }}
                      </p>
                      <p class="text-muted small mb-0">
                        {{ address.roadAddress }}
                        {{ address.detailAddress }}
                      </p>
                    </div>
                  </div>
                </div>
                <div v-else class="border p-4 text-center text-muted bg-light">
                  <i class="bi bi-inbox" style="font-size: 2rem"></i>
                  <p class="mb-2 mt-2">저장된 배송지가 없습니다.</p>
                  <p class="small mb-0">'새 배송지 추가' 버튼을 클릭하여 배송지를 등록해주세요.</p>
                </div>
              </div>

              <!-- 받는 사람 정보 -->
              <div class="row mb-3">
                <div class="col-md-6">
                  <label for="recipientName" class="form-label"
                    >받는 사람 <span class="text-danger">*</span></label
                  >
                  <input
                    id="recipientName"
                    v-model="recipientInfo.recipientName"
                    type="text"
                    class="form-control bg-light"
                    readonly
                  />
                </div>
                <div class="col-md-6">
                  <label for="recipientPhone" class="form-label"
                    >받는 사람 연락처 <span class="text-danger">*</span></label
                  >
                  <input
                    id="recipientPhone"
                    v-model="recipientInfo.recipientPhone"
                    type="tel"
                    class="form-control bg-light"
                    readonly
                  />
                </div>
              </div>

              <!-- 배송 주소 (읽기 전용) -->
              <div class="mb-3">
                <label for="address" class="form-label"
                  >주소 <span class="text-danger">*</span></label
                >
                <input
                  id="address"
                  v-model="deliveryAddress.address"
                  class="form-control bg-light"
                  type="text"
                  readonly
                />
              </div>
              <div class="mb-3">
                <label for="detailAddress" class="form-label">상세주소</label>
                <input
                  id="detailAddress"
                  v-model="deliveryAddress.detailAddress"
                  class="form-control bg-light"
                  type="text"
                  readonly
                />
              </div>

              <!-- 배송 요청사항 -->
              <div class="mb-0">
                <label for="deliveryRequest" class="form-label">배송 요청사항</label>
                <select
                  id="deliveryRequest"
                  v-model="deliveryAddress.deliveryRequest"
                  class="form-control delivery-select"
                  @change="onDeliveryRequestChange"
                >
                  <option value="">배송 요청사항을 선택하세요</option>
                  <option value="문앞에 놓아주세요">문앞에 놓아주세요</option>
                  <option value="경비실에 맡겨주세요">경비실에 맡겨주세요</option>
                  <option value="택배함에 넣어주세요">택배함에 넣어주세요</option>
                  <option value="직접 받겠습니다">직접 받겠습니다</option>
                  <option value="부재 시 연락주세요">부재 시 연락주세요</option>
                  <option value="custom">직접 입력</option>
                </select>

                <!-- 직접 입력 필드 -->
                <div v-if="showCustomRequestInput" class="mt-3">
                  <input
                    v-model="customDeliveryRequest"
                    type="text"
                    class="form-control"
                    placeholder="배송 요청사항을 입력해주세요 (예: 초인종 누르지 말아주세요)"
                    maxlength="100"
                  />
                  <small class="text-muted">최대 100자까지 입력 가능합니다</small>
                </div>
              </div>
            </div>
          </section>

          <!-- 다음 단계 버튼 -->
          <div class="text-center mb-5">
            <button
              type="submit"
              class="btn btn-primary btn-lg px-5 py-3"
              :disabled="!isFormValid"
              :class="{ 'btn-secondary': !isFormValid }"
            >
              결제 정보 확인하기
            </button>
            <p class="text-muted mt-2 small">* 필수 항목을 모두 입력해주세요</p>
          </div>
        </form>
      </div>
    </div>
  </div>

  <!-- 새 배송지 추가 모달 -->
  <div
    v-if="showAddAddressModal"
    class="modal fade show d-block"
    tabindex="-1"
    style="background-color: rgba(0, 0, 0, 0.5)"
  >
    <div class="modal-dialog modal-dialog-centered modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">새 배송지 추가</h5>
          <button type="button" class="close" @click="closeAddressModal">
            <span>&times;</span>
          </button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveNewAddress">
            <div class="mb-3">
              <label for="alias" class="form-label"
                >배송지 별칭 <span class="text-danger">*</span></label
              >
              <input
                id="alias"
                v-model="newAddress.alias"
                type="text"
                class="form-control"
                placeholder="예: 집, 회사, 학교"
                required
              />
            </div>
            <div class="row mb-3">
              <div class="col-md-6">
                <label for="newRecipientName" class="form-label"
                  >받는 사람 <span class="text-danger">*</span></label
                >
                <input
                  id="newRecipientName"
                  v-model="newAddress.recipientName"
                  type="text"
                  class="form-control"
                  placeholder="받는 사람 이름"
                  required
                />
              </div>
              <div class="col-md-6">
                <label for="newRecipientTel" class="form-label"
                  >받는 사람 연락처 <span class="text-danger">*</span></label
                >
                <input
                  id="newRecipientTel"
                  type="tel"
                  class="form-control"
                  placeholder="010-0000-0000"
                  maxlength="13"
                  required
                  @input="onNewAddressPhoneInput"
                />
              </div>
            </div>
            <div class="mb-3">
              <label class="form-label">주소 <span class="text-danger">*</span></label>
              <div class="d-flex">
                <input
                  v-model="newAddress.roadAddress"
                  class="form-control mr-2"
                  type="text"
                  placeholder="주소"
                  required
                  readonly
                />
                <button type="button" class="btn btn-primary" @click="searchNewAddress">
                  주소 검색
                </button>
              </div>
            </div>
            <div class="mb-3">
              <input
                v-model="newAddress.detailAddress"
                class="form-control"
                type="text"
                placeholder="상세주소를 입력하세요"
              />
            </div>
            <div class="form-check mb-3">
              <input
                id="isDefault"
                v-model="newAddress.isDefault"
                type="checkbox"
                class="form-check-input"
              />
              <label for="isDefault" class="form-check-label">기본 배송지로 설정</label>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="closeAddressModal">취소</button>
          <button type="button" class="btn btn-primary" @click="saveNewAddress">저장</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 공통 결제 페이지 스타일 */
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

/* 페이지 특화 스타일 */
.delivery-select {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 12px center;
  background-repeat: no-repeat;
  background-size: 16px 12px;
  appearance: none;
}

.address-list {
  display: flex;
  flex-direction: column;
}

.address-item {
  transition: all 0.2s ease;
}

.address-item:hover {
  border-color: #d19c97 !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.address-item.border-primary {
  background-color: #f8f9fa;
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
}
</style>
