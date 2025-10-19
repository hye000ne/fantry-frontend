<script setup>
import { useRouter } from 'vue-router'
import { ref, onMounted } from 'vue'
import { submitInspection } from '@/api/userInspection.js'
import { useInspectionStore } from '@/stores/inspectionStore'
import { useModal } from '@/composables/useModal'
import { storeToRefs } from 'pinia'
import { useAlertDialog } from '@/composables/useAlertDialog.js';

const router = useRouter()
const inspectionStore = useInspectionStore()
const {showAlert} = useAlertDialog();

// 로컬 상태
const isAgreed = ref(false) // 정책 동의 여부
const isLoading = ref(false) // 신청 완료 API 로딩 상태
const error = ref(null) // API 에러 메시지

// Store 값 가져오기
const {
  selectedCategory,
  selectedCategoryValue,
  selectedArtist,
  selectedAlbum,
  itemName,
  itemDescription,
  hashtags,
  checklists,
  answers,
  expectedPrice,
  marketAvgPrice,
  sellerHopePrice,
  uploadedFiles,
  shippingAddress,
  shippingAddressDetail,
  bankName,
  bankAccount,
  completedStep,
} = storeToRefs(inspectionStore)

// 정책 모달
const { initModal: initPolicyModal, show: showPolicyModal, hide: closePolicyModal } = useModal('#policyModal')
// 이미지 모달
const selectedImage = ref(null)
const { initModal: initImageModal, show: showImageModal } = useModal('#imageModal')
// 썸네일 이미지 클릭 시 큰 이미지 모달
const openImageModal = (url) => {
  selectedImage.value = url
  showImageModal()
}

// 체크리스트 답변 -> 화면 표시 텍스트
const formatAnswer = (answer) => {
  if (answer === true) return '예'
  if (answer === false) return '아니오'
  if (answer === null || answer === '') return '-'

  return answer
}

// 가격 포맷
const formatPrice = (price) => {
  if (price === null || price === undefined) return '데이터 없음'
  return price.toLocaleString() + '원'
}

// 정책 동의
const agreeToPolicy = () => {
  isAgreed.value = true
  closePolicyModal()
}

// 이전 단계
const goPrev = () => {
  router.push('/inspection/step2')
}

// 신청 완료 버튼 클릭 시
const submit = async () => {
  if (isLoading.value) return

  if (!isAgreed.value) {
    showAlert('알림', '검수 및 판매 정책에 동의해주세요.')
    openPolicyModal()
    return
  }

  isLoading.value = true
  error.value = null

  try {
    const inspectionData = {
      selectedCategory: selectedCategory.value,
      selectedArtist: selectedArtist.value,
      selectedAlbum: selectedAlbum.value,
      itemName: itemName.value,
      itemDescription: itemDescription.value,
      hashtags: hashtags.value.join(', '),
      answers: answers.value,
      expectedPrice: expectedPrice.value,
      marketAvgPrice: marketAvgPrice.value,
      sellerHopePrice: sellerHopePrice.value,
      uploadedFiles: uploadedFiles.value,
      shippingAddress: shippingAddress.value,
      shippingAddressDetail: shippingAddressDetail.value,
      bankName: bankName.value,
      bankAccount: bankAccount.value,
      templateId: inspectionStore.templateId,
      templateVersion: inspectionStore.templateVersion,
    }

    await submitInspection(inspectionData)
    showAlert('알림', '검수 신청이 성공적으로 완료되었습니다!')
    inspectionStore.$reset()
    router.push('/')
  } catch (err) {
    error.value = err?.message || '신청 처리 중 오류가 발생했습니다.'
    showAlert('오류', error.value)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  if (completedStep.value < 2) {
    showAlert('경고', '잘못된 접근입니다. 이전 단계를 먼저 완료해주세요.')
    router.replace('/inspection/step1')
  }

  initImageModal()
  initPolicyModal()
})
</script>

<template>
  <div v-if="isLoading" class="loading-overlay">
    <div class="spinner-border text-primary" style="width: 3rem; height: 3rem" role="status">
      <span class="sr-only">Loading...</span>
    </div>
    <p class="mt-3 text-white">신청 정보를 제출 중입니다...</p>
  </div>

  <main class="bg-light py-5 inspection">
    <div class="container">
      <div class="mb-4 text-center">
        <h2 class="font-weight-bold">온라인 1차 검수 신청</h2>
      </div>

      <div class="mb-5">
        <p class="text-primary font-weight-bold mb-1">[3 / 3] 신청 내용 확인</p>
        <div class="progress" style="height: 6px">
          <div class="progress-bar bg-primary" style="width: 100%"></div>
        </div>
      </div>

      <div class="card shadow-sm mb-4">
        <div class="card-body">
          <h5 class="font-weight-bold mb-4">신청 정보 요약</h5>

          <!-- 상품 정보 -->
          <div class="mb-4">
            <h6 class="font-weight-bold">상품 정보</h6>
            <dl class="row mt-3">
              <dt class="col-sm-3 text-muted">카테고리</dt>
              <dd class="col-sm-9">{{ selectedCategoryValue?.name || '-' }}</dd>

              <dt class="col-sm-3 text-muted">아티스트</dt>
              <dd class="col-sm-9">{{ selectedArtist?.nameKo || '-' }}</dd>

              <dt class="col-sm-3 text-muted">앨범</dt>
              <dd class="col-sm-9">{{ selectedAlbum?.title || '-' }}</dd>

              <dt class="col-sm-3 text-muted">상품명</dt>
              <dd class="col-sm-9">{{ itemName || '-' }}</dd>

              <dt class="col-sm-3 text-muted">설명</dt>
              <dd class="col-sm-9">{{ itemDescription || '-' }}</dd>

              <dt class="col-sm-3 text-muted">해시태그</dt>
              <dd class="col-sm-9">{{ hashtags || '-' }}</dd>
            </dl>
          </div>

          <div class="border-top pt-3 mb-4">
            <h6 class="font-weight-bold">상세 체크리스트</h6>
            <dl class="row mt-3" v-if="checklists.length > 0">
              <template v-for="c in checklists" :key="c.checklistItemId">
                <dt class="col-sm-3 text-muted">{{ c.label }}</dt>
                <dd class="col-sm-9">{{ formatAnswer(answers[c.itemKey]) }}</dd>
              </template>
            </dl>
            <p v-else class="text-muted">선택된 체크리스트가 없습니다.</p>
          </div>

          <div class="border-top pt-3 mb-4">
            <h6 class="font-weight-bold">가격 정보</h6>
            <dl class="row mt-3">
              <dt class="col-sm-3 text-muted">시스템 예상가</dt>
              <dd class="col-sm-9">{{ formatPrice(expectedPrice) }}</dd>

              <dt class="col-sm-3 text-muted">평균 시세</dt>
              <dd class="col-sm-9">{{ formatPrice(marketAvgPrice) }}</dd>

              <dt class="col-sm-3 text-muted">판매 희망가</dt>
              <dd class="col-sm-9">{{ formatPrice(sellerHopePrice) }}</dd>
            </dl>
          </div>

          <div class="border-top pt-3 mb-4">
            <h6 class="font-weight-bold">배송 및 정산 정보</h6>
            <dl class="row mt-3">
              <dt class="col-sm-3 text-muted">배송 주소</dt>
              <dd class="col-sm-9">{{ shippingAddress }} {{ shippingAddressDetail }}</dd>

              <dt class="col-sm-3 text-muted">정산 계좌</dt>
              <dd class="col-sm-9">[{{ bankName }}] {{ bankAccount }}</dd>
            </dl>
          </div>

          <div class="border-top pt-3 mb-4">
            <h6 class="font-weight-bold">업로드된 사진</h6>
            <div class="d-flex gap-2 mt-3 flex-wrap">
              <div v-for="f in uploadedFiles" :key="f.previewUrl" class="thumbnail-wrapper">
                <img :src="f.previewUrl" class="img-thumbnail rounded" :alt="f.file?.name || 'uploaded-image'" @click="openImageModal(f.previewUrl)" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="mb-3 form-check">
        <input class="form-check-input" type="checkbox" id="agree" :checked="isAgreed" disabled />
        <label class="form-check-label" for="agree" @click.prevent="showPolicyModal" style="cursor: pointer">
          검수 및 판매 대행 정책에 모두 동의합니다.
          <span class="text-primary font-weight-bold ml-2">(내용 보기)</span>
        </label>
      </div>

      <div class="d-flex justify-content-between mt-4">
        <button class="btn btn-secondary px-5" @click="goPrev" :disabled="isLoading">이전 단계</button>
        <button class="btn btn-primary px-5" @click="submit" :disabled="!isAgreed || isLoading">
          <span v-if="isLoading" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
          {{ isLoading ? '신청 처리 중...' : '신청 완료' }}
        </button>
      </div>
    </div>
  </main>

  <div class="modal fade" id="policyModal" role="dialog" aria-modal="true" aria-labelledby="policyModalTitle" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
      <div class="modal-content">
        <div class="modal-header">
          <h5 id="policyModalTitle" class="modal-title font-weight-bold">검수 및 판매 대행 정책</h5>
          <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
        </div>
        <div class="modal-body">
          <p>검수 신청 전, 아래의 판매 대행 정책을 반드시 확인하고 동의해주세요.</p>

          <h6><strong>제 1조: 판매 가격 결정 정책</strong></h6>
          <p>1. 판매자는 '판매 희망가'를 제안할 수 있습니다.</p>
          <p>2. 판매자의 '판매 희망가'가 당사가 산정한 '시스템 예상가'의 150%를 초과할 경우, 해당 상품은 우선적으로 <strong>경매 방식</strong>으로 판매가 진행됩니다.</p>
          <ul>
            <li>경매 시작가는 판매자의 '판매 희망가'로 설정됩니다.</li>
            <li>경매는 48시간 동안 진행되며, 최고가에 낙찰됩니다.</li>
          </ul>
          <p>
            3. 경매가 유찰된 경우(48시간 내에 입찰자가 없는 경우), 상품은 당사의 내부 가격 정책에 따라 최종 판매가가 결정되어 경매/일반 판매로 전환됩니다.
            최종 판매가는 '시스템 예상가'와 '평균 시세' 등을 종합적으로 고려하여 산정됩니다.
          </p>

          <h6><strong>제 2조: 검수 및 등급 판정</strong></h6>
          <p>1. 온라인 1차 검수 신청 내용과 실제 상품의 상태가 현저히 다를 경우, 검수가 반려되거나 판매 가격이 조정될 수 있습니다.</p>

          <hr />
          <p class="font-weight-bold">위 정책에 동의하고 검수 신청을 진행하시겠습니까?</p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-dismiss="modal">닫기</button>
          <button type="button" class="btn btn-primary" @click="agreeToPolicy">확인 및 동의</button>
        </div>
      </div>
    </div>
  </div>

  <!-- 이미지 모달 -->
  <div class="modal fade" id="imageModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-body text-center">
          <img :src="selectedImage" class="img-fluid rounded" alt="preview" />
        </div>
      </div>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.thumbnail-wrapper {
  position: relative;
  display: inline-block;

  img {
    width: 100px;
    height: 100px;
    object-fit: cover;
    border-radius: 6px;
  }
}
dl {
  font-size: 0.95rem;
}
dt {
  font-weight: 400;
}
dd {
  font-weight: 500;
  color: #333;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 1040;
}
</style>
