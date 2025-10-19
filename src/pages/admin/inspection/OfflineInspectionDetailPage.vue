<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useModal } from '@/composables/useModal'
import { estimatePrice, getMarketAvgPrice } from '@/api/checklist.js'
import { getOfflineInspectionDetail, approveOfflineInspection, rejectOfflineInspection } from '@/api/adminInspection'
import { useAdminInspectionStore } from '@/stores/adminInspectionStore'
import { useAlertDialog } from '@/composables/useAlertDialog.js'

const { showAlert } = useAlertDialog()
const router = useRouter()
const route = useRoute()
const adminStore = useAdminInspectionStore()

// 상태
const loading = ref(false)
const inspectionId = ref(null)
const detail = ref(null) // 2차 오프라인 검수 상세 응답
const online = computed(() => detail.value?.onlineDetail ?? null) // 1차 온라인 검수 상세 응답
const localChecklist = ref([]) // 로컬 체크리스트

// 실시간 가격
const loadingMarketAvg = ref(false) // 시세 조회 로딩
const loadingEstimate = ref(false) // 예상가 재로딩
const currentMarketAvgPrice = ref(null) // 실시간 시세
const currentExpectedPrice = ref(null) // 실시간 예상가

// 이미지 모달
const selectedImage = ref(null)
const { initModal: initImageModal, show: showImageModal } = useModal('#imageModal')

// 승인 모달
const approveForm = reactive({ finalBuyPrice: null, priceDeductionReason: '', inspectionNotes: '' })
const { initModal: initApproveModal, show: openApproveModal, hide: closeApproveModal } = useModal('#approveModal')

// 반려 모달
const rejectForm = reactive({ secondRejectionReason: '' })
const { initModal: initRejectModal, show: openRejectModal, hide: closeRejectModal } = useModal('#rejectModal')

// 생명주기
onMounted(async () => {
  const paramId = parseInt(route.params.id, 10)
  if (paramId) {
    inspectionId.value = paramId
    await fetchDetail(inspectionId.value)
  }

  // 각 모달 초기화
  initImageModal()
  initApproveModal()
  initRejectModal()

  refetchMarketAvg()
})

// 오프라인 검수 상세 API 조회
async function fetchDetail(id) {
  loading.value = true
  try {
    const res = await getOfflineInspectionDetail(id)
    detail.value = res
    initializeLocalChecklist(res.checklist) // 로컬 체크리스트 상태 초기화

    currentMarketAvgPrice.value = res.onlineDetail?.marketAvgPrice ?? null
    currentExpectedPrice.value = res.onlineDetail?.expectedPrice ?? null

    // 승인 모달 폼 초기값 설정
    approveForm.finalBuyPrice = res.finalBuyPrice ?? res.onlineDetail?.sellerHopePrice ?? null
    approveForm.priceDeductionReason = res.priceDeductionReason ?? ''
    approveForm.inspectionNotes = res.inspectionNotes ?? ''
  } catch (err) {
    console.error('오프라인 검수 상세 조회 실패:', err)
    showAlert('오류', err.message || '데이터를 불러오는 데 실패했습니다.')
  } finally {
    loading.value = false
  }
}

// 예상가 재계산
async function recalculateExpectedPrice() {
  if (!online.value) return
  loadingEstimate.value = true

  try {
    const selections = {}
    localChecklist.value.forEach((item) => {
      const answer = item.match ? item.sellerAnswer : item.localInspectorAnswer
      if (answer === null || answer === '') return
      selections[item.itemKey] = typeof answer === 'boolean' ? (answer ? 'Y' : 'N') : answer
    })

    const newPrice = await estimatePrice(online.value.goodsCategoryId, selections)
    currentExpectedPrice.value = newPrice
    showAlert('알림', '시스템 예상가가 업데이트되었습니다.')
  } catch (err) {
    showAlert('오류', '예상가를 재계산하는 중 오류가 발생했습니다.')
    console.error('예상가 재계산 실패:', err)
  } finally {
    loadingEstimate.value = false
  }
}

// 시세 재조회
async function refetchMarketAvg() {
  if (!online.value?.artistId && !online.value?.goodsCategoryId) {
    showAlert('알림', '시세 조회를 위한 필수 정보(카테고리, 아티스트)가 없습니다.')

    return
  }
  loadingMarketAvg.value = true
  try {
    const res = await getMarketAvgPrice(online.value.goodsCategoryId, online.value.artistId, online.value.albumId)
    currentMarketAvgPrice.value = res.marketAvgPrice
    // showAlert('알림', '최신 시세 정보로 업데이트되었습니다.')
  } catch (err) {
    showAlert('오류', '최신 시세 정보를 가져오는 데 실패했습니다.')
  } finally {
    loadingMarketAvg.value = false
  }
}

// 2차 승인 처리
const approve = async () => {
  if (!approveForm.finalBuyPrice || Number(approveForm.finalBuyPrice) <= 0) {
    showAlert('알림', '최종 매입가를 0보다 큰 값으로 입력해주세요.')
    return
  }

  // BE로 보낼 payload 구성
  const payload = {
    inspectorAnswers: localChecklist.value.map((it) => ({
      itemKey: it.itemKey,
      answerValue: it.match ? safeStr(it.sellerAnswer) : safeStr(it.localInspectorAnswer),
      note: it.localNote || null,
    })),
    inspectionNotes: safeStr(approveForm.inspectionNotes),
    finalBuyPrice: Number(approveForm.finalBuyPrice),
    expectedPrice: currentExpectedPrice.value, // 수정된 예상가
    marketAvgPrice: currentMarketAvgPrice.value, // 갱신된 평균 시세
    priceDeductionReason: safeStr(approveForm.priceDeductionReason),
  }

  loading.value = true
  try {
    console.log(payload)
    await approveOfflineInspection(inspectionId.value, payload)
    closeApproveModal()
    showAlert('알림', '최종 승인이 완료되었습니다.')

    setTimeout(() => router.push('/admin/inspection/offline'), 300)
  } catch (err) {
    console.error('2차 승인 실패:', err)
    showAlert('오류', err.message || '승인 처리 중 오류가 발생했습니다.')
    loading.value = false
  }
}

// 2차 반려 처리
const reject = async () => {
  if (!rejectForm.secondRejectionReason || !rejectForm.secondRejectionReason.trim()) {
    showAlert('알림', '반려 사유를 반드시 입력해야 합니다.')

    return
  }

  const payload = {
    rejectionReason: rejectForm.secondRejectionReason.trim(),
    inspectorAnswers: localChecklist.value.map((it) => ({
      itemKey: it.itemKey,
      answerValue: it.match ? safeStr(it.sellerAnswer) : safeStr(it.localInspectorAnswer),
      note: it.localNote || null,
    })),
  }

  loading.value = true
  try {
    await rejectOfflineInspection(inspectionId.value, payload)
    closeRejectModal()
    showAlert('알림', '반려 처리가 완료되었습니다.')

    setTimeout(() => router.push('/admin/inspection/offline'), 300)
  } catch (err) {
    console.error('2차 반려 실패:', err)
    showAlert('오류', err.message || '반려 처리 중 오류가 발생했습니다.')
    loading.value = false
  }
}

/**
 * API 체크리스트 응답 데이터 기반 로컬 체크리스트 초기화
 * @param {Array} apiChecklist 원본 체크리스트 배열
 */
const initializeLocalChecklist = (apiChecklist) => {
  localChecklist.value = (apiChecklist || []).map((item) => {
    const parseAnswer = (answer) => {
      if (answer == null || answer == undefined) return ''
      try {
        return JSON.parse(answer)
      } catch {
        return answer
      }
    }
    const sellerAnswer = parseAnswer(item.sellerAnswer)
    const inspectorAnswer = item.inspectorAnswer !== null ? parseAnswer(item.inspectorAnswer) : sellerAnswer

    return {
      ...item.checklistItem,
      options: parseOptions(item.checklistItem.options),
      sellerAnswer: sellerAnswer,
      match: JSON.stringify(sellerAnswer) === JSON.stringify(inspectorAnswer), // '일치' 여부 초기값
      localInspectorAnswer: inspectorAnswer, // 관리자 답변 v-model용
      localNote: item.note || '', // 노트 v-model용
    }
  })
}

/**
 * '일치' 스위치 토글 시 호출되는 함수입니다.
 * @param {object} row - localChecklist 배열의 현재 항목
 */
function toggleMatch(row) {
  if (row.match) {
    row.localInspectorAnswer = safeStr(row.sellerAnswer)
    row.localNote = ''
  }
}

// 유틸리티
const safeStr = (v) => (v == null ? '' : String(v).replace(/"/g, ''))
const getImageUrl = (path) => {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  const base = import.meta.env.VITE_FILE_BASE_URL || ''
  return `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
}
const formatDate = (v) => (v ? new Date(v).toLocaleString('ko-KR') : '-')
const formatPrice = (v) => (v != null ? `${Number(v).toLocaleString()}원` : '-')

const openImageModal = (url) => {
  selectedImage.value = url
  showImageModal()
}

// 체크리스트 옵션 파싱
const parseOptions = (raw) => {
  if (raw == null) return []
  if (Array.isArray(raw)) return raw
  try {
    return JSON.parse(raw)
  } catch (e) {
    console.log('JSON 파싱 실패: ', raw, e)
    return []
  }
}

// 승인/반려 버튼 활성화 조건
const canDecide = computed(() => online.value?.inspectionStatus === 'OFFLINE_INSPECTING')
</script>

<template>
  <main class="container-fluid p-4">
    <div class="card shadow-sm border-0 rounded-3 overflow-hidden">
      <div class="card-header bg-white border-bottom-0 pt-4 px-4 pb-2">
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <h4 class="fw-semibold text-dark mb-1">2차 오프라인 검수 상세</h4>
            <p class="text-muted small mb-0">사진/실물 비교로 항목별 일치 여부를 확인하고 최종 승인 또는 반려를 진행합니다.</p>
          </div>
          <div class="d-flex align-items-center">
            <button class="btn btn-sm btn-outline-secondary fw-medium px-3" @click="router.back()">목록</button>
            <div v-if="canDecide" class="ml-2">
              <button class="btn btn-sm btn-danger fw-medium px-3" @click="openRejectModal">반려</button>
              <button class="btn btn-sm btn-primary fw-medium px-3 ml-2" @click="openApproveModal">승인</button>
            </div>
          </div>
        </div>
      </div>

      <div class="card-body p-4">
        <div v-if="online && online.inspectionStatus === 'OFFLINE_REJECTED'" class="alert alert-danger" role="alert">
          <h6 class="alert-heading fw-bold">2차 반려 사유</h6>
          <p class="mb-0">{{ detail.secondRejectionReason }}</p>
        </div>
        <div v-if="online && online.inspectionStatus === 'COMPLETED'" class="alert alert-info" role="alert">
          <h6 class="alert-heading fw-bold">검수자 승인 노트</h6>
          <p class="mb-0">{{ detail.inspectionNotes }}</p>
        </div>

        <div v-if="loading" class="text-center py-5">
          <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem"></div>
          <p class="mt-3 text-muted">데이터를 불러오는 중입니다...</p>
        </div>

        <div v-if="detail && online" class="row g-4 g-lg-5" :class="{ 'mt-0': online.inspectionStatus === 'OFFLINE_REJECTED' }">
          <div class="col-lg-5">
            <section>
              <div class="d-flex justify-content-between align-items-start mb-3">
                <h5 class="fw-semibold mb-0">검수 정보</h5>
                <span :class="['badge fs-6', adminStore.getStatusBadge(online.inspectionStatus)]">
                  {{ adminStore.getStatusLabel(online.inspectionStatus) }}
                </span>
              </div>
              <div class="bg-light rounded-3 p-3">
                <dl class="info-grid small">
                  <dt>검수 ID</dt>
                  <dd>#{{ online.productInspectionId }}</dd>
                  <dt>제출일</dt>
                  <dd>{{ formatDate(online.submittedAt) }}</dd>
                  <dt>UUID</dt>
                  <dd class="text-break">{{ online.submissionUuid }}</dd>
                  <template v-if="online.firstInspector">
                    <dt>1차 검수자</dt>
                    <dd>#{{ online.firstInspector.id }} {{ online.firstInspector.name }}</dd>
                  </template>
                  <template v-if="detail.secondInspector">
                    <dt>2차 검수자</dt>
                    <dd>#{{ detail.secondInspector.id }} {{ detail.secondInspector.name }}</dd>
                  </template>
                </dl>
              </div>
            </section>

            <section class="mt-4 pt-2">
              <h5 class="fw-semibold border-bottom pb-2 mb-3">상품 정보</h5>
              <dl class="info-grid">
                <dt>상품명</dt>
                <dd>{{ online.itemName || '-' }}</dd>
                <dt>카테고리</dt>
                <dd>{{ online.goodsCategoryName || '-' }}</dd>
                <dt>아티스트</dt>
                <dd>{{ online.artistName || '-' }}</dd>
                <dt v-if="online.albumTitle != null || online.albumTitle != undefined">앨범명</dt>
                <dd v-if="online.albumTitle != null || online.albumTitle != undefined">{{ online.albumTitle || '-' }}</dd>
                <dt>상품 설명</dt>
                <dd>{{ online.itemDescription || '-' }}</dd>
              </dl>
            </section>

            <section class="mt-4 pt-2">
              <h5 class="fw-semibold border-bottom pb-2 mb-3">가격 정보</h5>
              <dl class="info-grid">
                <dt>판매자 희망가</dt>
                <dd class="text-primary fw-bold">{{ formatPrice(online.sellerHopePrice) }}</dd>
                <dt>시스템 예상가</dt>
                <dd>{{ currentExpectedPrice ? formatPrice(currentExpectedPrice) : '-' }}</dd>
                <dt>팬트리 평균가</dt>
                <dd class="d-flex justify-content-between align-items-center">
                  <span>{{ currentMarketAvgPrice ? formatPrice(currentMarketAvgPrice) : '-' }}</span>
                  <button v-if="canDecide" class="btn btn-sm btn-outline-secondary py-0 px-2" @click="refetchMarketAvg" :disabled="loadingMarketAvg">
                    <span v-if="loadingMarketAvg" class="spinner-border spinner-border-sm" role="status"></span>
                    <span v-else>시세 재조회</span>
                  </button>
                </dd>
              </dl>
            </section>

            <section class="mt-4 pt-2">
              <h5 class="fw-semibold border-bottom pb-2 mb-3">판매자 정보</h5>
              <dl class="info-grid">
                <dt>판매자 ID</dt>
                <dd>{{ online.seller?.id || '-' }}</dd>
                <dt>이름</dt>
                <dd>{{ online.seller?.name || '-' }}</dd>
                <dt>연락처</dt>
                <dd>{{ online.seller?.tel || '-' }}</dd>
                <dt>배송 주소</dt>
                <dd>{{ online.shippingAddress }} {{ online.shippingAddressDetail }}</dd>
                <dt>정산 계좌</dt>
                <dd>{{ online.bankName }} / {{ online.bankAccount }}</dd>
              </dl>
            </section>
          </div>

          <div class="col-lg-7">
            <section>
              <h5 class="fw-semibold border-bottom pb-2 mb-3">체크리스트</h5>
              <div v-if="localChecklist.length" class="checklist-table">
                <div class="cl-row cl-head">
                  <div class="cl-col label">항목</div>
                  <div class="cl-col seller">셀러</div>
                  <div class="cl-col match text-center">일치</div>
                  <div class="cl-col inspector">관리자</div>
                  <div class="cl-col note">노트</div>
                </div>
                <div v-for="row in localChecklist" :key="row.checklistItemId" class="cl-row">
                  <div class="cl-col label">{{ row.label }}</div>
                  <div class="cl-col seller text-primary">
                    {{ row.sellerAnswer === true ? '예' : row.sellerAnswer === false ? '아니오' : row.sellerAnswer }}
                  </div>
                  <div class="cl-col match text-center">
                    <div class="form-check form-switch d-inline-flex align-items-center">
                      <input class="form-check-input" type="checkbox" v-model="row.match" @change="toggleMatch(row)" :disabled="!canDecide" />
                    </div>
                  </div>
                  <div class="cl-col inspector">
                    <template v-if="!row.match">
                      <select v-if="row.type === 'SELECT'" class="form-control form-control-sm" v-model="row.localInspectorAnswer" :disabled="!canDecide">
                        <option value="">선택하세요</option>
                        <option v-for="opt in row.options" :key="opt" :value="opt">{{ opt }}</option>
                      </select>

                      <div v-else-if="row.type === 'BOOL'" class="d-flex align-items-center small">
                        <div class="form-check form-check-inline">
                          <input class="form-check-input" type="radio" :name="`inspector_${row.itemKey}`" v-model="row.localInspectorAnswer" :value="true" :disabled="!canDecide" />
                          <label class="form-check-label">예</label>
                        </div>
                        <div class="form-check form-check-inline">
                          <input class="form-check-input" type="radio" :name="`inspector_${row.itemKey}`" v-model="row.localInspectorAnswer" :value="false" :disabled="!canDecide" />
                          <label class="form-check-label">아니오</label>
                        </div>
                      </div>

                      <input v-else type="text" class="form-control form-control-sm" v-model="row.localInspectorAnswer" :disabled="!canDecide" />
                    </template>
                    <span v-else class="text-muted small">셀러와 동일</span>
                  </div>
                  <div class="cl-col note">
                    <textarea v-if="!row.match" rows="2" class="form-control form-control-sm" v-model="row.localNote" :disabled="!canDecide" placeholder="감가 또는 특이사항 메모"></textarea>
                    <span v-else class="text-muted small">-</span>
                  </div>
                </div>
              </div>
              <p v-else class="text-muted small mb-0">체크리스트 항목이 없습니다.</p>
              <div v-if="canDecide" class="text-right mt-3">
                <button class="btn btn-info" @click="recalculateExpectedPrice" :disabled="loadingEstimate">
                  <span v-if="loadingEstimate" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  예상가 계산
                </button>
              </div>
            </section>

            <section class="mt-4 pt-2">
              <h5 class="fw-semibold border-bottom pb-2 mb-3">상품 이미지</h5>
              <div v-if="online.files.length" class="d-flex flex-wrap">
                <div v-for="file in online.files" :key="file.fileId" class="thumbnail-wrapper mr-2 mb-2" @click="openImageModal(getImageUrl(file.fileUrl))">
                  <img :src="getImageUrl(file.fileUrl)" alt="상품 썸네일" />
                </div>
              </div>
              <p v-else class="text-muted small mb-0">등록된 이미지가 없습니다.</p>
            </section>
          </div>
        </div>

        <div v-else class="text-center py-5">
          <p class="text-muted">검수 정보를 찾을 수 없습니다.</p>
        </div>
      </div>
    </div>

    <!-- 이미지 모달 -->
    <div class="modal fade" id="imageModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-body text-center">
            <img :src="selectedImage" class="img-fluid rounded" alt="preview" />
          </div>
        </div>
      </div>
    </div>

    <!-- 승인 모달 -->
    <div class="modal fade" id="approveModal" tabindex="-1">
      <div class="modal-dialog modal-md modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h6 class="modal-title">최종 승인</h6>
            <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
          </div>
          <div class="modal-body">
            <div class="mb-3 p-3 bg-light rounded small">
              <h6 class="mb-2 font-weight-bold">참고 가격</h6>
              <div class="d-flex justify-content-between">
                <span>시스템 예상가</span>
                <strong>{{ formatPrice(currentExpectedPrice) }}</strong>
              </div>
              <div class="d-flex justify-content-between">
                <span>판매자 희망가</span>
                <strong>{{ formatPrice(online?.sellerHopePrice) }}</strong>
              </div>
              <div class="d-flex justify-content-between mt-1">
                <span>평균 시세</span>
                <strong>{{ formatPrice(currentMarketAvgPrice) }}</strong>
              </div>
            </div>
            <div class="mb-3">
              <label class="form-label">최종 매입가<span class="text-danger">*</span></label>
              <input type="number" class="form-control" v-model.number="approveForm.finalBuyPrice" placeholder="예: 35,000" />
            </div>
            <div class="mb-3">
              <label class="form-label">감가 사유</label>
              <textarea rows="2" class="form-control" v-model="approveForm.priceDeductionReason" placeholder="감가 사유를 간단히 기록하세요."></textarea>
            </div>
            <div class="mb-0">
              <label class="form-label">검수 메모</label>
              <textarea rows="2" class="form-control" v-model="approveForm.inspectionNotes" placeholder="내부 참고용 메모"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-dismiss="modal">취소</button>
            <button class="btn btn-primary" @click="approve">승인 완료</button>
          </div>
        </div>
      </div>
    </div>

    <div class="modal fade" id="rejectModal" tabindex="-1">
      <div class="modal-dialog modal-md modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h6 class="modal-title">반려 처리</h6>
            <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
          </div>
          <div class="modal-body">
            <label class="form-label">반려 사유<span class="text-danger">*</span></label>
            <textarea rows="3" class="form-control" v-model="rejectForm.secondRejectionReason" placeholder="반려 사유를 입력하세요."></textarea>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-dismiss="modal">취소</button>
            <button class="btn btn-danger" @click="reject">반려 확정</button>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped lang="scss">
/* 카드 헤더 제목 */
.card-header h4 {
  font-size: 1.25rem;
}
/* 정보 표시 그리드 */
.info-grid {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 0.8rem 1rem;
  dt {
    color: #555;
    font-weight: 500;
  }
  dd {
    margin: 0;
    color: #222;
    word-break: break-word;
    min-width: 0;
  }
  &.small {
    grid-template-columns: 80px 1fr;
    gap: 0.5rem 1rem;
  }
}
/* 썸네일 이미지 */
.thumbnail-wrapper {
  width: 80px;
  height: 80px;
  border-radius: 0.5rem;
  overflow: hidden;
  cursor: pointer;
  border: 1px solid #dee2e6;
  background-color: #f8f9fa;
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.2s;
  }
  &:hover img {
    transform: scale(1.1);
  }
}

/* 체크리스트 테이블 */
.checklist-table {
  border: 1px solid #eaeaea;
  border-radius: 0.5rem;
  overflow: hidden;
  .cl-row {
    display: grid;
    grid-template-columns: 1.2fr 1.1fr 0.5fr 1.1fr 1.4fr;
    border-top: 1px solid #eee;
  }
  .cl-head {
    background: #f9fafb;
    font-weight: 600;
    border-top: 0;
  }
  .cl-col {
    padding: 0.6rem 0.7rem;
    display: flex;
    align-items: center;
  }
  .label {
    color: #333;
  }
  .seller {
    color: #0d6efd;
  }
  .match {
    justify-content: center;
  }
  .note textarea {
    resize: vertical;
  }
}

/* 이미지 모달 스타일 추가 */
#imageModal .modal-content {
  background: transparent; /* 배경 투명하게 */
  border: none; /* 테두리 제거 */
}
#imageModal .modal-body {
  padding: 0; /* 내부 여백 제거 */
}
</style>
