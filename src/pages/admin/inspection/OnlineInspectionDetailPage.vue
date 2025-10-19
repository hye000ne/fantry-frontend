<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useModal } from '@/composables/useModal'
import { getOnlineInspectionDetail, approveOnlineInspection, rejectOnlineInspection } from '@/api/adminInspection'
import { useAdminInspectionStore } from '@/stores/adminInspectionStore'
import { useAlertDialog } from '@/composables/useAlertDialog.js'

const { showAlert } = useAlertDialog()
const router = useRouter()
const route = useRoute()
const adminStore = useAdminInspectionStore()

// 상태
const loading = ref(false)
const detail = ref(null)
const inspectionId = ref(null)

// 이미지 모달
const selectedImage = ref(null)
const { initModal: initImageModal, show: showImageModal } = useModal('#imageModal')

// 반려 모달
const rejectForm = reactive({ rejectionReason: '' })
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
  initRejectModal()
})

// 온라인 검수 상세 API 조회
async function fetchDetail(id) {
  loading.value = true
  try {
    const res = await getOnlineInspectionDetail(id)
    detail.value = {
      ...res,
      files: res.files || [],
      answers: res.answers || [],
      seller: res.seller || {},
    }
    console.log(detail.value)
  } catch (err) {
    console.error('검수 상세 조회 실패:', err)
    showAlert('오류', err.message || '데이터를 불러오는 데 실패했습니다.')
  } finally {
    loading.value = false
  }
}

// 1차 승인 처리
const approve = async () => {
  const isConfirmed = await showAlert('확인', '정말로 승인 처리하시겠습니까?', true)

  if (!isConfirmed) return

  try {
    await approveOnlineInspection(inspectionId.value)
    showAlert('알림', '승인 처리가 완료되었습니다.')
    setTimeout(() => router.push('/admin/inspection/online'), 300)
  } catch (err) {
    console.error('승인 처리 실패:', err)
    showAlert('오류', err.message || '승인 처리 중 오류가 발생했습니다.')
  } finally {
    loading.value = false
  }
}

// 1차 반려 처리 (모달 제출 시)
const reject = async () => {
  if (!rejectForm.rejectionReason || !rejectForm.rejectionReason.trim()) {
    showAlert('알림', '반려 사유를 반드시 입력해야 합니다.')
    return
  }
  loading.value = true
  try {
    const reason = rejectForm.rejectionReason.trim()
    await rejectOnlineInspection(inspectionId.value, { rejectionReason: reason })
    closeRejectModal()
    showAlert('알림', '반려 처리가 완료되었습니다.')
    setTimeout(() => router.push('/admin/inspection/online'), 300)
  } catch (err) {
    console.error('반려 처리 실패:', err)
    showAlert('오류', err.message || '반려 처리 중 오류가 발생했습니다.')
  } finally {
    loading.value = false
  }
}

// 유틸리티
const getImageUrl = (path) => {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  const base = import.meta.env.VITE_FILE_BASE_URL || ''
  return `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
}
const formatDate = (v) => (v ? new Date(v).toLocaleString('ko-KR') : '-')
const formatPrice = (v) => (v != null ? `${Number(v).toLocaleString()}원` : '-')
const cleanString = (v) => v?.replace(/"/g, '') || '-'

// 이미지 모달 열기
const openImageModal = (url) => {
  selectedImage.value = url
  showImageModal()
}
</script>

<template>
  <main class="container-fluid p-4">
    <div class="card shadow-sm border-0 rounded-3 overflow-hidden">
      <div class="card-header bg-white border-bottom-0 pt-4 px-4 pb-2">
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <h4 class="fw-semibold text-dark mb-1">1차 온라인 검수 상세</h4>
            <p class="text-muted small mb-0">판매자가 제출한 상품의 상세 정보를 확인하고 승인 또는 반려를 진행합니다.</p>
          </div>

          <div class="d-flex align-items-center">
            <button class="btn btn-sm btn-outline-secondary fw-medium px-3" @click="router.back()">목록</button>
            <div v-if="detail && detail.inspectionStatus === 'SUBMITTED'" class="ml-2">
              <button class="btn btn-sm btn-danger fw-medium px-3" @click="openRejectModal">반려</button>
              <button class="btn btn-sm btn-primary fw-medium px-3 ml-2" @click="approve">승인</button>
            </div>
          </div>
        </div>
      </div>

      <div class="card-body p-4">
        <div v-if="detail && detail.inspectionStatus === 'ONLINE_REJECTED'" class="alert alert-danger" role="alert">
          <h6 class="alert-heading fw-bold">1차 반려 사유</h6>
          <p class="mb-0">{{ detail.firstRejectionReason }}</p>
        </div>

        <div v-if="loading" class="text-center py-5">
          <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem"></div>
          <p class="mt-3 text-muted">데이터를 불러오는 중입니다...</p>
        </div>

        <div v-else-if="detail" class="row g-4 g-lg-5">
          <div class="col-lg-6">
            <section>
              <div class="d-flex justify-content-between align-items-start mb-3">
                <h5 class="fw-semibold mb-0">검수 정보</h5>
                <span :class="['badge fs-6', adminStore.getStatusBadge(detail.inspectionStatus)]">
                  {{ adminStore.getStatusLabel(detail.inspectionStatus) }}
                </span>
              </div>
              <div class="bg-light rounded-3 p-3">
                <dl class="info-grid small">
                  <dt>검수 ID</dt>
                  <dd>#{{ detail.productInspectionId }}</dd>
                  <dt>제출일</dt>
                  <dd>{{ formatDate(detail.submittedAt) }}</dd>
                  <dt>UUID</dt>
                  <dd class="text-break">{{ detail.submissionUuid }}</dd>
                  <template v-if="detail.firstInspector && detail.firstInspector.id">
                    <dt>1차 검수자</dt>
                    <dd>#{{ detail.firstInspector.id }} {{ detail.firstInspector.name }}</dd>
                  </template>
                </dl>
              </div>
            </section>

            <section class="mt-4 pt-2">
              <h5 class="fw-semibold border-bottom pb-2 mb-3">상품 정보</h5>
              <dl class="info-grid">
                <dt>상품명</dt>
                <dd>{{ detail.itemName || '-' }}</dd>
                <dt>카테고리</dt>
                <dd>{{ detail.goodsCategoryName || '-' }}</dd>
                <dt>아티스트</dt>
                <dd>{{ detail.artistName || '-' }}</dd>
                <dt v-if="detail.albumTitle != null || detail.albumTitle != undefined">앨범명</dt>
                <dd v-if="detail.albumTitle != null || detail.albumTitle != undefined">{{ detail.albumTitle || '-' }}</dd>
                <dt>상품 설명</dt>
                <dd>{{ detail.itemDescription || '-' }}</dd>
              </dl>
            </section>

            <section class="mt-4 pt-2">
              <h5 class="fw-semibold border-bottom pb-2 mb-3">가격 정보</h5>
              <dl class="info-grid">
                <dt>판매자 희망가</dt>
                <dd class="text-primary fw-bold">{{ formatPrice(detail.sellerHopePrice) }}</dd>
                <dt>시스템 예상가</dt>
                <dd>{{ formatPrice(detail.expectedPrice) }}</dd>
                <dt>팬트리 평균가</dt>
                <dd>{{ detail.marketAvgPrice ? formatPrice(detail.marketAvgPrice) : '-' }}</dd>
              </dl>
            </section>
            <section class="mt-4 pt-2">
              <h5 class="fw-semibold border-bottom pb-2 mb-3">판매자 정보</h5>
              <dl class="info-grid">
                <dt>판매자 ID</dt>
                <dd>{{ detail.seller.id || '-' }}</dd>
                <dt>이름</dt>
                <dd>{{ detail.seller.name || '-' }}</dd>
                <dt>연락처</dt>
                <dd>{{ detail.seller.tel || '-' }}</dd>
                <dt>배송 주소</dt>
                <dd>{{ detail.shippingAddress }} {{ detail.shippingAddressDetail }}</dd>
                <dt>정산 계좌</dt>
                <dd>{{ detail.bankName }} / {{ detail.bankAccount }}</dd>
              </dl>
            </section>
          </div>

          <div class="col-lg-6">
            <section>
              <h5 class="fw-semibold border-bottom pb-2 mb-3">셀러 체크리스트</h5>
              <div v-if="detail.answers.length">
                <dl class="info-grid info-grid-wide">
                  <template v-for="answer in detail.answers" :key="answer.itemKey">
                    <dt>{{ answer.itemLabel }}</dt>
                    <dd class="text-primary">{{ cleanString(answer.answerValue) }}</dd>
                  </template>
                </dl>
              </div>
              <p v-else class="text-muted small mb-0">체크리스트 답변이 없습니다.</p>
            </section>

            <section class="mt-4 pt-2">
              <h5 class="fw-semibold border-bottom pb-2 mb-3">상품 이미지</h5>
              <div v-if="detail.files.length" class="d-flex flex-wrap">
                <div v-for="file in detail.files" :key="file.fileId" class="thumbnail-wrapper mr-2 mb-2" @click="openImageModal(getImageUrl(file.fileUrl))">
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

    <!-- 반려 모달 -->
    <div class="modal fade" id="rejectModal" tabindex="-1">
      <div class="modal-dialog modal-md modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h6 class="modal-title">반려 처리</h6>
            <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
          </div>
          <div class="modal-body">
            <label class="form-label">반려 사유<span class="text-danger">*</span></label>
            <textarea rows="3" class="form-control" v-model="rejectForm.rejectionReason" placeholder="판매자에게 전달될 반려 사유를 입력하세요."></textarea>
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

/* 정보 표시 그리드 기본 스타일 */
.info-grid {
  display: grid;
  grid-template-columns: 120px 1fr; /* 기본 라벨 너비 */
  gap: 0.8rem 1rem;

  dt {
    color: #555;
    font-weight: 500;
    flex-shrink: 0;
  }

  dd {
    margin: 0;
    color: #222;
    word-break: break-word; /* 긴 텍스트 줄바꿈 처리 */
    min-width: 0; /* 그리드 컨테이너 내에서 줄바꿈이 잘 동작하도록 함 */
  }

  /* 검수 정보처럼 작은 그리드 */
  &.small {
    grid-template-columns: 80px 1fr;
    gap: 0.5rem 1rem;
  }
}

/* 체크리스트처럼 넓은 라벨이 필요한 그리드 */
.info-grid-wide {
  grid-template-columns: 200px 1fr; /* 확장된 라벨 너비 */
}

/* 썸네일 이미지 스타일 */
.thumbnail-wrapper {
  width: 120px;
  height: 120px;
  border-radius: 0.5rem;
  overflow: hidden;
  cursor: pointer;
  border: 1px solid #dee2e6;
  background-color: #f8f9fa;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.2s ease-in-out;
  }

  &:hover img {
    transform: scale(1.1);
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
