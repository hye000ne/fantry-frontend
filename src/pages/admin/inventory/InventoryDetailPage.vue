<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getOfflineInspectionDetail, changeInventoryStatus } from '@/api/adminInspection'
import { createAuction, getAuctionByInspectionId, cancelAuction } from '@/api/auction'
import { useAlertDialog } from '@/composables/useAlertDialog';

const router = useRouter()
const route = useRoute()
const { showAlert: showAlertDialog } = useAlertDialog();

// --- 상태 관리 ---
const loading = ref(true)
const inspectionId = ref(parseInt(route.params.id, 10))
const inventoryStatus = ref('') // URL 쿼리에서 상태를 직접 가져옴
const initialInventoryStatus = ref('') // 재등록 여부 판단을 위한 초기 상태 저장

const inspectionDetail = ref(null) // API로 가져온 검수 상세 정보

// 페이지 모드: REGISTER (등록), MANAGE (관리)
const pageMode = ref('')
const isLocked = ref(false) // Form 잠금 상태
const auctionId = ref('') // 현재 판매 정보의 Auction ID

// 판매 등록 폼
const saleForm = reactive({
  productInspectionId: inspectionId.value,
  saleType: 'AUCTION', // AUCTION or INSTANT_BUY
  startPrice: null,
  startTime: '',
  endTime: '',
  finalPrice: null, // 최종 낙찰가 필드 추가
})

// --- Computed ---
const info = computed(() => inspectionDetail.value?.onlineDetail ?? null)

// --- 생명주기 훅 ---
onMounted(async () => {
  // 1. URL에서 status를 읽어와 페이지 모드 즉시 결정
  if (route.query.status) {
    inventoryStatus.value = route.query.status;
    initialInventoryStatus.value = route.query.status;
    updatePageMode(inventoryStatus.value);
  } else {
    showAlertDialog('오류', '상품 상태 정보가 없어 페이지를 표시할 수 없습니다.');
    router.back();
    return;
  }

  // 2. ID로 상품 상세 정보 API 호출
  if (inspectionId.value) {
    await fetchDetails(inspectionId.value);
  }
});

// --- 데이터 조회 ---
async function fetchDetails(id) {
  loading.value = true;
  try {
    // 1. 기본 검수 정보 조회
    const inspectionRes = await getOfflineInspectionDetail(id);
    inspectionDetail.value = inspectionRes;

    // 2. 관리 모드일 경우, 판매 정보 추가 조회
    if (pageMode.value === 'MANAGE') {
      try {
        const auctionRes = await getAuctionByInspectionId(id)
        if (auctionRes.data) {
          const auctionData = auctionRes.data

          // auctionId 저장
          auctionId.value = auctionData.auctionId;
          // 기존 판매 정보로 폼 채우기
          saleForm.saleType = auctionData.saleType
          saleForm.startPrice = auctionData.startPrice
          saleForm.startTime = toLocalISOString(auctionData.startTime).substring(0, 16)
          saleForm.endTime = toLocalISOString(auctionData.endTime).substring(0, 16)
          saleForm.finalPrice = auctionData.finalPrice // 최종 낙찰가 설정
        }
      } catch (auctionErr) {
        // 판매 정보가 없는 경우 (예: 취소 후 재등록 전)는 오류로 간주하지 않음
        console.warn('판매 정보를 불러오는 데 실패했습니다:', auctionErr)
      }
    }
  } catch (err) {
    console.error('재고 상세 조회 실패:', err)
    showAlertDialog('오류', err.message || '데이터를 불러오는 데 실패했습니다.')
  } finally {
    loading.value = false
  }
}

// --- 페이지 모드 및 상태 업데이트 ---
function updatePageMode(status) {
  if (status === 'PENDING_REGIST' || status === 'NOT_SOLD' || status === 'CANCELED') {
    pageMode.value = 'REGISTER';
    isLocked.value = false;
    // 재등록 시, 새로운 입력을 위해 폼의 일부를 초기화
    if (status === 'NOT_SOLD' || status === 'CANCELED') {
        saleForm.startPrice = null
        saleForm.startTime = ''
        saleForm.endTime = ''
        saleForm.finalPrice = null
    }
  } else { // PENDING_ACTIVE, ACTIVE, REACTIVE, SOLD
    pageMode.value = 'MANAGE';
    isLocked.value = true;
  }
}

// --- 이벤트 핸들러 ---

// 상품 등록
async function handleRegister() {
  if (!validateForm()) return

  // finalPrice를 페이로드에서 제외
  const { finalPrice, ...restOfForm } = saleForm

  const isReRegistration = initialInventoryStatus.value === 'NOT_SOLD' || initialInventoryStatus.value === 'CANCELED';

  const payload = {
    ...restOfForm,
    startTime: toUtcIsoStringFromLocal(saleForm.startTime),
    endTime: toUtcIsoStringFromLocal(saleForm.endTime),
    isReRegistration: isReRegistration,
  }

  const confirmMessage = isReRegistration ? '이 내용으로 상품을 재등록하시겠습니까?' : '이 내용으로 상품을 등록하시겠습니까?';
  if (!confirm(confirmMessage)) return

  loading.value = true
  try {
    await createAuction(payload)
    showAlertDialog('성공', '상품이 성공적으로 등록되었습니다.')
    router.push('/admin/inventory/list'); // Redirect to list page
  } catch (err) {
    console.error('상품 등록 실패:', err)
    showAlertDialog('오류', err.message || '상품 등록 중 오류가 발생했습니다.')
  } finally {
    loading.value = false
  }
}

// 판매 취소
async function handleCancelSale() {
  if (!confirm('정말로 이 상품의 판매를 취소하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) return

  loading.value = true
  try {
    await cancelAuction(auctionId.value);
    showAlertDialog('성공', '판매가 성공적으로 취소되었습니다.');
    await fetchDetails(inspectionId.value) // 재조회하여 상태 변경 반영
  } catch (err) {
    console.error('판매 취소 실패:', err)
    showAlertDialog('오류', err.message || '판매 취소 중 오류가 발생했습니다.')
  } finally {
    loading.value = false
  }
}

// --- 유효성 검사 ---
function validateForm() {
  const now = new Date()
  const startTime = new Date(saleForm.startTime)
  const endTime = new Date(saleForm.endTime)

  if (!saleForm.saleType) {
    showAlertDialog('알림', '판매 유형을 선택해주세요.')
    return false
  }
  if (!saleForm.startPrice || saleForm.startPrice < 1000) {
    showAlertDialog('알림', '가격은 1,000원 이상이어야 합니다.')
    return false
  }
  if (!saleForm.startTime) {
    showAlertDialog('알림', '판매 시작 시간을 입력해주세요.')
    return false
  }
  if (startTime < now) {
    showAlertDialog('알림', '판매 시작 시간은 현재 시간 이후여야 합니다.')
    return false
  }
  if (!saleForm.endTime) {
    showAlertDialog('알림', '판매 종료 시간을 입력해주세요.')
    return false
  }
  if (endTime <= startTime) {
    showAlertDialog('알림', '판매 종료 시간은 시작 시간 이후여야 합니다.')
    return false
  }
  if (endTime.getTime() - startTime.getTime() < 60000) {
    showAlertDialog('알림', '판매 시간은 최소 1분 이상이어야 합니다.')
    return false
  }
  return true
}

// --- 유틸리티 함수 ---
const getImageUrl = (path) => {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  const base = import.meta.env.VITE_FILE_BASE_URL || ''
  return `${base.replace(/\/\/$/, '')}/${path.replace(/^\//, '')}`
}
const formatPrice = (v) => (v != null ? `${Number(v).toLocaleString()}원` : '-')

// Java LocalDateTime 배열을 JS Date 객체로 변환
const parseJavaLocalDateTime = (dt) => {
  if (!Array.isArray(dt) || dt.length < 5) return null
  const [year, month, day, hour, minute, second = 0] = dt
  return new Date(year, month - 1, day, hour, minute, second)
}

// Date 객체를 yyyy-MM-ddTHH:mm 형식의 문자열로 변환 (datetime-local input용)
const toLocalISOString = (date) => {
    if (!date) return ''
    const d = parseJavaLocalDateTime(date) ?? new Date(date);
    const tzoffset = d.getTimezoneOffset() * 60000; // timezone offset in milliseconds
    const localISOTime = new Date(d - tzoffset).toISOString().slice(0, -1);
    return localISOTime;
};

// Converts a local datetime-local string to a UTC ISO string, preserving the local time components
const toUtcIsoStringFromLocal = (localDateTimeString) => {
  if (!localDateTimeString) return '';
  const localDate = new Date(localDateTimeString);
  // Adjust the date to be UTC while preserving the local time components
  const utcDate = new Date(localDate.getTime() - localDate.getTimezoneOffset() * 60000);
  return utcDate.toISOString();
};

</script>

<template>
  <main class="container-fluid p-4">
    <div class="card shadow-sm border-0 rounded-3 overflow-hidden">
      <!-- 헤더 -->
      <div class="card-header bg-white border-bottom-0 pt-4 px-4 pb-2">
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <h4 class="fw-semibold text-dark mb-1">재고 상품 상세 및 판매 관리</h4>
            <p class="text-muted small mb-0">재고 상품의 정보를 확인하고 판매를 등록하거나 관리합니다.</p>
          </div>
          <div class="d-flex align-items-center">
            <button class="btn btn-sm btn-outline-secondary fw-medium px-3" @click="router.push('/admin/inventory/list')">목록</button>
          </div>
        </div>
      </div>

      <div class="card-body p-4">
        <!-- 로딩 스피너 -->
        <div v-if="loading" class="text-center py-5">
          <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem"></div>
          <p class="mt-3 text-muted">데이터를 불러오는 중입니다...</p>
        </div>

        <!-- 메인 컨텐츠 -->
        <div v-else-if="inspectionDetail && info" class="row g-4 g-lg-5">
          <!-- 좌측 정보 패널 -->
          <div class="col-lg-5">
            <!-- 상품 이미지 -->
            <section>
              <h5 class="fw-semibold border-bottom pb-2 mb-3">상품 이미지</h5>
              <div v-if="info.files && info.files.length" class="d-flex flex-wrap">
                <div v-for="file in info.files" :key="file.fileId" class="thumbnail-wrapper mr-2 mb-2">
                  <img :src="getImageUrl(file.fileUrl)" alt="상품 썸네일" />
                </div>
              </div>
              <p v-else class="text-muted small mb-0">등록된 이미지가 없습니다.</p>
            </section>

            <!-- 상품 정보 -->
            <section class="mt-4 pt-2">
              <h5 class="fw-semibold border-bottom pb-2 mb-3">상품 정보</h5>
              <dl class="info-grid">
                <dt>상품명</dt><dd>{{ info.itemName || '-' }}</dd>
                <dt>카테고리</dt><dd>{{ info.goodsCategoryName || '-' }}</dd>
                <dt>아티스트</dt><dd>{{ info.artistName || '-' }}</dd>
                <dt v-if="info.albumTitle">앨범명</dt><dd v-if="info.albumTitle">{{ info.albumTitle || '-' }}</dd>
                <dt>상품 설명</dt><dd>{{ info.itemDescription || '-' }}</dd>
              </dl>
            </section>

            <!-- 가격 정보 -->
            <section class="mt-4 pt-2">
              <h5 class="fw-semibold border-bottom pb-2 mb-3">가격 정보</h5>
              <dl class="info-grid">
                <dt>판매자 희망가</dt><dd class="text-primary fw-bold">{{ formatPrice(info.sellerHopePrice) }}</dd>
                <dt>시스템 예상가</dt><dd>{{ formatPrice(info.expectedPrice) }}</dd>
                <dt>팬트리 평균가</dt><dd>{{ formatPrice(info.marketAvgPrice) }}</dd>
              </dl>
            </section>

            <!-- 판매자 정보 -->
            <section class="mt-4 pt-2">
              <h5 class="fw-semibold border-bottom pb-2 mb-3">판매자 정보</h5>
              <dl class="info-grid">
                <dt>판매자 ID</dt><dd>{{ info.seller?.id || '-' }}</dd>
                <dt>이름</dt><dd>{{ info.seller?.name || '-' }}</dd>
                <dt>연락처</dt><dd>{{ info.seller?.tel || '-' }}</dd>
                <dt>배송 주소</dt><dd>{{ info.shippingAddress }} {{ info.shippingAddressDetail }}</dd>
                <dt>정산 계좌</dt><dd>{{ info.bankName }} / {{ info.bankAccount }}</dd>
              </dl>
            </section>
          </div>

          <!-- 우측 기능 패널 -->
          <div class="col-lg-7">
            <section>
              <h5 class="fw-semibold border-bottom pb-2 mb-3">판매 정보 등록</h5>
              
              <div class="p-3 bg-light rounded-3">
                <!-- 판매 유형 -->
                <div class="mb-3">
                  <label class="form-label fw-bold">판매 유형</label>
                  <div class="btn-group w-100">
                    <input type="radio" class="btn-check" name="saleType" id="type_auction" value="AUCTION" v-model="saleForm.saleType" :disabled="isLocked">
                    <label class="btn btn-sm btn-outline-primary w-100 mr-2" for="type_auction" :class="{ 'disabled': isLocked }">경매</label>
                    <input type="radio" class="btn-check" name="saleType" id="type_instant" value="INSTANT_BUY" v-model="saleForm.saleType" :disabled="isLocked">
                    <label class="btn btn-sm btn-outline-primary w-100" for="type_instant" :class="{ 'disabled': isLocked }">즉시 구매</label>
                  </div>
                </div>

                <!-- 판매가/경매 시작가 -->
                <div class="mb-3">
                  <label for="startPrice" class="form-label fw-bold">{{ saleForm.saleType === 'AUCTION' ? '경매 시작가' : '즉시 구매가' }}</label>
                  <div class="input-group">
                    <input type="number" id="startPrice" class="form-control" v-model.number="saleForm.startPrice" :disabled="isLocked" placeholder="1000원 이상 입력">
                    <span class="input-group-text">원</span>
                  </div>
                  <div class="mt-2 d-flex flex-wrap">
                    <button type="button" class="btn btn-sm btn-outline-secondary mr-2 mb-2" @click="saleForm.startPrice = info.sellerHopePrice" :disabled="isLocked || !info.sellerHopePrice">판매자 희망가</button>
                    <button type="button" class="btn btn-sm btn-outline-info mr-2 mb-2" @click="saleForm.startPrice = info.expectedPrice" :disabled="isLocked || !info.expectedPrice">시스템 예상가</button>
                    <button type="button" class="btn btn-sm btn-outline-success mb-2" @click="saleForm.startPrice = info.marketAvgPrice" :disabled="isLocked || !info.marketAvgPrice">팬트리 평균가</button>
                  </div>
                </div>

                <!-- 판매 시작 시간 -->
                <div class="mb-3">
                  <label for="startTime" class="form-label fw-bold">판매 시작 시간</label>
                  <input type="datetime-local" id="startTime" class="form-control" v-model="saleForm.startTime" :disabled="isLocked">
                </div>

                <!-- 판매 종료 시간 -->
                <div class="mb-3">
                  <label for="endTime" class="form-label fw-bold">판매 종료 시간</label>
                  <input type="datetime-local" id="endTime" class="form-control" v-model="saleForm.endTime" :disabled="isLocked">
                </div>

                <!-- 최종 낙찰가 (SOLD, CANCELED 상태의 관리 모드에서만 표시) -->
                <div v-if="pageMode === 'MANAGE' && (inventoryStatus === 'SOLD' || inventoryStatus === 'CANCELED')" class="mb-3">
                  <label for="finalPrice" class="form-label fw-bold">최종 낙찰가</label>
                  <div class="input-group">
                    <input type="number" id="finalPrice" class="form-control" :value="saleForm.finalPrice" disabled>
                    <span class="input-group-text">원</span>
                  </div>
                </div>
              </div>

              <!-- 버튼 영역 -->
              <div class="d-flex justify-content-end mt-4">
                <!-- 등록/재등록 모드 버튼 -->
                <template v-if="pageMode === 'REGISTER'">
                  <button class="btn btn-secondary mr-3" @click="router.push('/admin/inventory/list')">목록</button>
                  <button class="btn btn-primary" @click="handleRegister">
                    {{ initialInventoryStatus === 'PENDING_REGIST' ? '상품 등록' : '상품 재등록' }}
                  </button>
                </template>

                <!-- 관리 모드 버튼 -->
                <template v-if="pageMode === 'MANAGE'">
                  <button class="btn btn-secondary mr-3" @click="router.push('/admin/inventory/list')">목록</button>
                  <!-- 판매 취소는 판매중/재판매중/판매대기 상태에서만 가능 -->
                  <button v-if="inventoryStatus === 'ACTIVE' || inventoryStatus === 'REACTIVE' || inventoryStatus === 'PENDING_ACTIVE'" class="btn btn-danger" @click="handleCancelSale">
                    판매 취소
                  </button>
                </template>
              </div>
            </section>
          </div>
        </div>

        <!-- 데이터 없음 -->
        <div v-else class="text-center py-5">
          <p class="text-muted">상품 정보를 찾을 수 없습니다.</p>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped lang="scss">
.info-grid {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 0.8rem 1rem;
  dt { font-weight: 500; color: #555; }
  dd { margin: 0; color: #222; }
}

.thumbnail-wrapper {
  width: 80px; height: 80px; border-radius: 0.5rem; overflow: hidden;
  border: 1px solid #dee2e6; background-color: #f8f9fa;
  img { width: 100%; height: 100%; object-fit: cover; }
}

.btn-check:checked + .btn-outline-primary {
  background-color: #0d6efd;
  color: white;
}

.btn.disabled {
  pointer-events: none;
  opacity: 0.65;
}
</style>
